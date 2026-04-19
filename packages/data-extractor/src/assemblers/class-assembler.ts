/**
 * Class catalog assembler.
 *
 * Reads classes.2da from nwsync, filters to PlayerClass=1 rows, resolves
 * TLK names/descriptions to Spanish text, and produces a validated
 * ClassCatalog payload.
 *
 * @module
 */

import { parseTwoDa, type TwoDaTable } from '../parsers/two-da-parser';
import { classCatalogSchema, type ClassCatalog, type CompiledClass } from '../contracts/class-catalog';
import { RESTYPE_2DA } from '../config';
import type { NwsyncReader } from '../readers/nwsync-reader';
import type { BaseGameReader } from '../readers/base-game-reader';
import type { TlkResolver } from '../readers/tlk-resolver';
import { isSentinelLabel } from '../lib/sentinel-regex';
import { canonicalId } from './slug-utils';

/** Map PrimaryAbil column values to normalized ability keys. */
const ABILITY_MAP: Record<string, 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'> = {
  STR: 'str',
  DEX: 'dex',
  CON: 'con',
  INT: 'int',
  WIS: 'wis',
  CHA: 'cha',
};

/**
 * Map AttackBonusTable column values to BAB progression names.
 * CLS_ATK_1 = high (full BAB), CLS_ATK_2 = medium (3/4 BAB), CLS_ATK_3 = low (1/2 BAB).
 */
const BAB_MAP: Record<string, 'low' | 'medium' | 'high'> = {
  CLS_ATK_1: 'high',
  CLS_ATK_2: 'medium',
  CLS_ATK_3: 'low',
};

/**
 * Derive saving throw progressions from the SavingThrowTable reference.
 *
 * NWN1 saving throw tables follow a naming convention in the 2DA data.
 * Since the actual tables are not always in nwsync, we use known class
 * archetypes to map saving throw profiles. The SavingThrowTable column
 * references a table like CLS_SAVTHR_BARB, CLS_SAVTHR_ROG, etc.
 *
 * Known NWN1 patterns:
 *   - Fighter/Barbarian/Paladin/Ranger: Fort high, Ref low, Will low
 *   - Rogue/Bard/Monk: Ref high (varies by class)
 *   - Cleric/Druid: Fort high, Will high
 *   - Wizard/Sorcerer: Will high
 *
 * Since we cannot parse the actual save tables from nwsync (they are base-game only),
 * we store the table reference and default to a heuristic based on the table name.
 */
function deriveSavingThrows(
  savingThrowTable: string | null,
): { fortitude: 'low' | 'high'; reflex: 'low' | 'high'; will: 'low' | 'high' } {
  if (!savingThrowTable) {
    return { fortitude: 'low', reflex: 'low', will: 'low' };
  }

  const ref = savingThrowTable.toUpperCase();

  // Known high-fort classes
  const highFort = [
    'BARB', 'FIGHT', 'PAL', 'RANG', 'CLER', 'DRU', 'MONK',
    'BLKGRD', 'DWDEF', 'CAV', 'PDK', 'SOL',
  ];
  // Known high-ref classes
  const highRef = [
    'ROG', 'BARD', 'MONK', 'RANG', 'SHADOW', 'ASASIN',
    'HARPER', 'SWASH', 'BRIBON', 'ARCHER',
  ];
  // Known high-will classes
  const highWill = [
    'CLER', 'DRU', 'WIZ', 'SORC', 'MONK', 'BARD',
    'SHADOW', 'HARPER', 'ALMA', 'DIVCHA', 'TEUR',
    'LADSOM', 'PALO', 'PALA', 'PALEMA', 'PALV',
    'FREBZK', 'WARLOK', 'TESP',
  ];

  const fortitude = highFort.some((k) => ref.includes(k)) ? 'high' : 'low';
  const reflex = highRef.some((k) => ref.includes(k)) ? 'high' : 'low';
  const will = highWill.some((k) => ref.includes(k)) ? 'high' : 'low';

  return { fortitude, reflex, will };
}

export interface AssembleResult<T> {
  catalog: T;
  warnings: string[];
}

/**
 * Assemble the class catalog from classes.2da.
 *
 * @param nwsyncReader - NwsyncReader for accessing Puerta server data.
 * @param baseGameReader - BaseGameReader for fallback data.
 * @param tlkResolver - TlkResolver for Spanish text resolution.
 * @param datasetId - Dataset provenance identifier.
 * @returns The assembled and validated class catalog with warnings.
 */
export function assembleClassCatalog(
  nwsyncReader: NwsyncReader,
  baseGameReader: BaseGameReader,
  tlkResolver: TlkResolver,
  datasetId: string,
): AssembleResult<ClassCatalog> {
  const warnings: string[] = [];

  // Load classes.2da: nwsync first, base-game fallback
  let classesTable: TwoDaTable;
  const classesBuf = nwsyncReader.getResource('classes', RESTYPE_2DA);
  if (classesBuf) {
    classesTable = parseTwoDa(classesBuf.toString('utf-8'));
  } else {
    const baseBuf = baseGameReader.getResource('classes', RESTYPE_2DA);
    if (!baseBuf) {
      throw new Error('classes.2da not found in nwsync or base game');
    }
    classesTable = parseTwoDa(baseBuf.toString('utf-8'));
    warnings.push('classes.2da loaded from base game (not in nwsync)');
  }

  const classes: CompiledClass[] = [];

  for (const [rowIndex, row] of classesTable.rows) {
    // D-08: Filter to player classes only
    if (row.PlayerClass !== '1') continue;

    const label = row.Label;
    if (!label) {
      warnings.push(`Row ${rowIndex}: missing Label column, skipped`);
      continue;
    }

    // 12.4-01 (SPEC R8): fail-closed sentinel filter — DELETED / UNUSED /
    // PADDING / ***DELETED*** / DELETED_* rows never enter the catalog.
    if (isSentinelLabel(label)) {
      warnings.push(`Class row ${rowIndex}: sentinel label '${label}' — skipped`);
      continue;
    }

    const id = canonicalId('class', label);

    // Resolve Spanish names via TLK
    const nameStrref = row.Name ? parseInt(row.Name, 10) : NaN;
    const descStrref = row.Description ? parseInt(row.Description, 10) : NaN;
    const resolvedName = Number.isFinite(nameStrref) ? tlkResolver.resolve(nameStrref) : '';
    const resolvedDesc = Number.isFinite(descStrref) ? tlkResolver.resolve(descStrref) : '';

    // Use label as fallback if TLK resolution yields empty
    const displayLabel = resolvedName || label;

    // Hit die
    const hitDie = row.HitDie ? parseInt(row.HitDie, 10) : 0;
    if (!hitDie || hitDie <= 0) {
      warnings.push(`Row ${rowIndex} (${label}): invalid HitDie '${row.HitDie}'`);
    }

    // Skill points per level
    const skillPointsPerLevel = row.SkillPointBase ? parseInt(row.SkillPointBase, 10) : 0;

    // Primary ability
    const primaryAbilRaw = row.PrimaryAbil;
    const primaryAbility = primaryAbilRaw ? (ABILITY_MAP[primaryAbilRaw.toUpperCase()] ?? null) : null;

    // BAB progression
    const atkTable = row.AttackBonusTable;
    const attackBonusProgression = atkTable ? (BAB_MAP[atkTable.toUpperCase()] ?? 'medium') : 'medium';
    if (atkTable && !BAB_MAP[atkTable.toUpperCase()]) {
      warnings.push(`Row ${rowIndex} (${label}): unknown AttackBonusTable '${atkTable}', defaulting to medium`);
    }

    // Saving throws
    const savingThrows = deriveSavingThrows(row.SavingThrowTable);

    // Is base class (no prerequisite table means base class)
    const isBase = !row.PreReqTable;

    // Spell caster
    const spellCaster = row.SpellCaster === '1';

    // Cross-reference table refs
    const skillTableRef = row.SkillsTable ?? null;
    const featTableRef = row.FeatsTable ?? null;
    const spellGainTableRef = row.SpellGainTable ?? null;
    const spellKnownTableRef = row.SpellKnownTable ?? null;

    // Prerequisite columns as raw record
    const prerequisiteColumns: Record<string, string | null> = {};
    if (row.PreReqTable) prerequisiteColumns.PreReqTable = row.PreReqTable;
    if (row.MaxLevel) prerequisiteColumns.MaxLevel = row.MaxLevel;
    if (row.AlignRestrict) prerequisiteColumns.AlignRestrict = row.AlignRestrict;
    if (row.AlignRstrctType) prerequisiteColumns.AlignRstrctType = row.AlignRstrctType;
    if (row.InvertRestrict) prerequisiteColumns.InvertRestrict = row.InvertRestrict;

    classes.push({
      attackBonusProgression,
      description: resolvedDesc,
      featTableRef,
      hitDie: hitDie > 0 ? hitDie : 4,
      id,
      isBase,
      label: displayLabel,
      prerequisiteColumns,
      primaryAbility,
      savingThrows,
      skillPointsPerLevel,
      skillTableRef,
      sourceRow: rowIndex,
      spellCaster,
      spellGainTableRef,
      spellKnownTableRef,
    });
  }

  if (classes.length === 0) {
    throw new Error('No player classes found in classes.2da');
  }

  const catalog: ClassCatalog = {
    classes,
    datasetId,
    schemaVersion: '1',
  };

  // T-05.1-11: Validate with Zod schema
  const parsed = classCatalogSchema.parse(catalog);

  return { catalog: parsed, warnings };
}
