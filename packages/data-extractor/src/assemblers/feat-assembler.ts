/**
 * Feat catalog assembler.
 *
 * Reads feat.2da from nwsync (~1823 entries), extracts full prerequisite
 * data from 20+ columns, builds class feat lists from all cls_feat_* tables,
 * and produces a validated FeatCatalog payload.
 *
 * Per D-08: Filters to player-available feats (ALLCLASSESCANUSE=1 or
 * present in at least one cls_feat_* table with List > 0).
 * Per D-13: Includes everything parseable; logs warnings for missing TLK
 * entries but does not exclude them.
 *
 * @module
 */

import { parseTwoDa, type TwoDaTable } from '../parsers/two-da-parser';
import {
  featCatalogSchema,
  type FeatCatalog,
  type CompiledFeat,
  type ClassFeatEntry,
  type FeatPrerequisites,
} from '../contracts/feat-catalog';
import { RESTYPE_2DA } from '../config';
import type { NwsyncReader } from '../readers/nwsync-reader';
import type { BaseGameReader } from '../readers/base-game-reader';
import type { TlkResolver } from '../readers/tlk-resolver';
import { canonicalId, slugify } from './slug-utils';

// ---------------------------------------------------------------------------
// Types for the classRows parameter
// ---------------------------------------------------------------------------

/** Minimal class info needed by the feat assembler. */
export interface ClassRowInfo {
  sourceRow: number;
  featTableRef: string | null;
}

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
): TwoDaTable | null {
  const buf = nwsyncReader.getResource(resref, RESTYPE_2DA);
  if (buf) return parseTwoDa(buf.toString('utf-8'));

  const baseBuf = baseGameReader.getResource(resref, RESTYPE_2DA);
  if (baseBuf) return parseTwoDa(baseBuf.toString('utf-8'));

  return null;
}

// ---------------------------------------------------------------------------
// Main assembler
// ---------------------------------------------------------------------------

/**
 * Assemble the feat catalog from feat.2da and cls_feat_* tables.
 *
 * @param nwsyncReader - NwsyncReader for accessing Puerta server data.
 * @param baseGameReader - BaseGameReader for fallback data.
 * @param tlkResolver - TlkResolver for Spanish text resolution.
 * @param classRows - Map of canonical class ID to { sourceRow, featTableRef }.
 * @param datasetId - Dataset provenance identifier.
 * @returns The assembled and validated feat catalog with warnings.
 */
/**
 * Result of feat catalog assembly. Extends AssembleResult with a pre-filter
 * featIdsByRow map covering EVERY feat row (including non-player feats that
 * are filtered out of the catalog). Needed by downstream assemblers that
 * reference feat rows which may point at filtered-out entries
 * (e.g., domain.2da GrantedFeat indices point at domain-specific feats
 * that don't appear in any cls_feat_* list, so they're excluded from
 * FeatCatalog but still must resolve for domain-feat lookup).
 */
export interface FeatAssembleResult {
  catalog: FeatCatalog;
  warnings: string[];
  featIdsByRowFull: Map<number, string>;
}

export function assembleFeatCatalog(
  nwsyncReader: NwsyncReader,
  baseGameReader: BaseGameReader,
  tlkResolver: TlkResolver,
  classRows: Map<string, ClassRowInfo>,
  datasetId: string,
): FeatAssembleResult {
  const warnings: string[] = [];

  // -------------------------------------------------------------------------
  // 1. Load feat.2da
  // -------------------------------------------------------------------------
  const featTable = load2da('feat', nwsyncReader, baseGameReader);
  if (!featTable) {
    throw new Error('feat.2da not found in nwsync or base game');
  }

  // -------------------------------------------------------------------------
  // 2. Load skills.2da for skill index -> canonical ID mapping
  // -------------------------------------------------------------------------
  const skillsTable = load2da('skills', nwsyncReader, baseGameReader);
  const skillIdsByRow = new Map<number, string>();
  if (skillsTable) {
    for (const [rowIndex, row] of skillsTable.rows) {
      const label = row.Label;
      if (label) {
        skillIdsByRow.set(rowIndex, canonicalId('skill', label));
      }
    }
  }

  // -------------------------------------------------------------------------
  // 3. Build class feat lists from cls_feat_* tables FIRST
  //    (needed to determine which feats are player-relevant)
  // -------------------------------------------------------------------------
  const classFeatLists: Record<string, ClassFeatEntry[]> = {};
  /** Set of feat row indices that appear in any cls_feat_* table with List > 0 */
  const featsInClassLists = new Set<number>();
  /** Temporary map: we'll resolve feat IDs after building the feat row->ID map */
  const rawClassFeatEntries: Array<{
    classId: string;
    featIndex: number;
    list: 0 | 1 | 2 | 3;
    grantedOnLevel: number | null;
    onMenu: boolean;
  }> = [];

  for (const [classId, info] of classRows) {
    if (!info.featTableRef) continue;

    const resref = info.featTableRef.toLowerCase();
    const table = load2da(resref, nwsyncReader, baseGameReader);
    if (!table) {
      warnings.push(`cls_feat table '${resref}' not found for class '${classId}'`);
      continue;
    }

    for (const [, row] of table.rows) {
      const featIndex = parseIntOrNull(row.FeatIndex);
      if (featIndex == null) continue;

      const listVal = parseIntOrNull(row.List);
      if (listVal == null) continue;
      // Clamp to valid range 0-3
      const list = (Math.min(Math.max(listVal, 0), 3)) as 0 | 1 | 2 | 3;

      const grantedOnLevel = parseIntOrNull(row.GrantedOnLevel);
      const onMenu = row.OnMenu === '1';

      rawClassFeatEntries.push({
        classId,
        featIndex,
        grantedOnLevel: grantedOnLevel != null && grantedOnLevel > 0 ? grantedOnLevel : null,
        list,
        onMenu,
      });

      if (list > 0) {
        featsInClassLists.add(featIndex);
      }
    }
  }

  // -------------------------------------------------------------------------
  // 4. Build feat row -> canonical ID mapping and assemble feats
  // -------------------------------------------------------------------------
  const featIdsByRow = new Map<number, string>();
  const usedIds = new Set<string>();

  // First pass: generate canonical IDs for all feat rows
  for (const [rowIndex, row] of featTable.rows) {
    const label = row.LABEL ?? row.Label;
    if (!label || label === '****') {
      warnings.push(`Feat row ${rowIndex}: missing LABEL, using row index as ID`);
      featIdsByRow.set(rowIndex, `feat:row-${rowIndex}`);
      continue;
    }

    let id = canonicalId('feat', label);

    // Handle duplicate IDs by appending sourceRow
    if (usedIds.has(id)) {
      id = `feat:${slugify(label)}-${rowIndex}`;
      warnings.push(`Feat row ${rowIndex}: duplicate ID detected, using '${id}'`);
    }
    usedIds.add(id);
    featIdsByRow.set(rowIndex, id);
  }

  // -------------------------------------------------------------------------
  // 5. Build the CompiledFeat array
  // -------------------------------------------------------------------------
  const feats: CompiledFeat[] = [];

  for (const [rowIndex, row] of featTable.rows) {
    const allClassesCanUse = row.ALLCLASSESCANUSE === '1';

    // D-08: Filter to player-available feats
    // Include if ALLCLASSESCANUSE=1 OR the feat appears in a cls_feat_* list > 0
    if (!allClassesCanUse && !featsInClassLists.has(rowIndex)) {
      continue;
    }

    const id = featIdsByRow.get(rowIndex);
    if (!id) continue;

    // Resolve Spanish name and description via TLK
    // feat.2da uses FEAT and DESCRIPTION as column names (not Name/Description)
    const nameStrref = parseIntOrNull(row.FEAT ?? row.Name);
    const descStrref = parseIntOrNull(row.DESCRIPTION ?? row.Description);
    const resolvedName = nameStrref != null ? tlkResolver.resolve(nameStrref) : '';
    const resolvedDesc = descStrref != null ? tlkResolver.resolve(descStrref) : '';

    const label = row.LABEL ?? row.Label ?? '';

    // D-13: Warn but include feats with missing TLK entries
    if (nameStrref != null && !resolvedName) {
      warnings.push(`Feat row ${rowIndex} (${label}): Name strref ${nameStrref} resolved to empty`);
    }

    const displayLabel = resolvedName || label;
    if (!displayLabel) {
      warnings.push(`Feat row ${rowIndex}: no display label, skipping`);
      continue;
    }

    // Category
    const category = row.CATEGORY ?? row.Category ?? '';

    // -----------------------------------------------------------------------
    // Extract prerequisite data
    // -----------------------------------------------------------------------
    const prerequisites: FeatPrerequisites = {};

    const minBab = parseIntOrNull(row.MINATTACKBONUS);
    if (minBab != null && minBab > 0) prerequisites.minBab = minBab;

    const minStr = parseIntOrNull(row.MINSTR);
    if (minStr != null && minStr > 0) prerequisites.minStr = minStr;

    const minDex = parseIntOrNull(row.MINDEX);
    if (minDex != null && minDex > 0) prerequisites.minDex = minDex;

    const minInt = parseIntOrNull(row.MININT);
    if (minInt != null && minInt > 0) prerequisites.minInt = minInt;

    const minWis = parseIntOrNull(row.MINWIS);
    if (minWis != null && minWis > 0) prerequisites.minWis = minWis;

    const minCon = parseIntOrNull(row.MINCON);
    if (minCon != null && minCon > 0) prerequisites.minCon = minCon;

    const minCha = parseIntOrNull(row.MINCHA);
    if (minCha != null && minCha > 0) prerequisites.minCha = minCha;

    const minSpellLevel = parseIntOrNull(row.MINSPELLLVL);
    if (minSpellLevel != null && minSpellLevel > 0) prerequisites.minSpellLevel = minSpellLevel;

    const minLevel = parseIntOrNull(row.MinLevel);
    if (minLevel != null && minLevel > 0) prerequisites.minLevel = minLevel;

    const maxLevel = parseIntOrNull(row.MaxLevel);
    if (maxLevel != null && maxLevel > 0) prerequisites.maxLevel = maxLevel;

    // MinLevelClass is a class index; resolve to canonical ID
    const minLevelClassRow = parseIntOrNull(row.MinLevelClass);
    if (minLevelClassRow != null) {
      // Find the class with this source row
      let foundClassId: string | null = null;
      for (const [cid, info] of classRows) {
        if (info.sourceRow === minLevelClassRow) {
          foundClassId = cid;
          break;
        }
      }
      if (foundClassId) {
        prerequisites.minLevelClass = foundClassId;
      } else {
        warnings.push(
          `Feat row ${rowIndex} (${label}): MinLevelClass=${minLevelClassRow} does not match any known class`,
        );
      }
    }

    const minFortSave = parseIntOrNull(row.MinFortSave);
    if (minFortSave != null && minFortSave > 0) prerequisites.minFortSave = minFortSave;

    // Required feats (AND relationship)
    const reqFeat1Index = parseIntOrNull(row.PREREQFEAT1);
    if (reqFeat1Index != null) {
      const reqFeatId = featIdsByRow.get(reqFeat1Index);
      if (reqFeatId) {
        prerequisites.requiredFeat1 = reqFeatId;
      } else {
        warnings.push(
          `Feat row ${rowIndex} (${label}): PREREQFEAT1=${reqFeat1Index} is an orphan reference`,
        );
      }
    }

    const reqFeat2Index = parseIntOrNull(row.PREREQFEAT2);
    if (reqFeat2Index != null) {
      const reqFeatId = featIdsByRow.get(reqFeat2Index);
      if (reqFeatId) {
        prerequisites.requiredFeat2 = reqFeatId;
      } else {
        warnings.push(
          `Feat row ${rowIndex} (${label}): PREREQFEAT2=${reqFeat2Index} is an orphan reference`,
        );
      }
    }

    // OR-required feats
    const orReqFeats: string[] = [];
    for (let i = 0; i <= 4; i++) {
      const colName = `OrReqFeat${i}`;
      const orIndex = parseIntOrNull(row[colName]);
      if (orIndex != null) {
        const orFeatId = featIdsByRow.get(orIndex);
        if (orFeatId) {
          orReqFeats.push(orFeatId);
        } else {
          warnings.push(
            `Feat row ${rowIndex} (${label}): ${colName}=${orIndex} is an orphan reference`,
          );
        }
      }
    }
    if (orReqFeats.length > 0) prerequisites.orReqFeats = orReqFeats;

    // Required skills
    const reqSkillIndex = parseIntOrNull(row.REQSKILL);
    const reqSkillMinRanks = parseIntOrNull(row.ReqSkillMinRanks);
    if (reqSkillIndex != null && reqSkillMinRanks != null) {
      const skillId = skillIdsByRow.get(reqSkillIndex);
      if (skillId) {
        prerequisites.requiredSkill = { id: skillId, minRanks: reqSkillMinRanks };
      } else {
        warnings.push(
          `Feat row ${rowIndex} (${label}): REQSKILL=${reqSkillIndex} is an orphan reference`,
        );
      }
    }

    const reqSkill2Index = parseIntOrNull(row.REQSKILL2);
    const reqSkill2MinRanks = parseIntOrNull(row.ReqSkillMinRanks2);
    if (reqSkill2Index != null && reqSkill2MinRanks != null) {
      const skillId = skillIdsByRow.get(reqSkill2Index);
      if (skillId) {
        prerequisites.requiredSkill2 = { id: skillId, minRanks: reqSkill2MinRanks };
      } else {
        warnings.push(
          `Feat row ${rowIndex} (${label}): REQSKILL2=${reqSkill2Index} is an orphan reference`,
        );
      }
    }

    // PreReqEpic
    const preReqEpicRaw = row.PreReqEpic;
    if (preReqEpicRaw === '1') {
      prerequisites.preReqEpic = true;
    } else if (preReqEpicRaw === '0') {
      prerequisites.preReqEpic = false;
    }

    feats.push({
      allClassesCanUse,
      category: category || 'general',
      description: resolvedDesc,
      id,
      label: displayLabel,
      prerequisites,
      sourceRow: rowIndex,
    });
  }

  if (feats.length === 0) {
    throw new Error('No player-available feats found in feat.2da');
  }

  // -------------------------------------------------------------------------
  // 6. Resolve class feat lists using the feat ID map
  // -------------------------------------------------------------------------
  for (const entry of rawClassFeatEntries) {
    const featId = featIdsByRow.get(entry.featIndex);
    if (!featId) {
      // Feat not in our filtered set or unknown row
      continue;
    }

    if (!classFeatLists[entry.classId]) {
      classFeatLists[entry.classId] = [];
    }

    classFeatLists[entry.classId].push({
      featId,
      grantedOnLevel: entry.grantedOnLevel,
      list: entry.list,
      onMenu: entry.onMenu,
    });
  }

  // -------------------------------------------------------------------------
  // 7. Build and validate catalog
  // -------------------------------------------------------------------------
  const catalog: FeatCatalog = {
    classFeatLists,
    datasetId,
    feats,
    schemaVersion: '1',
  };

  const parsed = featCatalogSchema.parse(catalog);

  return { catalog: parsed, warnings, featIdsByRowFull: featIdsByRow };
}

/**
 * Get the feat-row-to-canonical-ID map from an assembled feat catalog.
 * Useful for domain assembler cross-referencing.
 */
export function buildFeatIdsByRow(feats: CompiledFeat[]): Map<number, string> {
  const map = new Map<number, string>();
  for (const feat of feats) {
    map.set(feat.sourceRow, feat.id);
  }
  return map;
}
