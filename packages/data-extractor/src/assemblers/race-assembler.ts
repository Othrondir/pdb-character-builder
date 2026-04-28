/**
 * Race catalog assembler.
 *
 * Reads racialtypes.2da from nwsync, filters to PlayerRace=1 rows, resolves
 * TLK names/descriptions to Spanish text, looks up size from appearance.2da,
 * and maps favored class references.
 *
 * Subraces are loaded from base-game BIF fallback (per RESEARCH Pitfall 5:
 * subraces.2da is NOT in the Puerta nwsync manifest).
 *
 * @module
 */

import { parseTwoDa, type TwoDaTable } from '../parsers/two-da-parser';
import {
  raceCatalogSchema,
  type RaceCatalog,
  type CompiledRace,
  type CompiledSubrace,
} from '../contracts/race-catalog';
import { RESTYPE_2DA } from '../config';
import type { NwsyncReader } from '../readers/nwsync-reader';
import type { BaseGameReader } from '../readers/base-game-reader';
import type { TlkResolver } from '../readers/tlk-resolver';
import type { AssembleResult } from './class-assembler';
import { isSentinelLabel } from '../lib/sentinel-regex';
import { canonicalId } from './slug-utils';

const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;

/** Map NWN appearance SIZECATEGORY values to schema enum values. */
const SIZE_MAP: Record<number, 'small' | 'medium' | 'large'> = {
  1: 'small', // tiny -> small (closest valid)
  2: 'small',
  3: 'medium',
  4: 'large',
  5: 'large', // huge -> large (closest valid)
};

/**
 * Build a class ID from a row index in classes.2da.
 * We need the classes table to look up the label.
 */
function classIdFromRow(
  classRowIndex: number,
  classesTable: TwoDaTable,
): string | null {
  const row = classesTable.rows.get(classRowIndex);
  if (!row?.Label) return null;
  return canonicalId('class', row.Label);
}

/**
 * Assemble the race catalog from racialtypes.2da and subraces.2da.
 */
export function assembleRaceCatalog(
  nwsyncReader: NwsyncReader,
  baseGameReader: BaseGameReader,
  tlkResolver: TlkResolver,
  datasetId: string,
): AssembleResult<RaceCatalog> {
  const warnings: string[] = [];

  // Load racialtypes.2da: nwsync first, base-game fallback
  let racesTable: TwoDaTable;
  const racesBuf = nwsyncReader.getResource('racialtypes', RESTYPE_2DA);
  if (racesBuf) {
    racesTable = parseTwoDa(racesBuf.toString('utf-8'));
  } else {
    const baseBuf = baseGameReader.getResource('racialtypes', RESTYPE_2DA);
    if (!baseBuf) {
      throw new Error('racialtypes.2da not found in nwsync or base game');
    }
    racesTable = parseTwoDa(baseBuf.toString('utf-8'));
    warnings.push('racialtypes.2da loaded from base game (not in nwsync)');
  }

  // Load appearance.2da for size category lookup
  let appearanceTable: TwoDaTable | null = null;
  const appBuf = nwsyncReader.getResource('appearance', RESTYPE_2DA);
  if (appBuf) {
    appearanceTable = parseTwoDa(appBuf.toString('utf-8'));
  } else {
    const baseAppBuf = baseGameReader.getResource('appearance', RESTYPE_2DA);
    if (baseAppBuf) {
      appearanceTable = parseTwoDa(baseAppBuf.toString('utf-8'));
    } else {
      warnings.push('appearance.2da not found; defaulting all sizes to medium');
    }
  }

  // Load classes.2da for favored class mapping
  let classesTable: TwoDaTable | null = null;
  const classesBuf = nwsyncReader.getResource('classes', RESTYPE_2DA);
  if (classesBuf) {
    classesTable = parseTwoDa(classesBuf.toString('utf-8'));
  }

  const races: CompiledRace[] = [];

  for (const [rowIndex, row] of racesTable.rows) {
    // D-08: Filter to player races only
    if (row.PlayerRace !== '1') continue;

    const label = row.Label;
    if (!label) {
      warnings.push(`Race row ${rowIndex}: missing Label, skipped`);
      continue;
    }

    // 12.4-01 (SPEC R8): fail-closed sentinel filter — DELETED / UNUSED /
    // PADDING / ***DELETED*** / DELETED_* rows never enter the catalog.
    if (isSentinelLabel(label)) {
      warnings.push(`Race row ${rowIndex}: sentinel label '${label}' — skipped`);
      continue;
    }

    const id = canonicalId('race',label);

    // Resolve TLK names
    const nameStrref = row.Name ? parseInt(row.Name, 10) : NaN;
    const descStrref = row.Description ? parseInt(row.Description, 10) : NaN;
    const resolvedName = Number.isFinite(nameStrref) ? tlkResolver.resolve(nameStrref) : '';
    const resolvedDesc = Number.isFinite(descStrref) ? tlkResolver.resolve(descStrref) : '';
    const displayLabel = resolvedName || label;

    // Ability adjustments
    const abilityAdjustments: Record<'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha', number> = {
      str: row.StrAdjust ? parseInt(row.StrAdjust, 10) : 0,
      dex: row.DexAdjust ? parseInt(row.DexAdjust, 10) : 0,
      con: row.ConAdjust ? parseInt(row.ConAdjust, 10) : 0,
      int: row.IntAdjust ? parseInt(row.IntAdjust, 10) : 0,
      wis: row.WisAdjust ? parseInt(row.WisAdjust, 10) : 0,
      cha: row.ChaAdjust ? parseInt(row.ChaAdjust, 10) : 0,
    };

    // Sanitize NaN values to 0
    for (const key of ABILITY_KEYS) {
      if (!Number.isFinite(abilityAdjustments[key])) {
        abilityAdjustments[key] = 0;
      }
    }

    // Favored class: maps Favored column (class row index) to class canonical ID
    let favoredClass: string | null = null;
    const favoredRaw = row.Favored;
    if (favoredRaw && classesTable) {
      const favoredIdx = parseInt(favoredRaw, 10);
      if (Number.isFinite(favoredIdx) && favoredIdx >= 0) {
        favoredClass = classIdFromRow(favoredIdx, classesTable);
      }
    }

    // Size: look up Appearance row in appearance.2da for SIZECATEGORY
    let size: 'small' | 'medium' | 'large' = 'medium';
    const appearanceIdx = row.Appearance ? parseInt(row.Appearance, 10) : NaN;
    if (Number.isFinite(appearanceIdx) && appearanceTable) {
      const sizeRaw = appearanceTable.getCell(appearanceIdx, 'SIZECATEGORY');
      if (sizeRaw) {
        const sizeNum = parseInt(sizeRaw, 10);
        size = SIZE_MAP[sizeNum] ?? 'medium';
      }
    }

    // Phase 17 (ATTR-02 D-01) — AbilitiesPointBuyNumber column read.
    // parseTwoDa already coerces '****' → null (two-da-parser.ts:131),
    // so test `!= null`, not `!== '****'`.
    // Use `>= 0` not `> 0`: 0 is a valid budget (means "no points to spend").
    const abilitiesPointBuyRaw = row.AbilitiesPointBuyNumber;
    let abilitiesPointBuyNumber: number | null = null;
    if (abilitiesPointBuyRaw != null) {
      const parsed = parseInt(abilitiesPointBuyRaw, 10);
      if (Number.isFinite(parsed) && parsed >= 0) {
        abilitiesPointBuyNumber = parsed;
      } else {
        warnings.push(
          `Race row ${rowIndex} (${label}): invalid AbilitiesPointBuyNumber '${abilitiesPointBuyRaw}'`,
        );
      }
    }

    races.push({
      abilityAdjustments,
      abilitiesPointBuyNumber,
      description: resolvedDesc,
      favoredClass,
      id,
      label: displayLabel,
      size,
      sourceRow: rowIndex,
    });
  }

  if (races.length === 0) {
    throw new Error('No player races found in racialtypes.2da');
  }

  // Load subraces.2da: NOT in Puerta nwsync (Pitfall 5), use base game fallback
  const subraces: CompiledSubrace[] = [];
  let subracesTable: TwoDaTable | null = null;

  const subBuf = nwsyncReader.getResource('subraces', RESTYPE_2DA);
  if (subBuf) {
    subracesTable = parseTwoDa(subBuf.toString('utf-8'));
  } else {
    const baseSubBuf = baseGameReader.getResource('subraces', RESTYPE_2DA);
    if (baseSubBuf) {
      subracesTable = parseTwoDa(baseSubBuf.toString('utf-8'));
      warnings.push('subraces.2da loaded from base game BIF (not in Puerta nwsync, per Pitfall 5)');
    } else {
      warnings.push('subraces.2da not found in nwsync or base game; subrace list will be empty');
    }
  }

  if (subracesTable) {
    for (const [rowIndex, row] of subracesTable.rows) {
      const label = row.Label;
      if (!label) continue;

      // Build subrace entry
      const nameStrref = row.Name ? parseInt(row.Name, 10) : NaN;
      const descStrref = row.Description ? parseInt(row.Description, 10) : NaN;
      const resolvedName = Number.isFinite(nameStrref) ? tlkResolver.resolve(nameStrref) : '';
      const resolvedDesc = Number.isFinite(descStrref) ? tlkResolver.resolve(descStrref) : '';
      const displayLabel = resolvedName || label;

      // Map to parent race
      const baseRaceIdx = row.BaseRace ? parseInt(row.BaseRace, 10) : NaN;
      let parentRaceId = 'race:unknown';
      if (Number.isFinite(baseRaceIdx)) {
        const parentRow = racesTable.rows.get(baseRaceIdx);
        if (parentRow?.Label) {
          parentRaceId = canonicalId('race',parentRow.Label);
        }
      }

      // Deprecated check
      const isDeprecated = row.IsDeprecated === '1' || row.Deprecated === '1';

      subraces.push({
        description: resolvedDesc,
        id: canonicalId('subrace', label),
        isDeprecated,
        label: displayLabel,
        parentRaceId,
        sourceRow: rowIndex,
      });
    }
  }

  const catalog: RaceCatalog = {
    datasetId,
    races,
    schemaVersion: '1',
    subraces,
  };

  // T-05.1-11: Validate with Zod schema
  const parsed = raceCatalogSchema.parse(catalog);

  return { catalog: parsed, warnings };
}
