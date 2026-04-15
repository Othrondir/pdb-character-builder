/**
 * Spell catalog assembler.
 *
 * Reads spells.2da from nwsync (~1558 entries), extracts class-level
 * mappings from per-class columns, builds spell gain and spell known
 * tables from cls_spgn_* and cls_spkn_* 2DAs (nwsync first, base game
 * BIF fallback per Pitfall 6), and produces a validated SpellCatalog.
 *
 * Per D-08: Filters to player-castable spells (at least one player class
 * column has a value).
 * Per D-13: Includes spells with parse warnings rather than excluding them.
 *
 * @module
 */

import { parseTwoDa, type TwoDaTable } from '../parsers/two-da-parser';
import {
  spellCatalogSchema,
  type SpellCatalog,
  type CompiledSpell,
  type SpellGainRow,
  type SpellKnownRow,
} from '../contracts/spell-catalog';
import { RESTYPE_2DA } from '../config';
import type { NwsyncReader } from '../readers/nwsync-reader';
import type { BaseGameReader } from '../readers/base-game-reader';
import type { TlkResolver } from '../readers/tlk-resolver';
import type { AssembleResult } from './class-assembler';
import { canonicalId, slugify } from './slug-utils';

// ---------------------------------------------------------------------------
// Types for the classRows parameter
// ---------------------------------------------------------------------------

/** Minimal class info needed by the spell assembler. */
export interface SpellClassRowInfo {
  sourceRow: number;
  spellGainTableRef: string | null;
  spellKnownTableRef: string | null;
  /** Column name in spells.2da for this class (e.g., 'Bard', 'Wiz_Sorc'). */
  spellColumnName: string;
}

// ---------------------------------------------------------------------------
// Spell school mapping
// ---------------------------------------------------------------------------

const SCHOOL_MAP: Record<string, string> = {
  A: 'abjuration',
  C: 'conjuration',
  D: 'divination',
  E: 'enchantment',
  I: 'illusion',
  N: 'necromancy',
  T: 'transmutation',
  V: 'evocation',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse an integer from a 2DA cell, returning null for **** or non-numeric values. */
function parseIntOrNull(value: string | null | undefined): number | null {
  if (value == null || value === '****' || value === '') return null;
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * Load a 2DA table by resref, trying nwsync first then base game BIF fallback.
 */
function load2da(
  resref: string,
  nwsyncReader: NwsyncReader,
  baseGameReader: BaseGameReader,
): { table: TwoDaTable; source: 'nwsync' | 'basegame' } | null {
  const buf = nwsyncReader.getResource(resref, RESTYPE_2DA);
  if (buf) return { table: parseTwoDa(buf.toString('utf-8')), source: 'nwsync' };

  const baseBuf = baseGameReader.getResource(resref, RESTYPE_2DA);
  if (baseBuf) return { table: parseTwoDa(baseBuf.toString('utf-8')), source: 'basegame' };

  return null;
}

// ---------------------------------------------------------------------------
// Main assembler
// ---------------------------------------------------------------------------

/**
 * Assemble the spell catalog from spells.2da and cls_spgn/cls_spkn tables.
 *
 * @param nwsyncReader - NwsyncReader for accessing Puerta server data.
 * @param baseGameReader - BaseGameReader for fallback data.
 * @param tlkResolver - TlkResolver for Spanish text resolution.
 * @param classRows - Map of canonical class ID to spell-related class info.
 * @param datasetId - Dataset provenance identifier.
 * @returns The assembled and validated spell catalog with warnings.
 */
export function assembleSpellCatalog(
  nwsyncReader: NwsyncReader,
  baseGameReader: BaseGameReader,
  tlkResolver: TlkResolver,
  classRows: Map<string, SpellClassRowInfo>,
  datasetId: string,
): AssembleResult<SpellCatalog> {
  const warnings: string[] = [];

  // -------------------------------------------------------------------------
  // 1. Load spells.2da
  // -------------------------------------------------------------------------
  const spellsResult = load2da('spells', nwsyncReader, baseGameReader);
  if (!spellsResult) {
    throw new Error('spells.2da not found in nwsync or base game');
  }
  const spellsTable = spellsResult.table;
  if (spellsResult.source === 'basegame') {
    warnings.push('spells.2da loaded from base game (not in nwsync)');
  }

  // -------------------------------------------------------------------------
  // 2. Build column name -> class canonical ID mapping
  // -------------------------------------------------------------------------
  const columnToClassId = new Map<string, string>();
  for (const [classId, info] of classRows) {
    columnToClassId.set(info.spellColumnName, classId);
  }

  // Get all class spell column names for filtering
  const classColumnNames = Array.from(columnToClassId.keys());

  // -------------------------------------------------------------------------
  // 3. Build spell entries with class-level mappings
  // -------------------------------------------------------------------------
  const spells: CompiledSpell[] = [];
  const usedIds = new Set<string>();

  for (const [rowIndex, row] of spellsTable.rows) {
    const label = row.Label ?? row.LABEL;
    if (!label || label === '****') {
      warnings.push(`Spell row ${rowIndex}: missing Label, skipped`);
      continue;
    }

    // Build class-level mappings
    const classLevels: Record<string, number> = {};
    for (const colName of classColumnNames) {
      const val = parseIntOrNull(row[colName]);
      if (val != null && val >= 0 && val <= 9) {
        const classId = columnToClassId.get(colName)!;
        classLevels[classId] = val;
      } else if (val != null && (val < 0 || val > 9)) {
        // T-05.1-14: Validate spell level values are 0-9
        warnings.push(
          `Spell row ${rowIndex} (${label}): ${colName} has out-of-range value ${val}, ignored`,
        );
      }
    }

    // D-08: Filter to player-castable spells
    if (Object.keys(classLevels).length === 0) {
      continue;
    }

    // Generate canonical ID
    let id = canonicalId('spell', label);
    if (usedIds.has(id)) {
      id = `spell:${slugify(label)}-${rowIndex}`;
      warnings.push(`Spell row ${rowIndex}: duplicate ID detected, using '${id}'`);
    }
    usedIds.add(id);

    // Resolve Spanish name and description via TLK
    const nameStrref = parseIntOrNull(row.Name);
    const descStrref = parseIntOrNull(row.Description);
    const resolvedName = nameStrref != null ? tlkResolver.resolve(nameStrref) : '';
    const resolvedDesc = descStrref != null ? tlkResolver.resolve(descStrref) : '';

    // D-13: Warn but include spells with missing TLK entries
    if (nameStrref != null && !resolvedName) {
      warnings.push(`Spell row ${rowIndex} (${label}): Name strref ${nameStrref} resolved to empty`);
    }

    const displayLabel = resolvedName || label;

    // School
    const schoolRaw = row.School ?? '';
    const school = SCHOOL_MAP[schoolRaw] ?? (schoolRaw || 'unknown');

    // Innate level
    const innateLevel = parseIntOrNull(row.Innate);

    spells.push({
      classLevels,
      description: resolvedDesc,
      id,
      innateLevel: innateLevel != null && innateLevel >= 0 ? innateLevel : null,
      label: displayLabel,
      school,
      sourceRow: rowIndex,
    });
  }

  if (spells.length === 0) {
    throw new Error('No player-castable spells found in spells.2da');
  }

  // -------------------------------------------------------------------------
  // 4. Build spell gain tables (cls_spgn_*)
  // -------------------------------------------------------------------------
  const spellGainTables: Record<string, SpellGainRow[]> = {};

  for (const [classId, info] of classRows) {
    if (!info.spellGainTableRef) continue;

    const resref = info.spellGainTableRef.toLowerCase();
    const result = load2da(resref, nwsyncReader, baseGameReader);
    if (!result) {
      warnings.push(`Spell gain table '${resref}' not found for class '${classId}'`);
      continue;
    }
    if (result.source === 'basegame') {
      warnings.push(`Spell gain table '${resref}' loaded from base game for class '${classId}'`);
    }

    const rows: SpellGainRow[] = [];
    for (const [rowIndex, row] of result.table.rows) {
      const slots: Record<string, number> = {};
      let hasAnySlot = false;

      for (let lvl = 0; lvl <= 9; lvl++) {
        const colName = `SpellLevel${lvl}`;
        const val = parseIntOrNull(row[colName]);
        if (val != null && val >= 0) {
          slots[String(lvl)] = val;
          hasAnySlot = true;
        } else {
          // Default to 0 for missing columns so Zod record validation passes
          slots[String(lvl)] = 0;
        }
      }

      if (hasAnySlot) {
        rows.push({
          casterLevel: rowIndex + 1, // 0-indexed rows -> 1-indexed caster levels
          slots,
        });
      }
    }

    if (rows.length > 0) {
      spellGainTables[classId] = rows;
    }
  }

  // -------------------------------------------------------------------------
  // 5. Build spell known tables (cls_spkn_*)
  // -------------------------------------------------------------------------
  const spellKnownTables: Record<string, SpellKnownRow[]> = {};

  for (const [classId, info] of classRows) {
    if (!info.spellKnownTableRef) continue;

    const resref = info.spellKnownTableRef.toLowerCase();
    const result = load2da(resref, nwsyncReader, baseGameReader);
    if (!result) {
      warnings.push(`Spell known table '${resref}' not found for class '${classId}'`);
      continue;
    }
    if (result.source === 'basegame') {
      warnings.push(`Spell known table '${resref}' loaded from base game for class '${classId}'`);
    }

    const rows: SpellKnownRow[] = [];
    for (const [rowIndex, row] of result.table.rows) {
      const known: Record<string, number> = {};
      let hasAnyKnown = false;

      for (let lvl = 0; lvl <= 9; lvl++) {
        const colName = `SpellLevel${lvl}`;
        const val = parseIntOrNull(row[colName]);
        if (val != null && val >= 0) {
          known[String(lvl)] = val;
          hasAnyKnown = true;
        } else {
          // Default to 0 for missing columns so Zod record validation passes
          known[String(lvl)] = 0;
        }
      }

      if (hasAnyKnown) {
        rows.push({
          casterLevel: rowIndex + 1,
          known,
        });
      }
    }

    if (rows.length > 0) {
      spellKnownTables[classId] = rows;
    }
  }

  // -------------------------------------------------------------------------
  // 6. Build and validate catalog
  // -------------------------------------------------------------------------
  const catalog: SpellCatalog = {
    datasetId,
    schemaVersion: '1',
    spellGainTables,
    spellKnownTables,
    spells,
  };

  const parsed = spellCatalogSchema.parse(catalog);

  return { catalog: parsed, warnings };
}

/**
 * Get the spell-row-to-canonical-ID map from an assembled spell catalog.
 * Useful for domain assembler cross-referencing.
 */
export function buildSpellIdsByRow(spells: CompiledSpell[]): Map<number, string> {
  const map = new Map<number, string>();
  for (const spell of spells) {
    map.set(spell.sourceRow, spell.id);
  }
  return map;
}
