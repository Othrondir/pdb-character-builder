/**
 * Skill catalog assembler.
 *
 * Reads skills.2da from nwsync (39 entries, indices 0-38), resolves TLK
 * names, and builds class-skill mappings from all cls_skill_* tables.
 *
 * Per D-09: Handles renamed skills, custom skills (indices 28-38), and
 * shared skill tables between classes (e.g., FavoredSoul -> CLS_SKILL_CLER).
 *
 * @module
 */

import { parseTwoDa, type TwoDaTable } from '../parsers/two-da-parser';
import {
  skillCatalogSchema,
  type SkillCatalog,
  type CompiledSkill,
} from '../contracts/skill-catalog';
import { RESTYPE_2DA } from '../config';
import type { NwsyncReader } from '../readers/nwsync-reader';
import type { BaseGameReader } from '../readers/base-game-reader';
import type { TlkResolver } from '../readers/tlk-resolver';
import type { AssembleResult } from './class-assembler';
import { isSentinelLabel } from '../lib/sentinel-regex';
import { canonicalId } from './slug-utils';

const ABILITY_MAP: Record<string, 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'> = {
  STR: 'str',
  DEX: 'dex',
  CON: 'con',
  INT: 'int',
  WIS: 'wis',
  CHA: 'cha',
};

/**
 * Hardcoded category map for base NWN skills (indices 0-27) and
 * Puerta custom skills (indices 28-38).
 *
 * Categories follow the existing skill-catalog.ts pattern:
 * athletic, discipline, lore, perception, social, stealth, utility
 */
const SKILL_CATEGORY_MAP: Record<number, string> = {
  0: 'social',        // TratoConAnimales (Animal Empathy)
  1: 'discipline',    // Concentracion (Concentration)
  2: 'utility',       // IntMecanism (Disable Trap)
  3: 'lore',          // SaberLocal (Lore - custom renamed)
  4: 'perception',    // Escuchar (Listen)
  5: 'lore',          // Sabiduría (Lore)
  6: 'stealth',       // MovSilenc (Move Silently)
  7: 'utility',       // AbrirCerrad (Open Lock)
  8: 'perception',    // Buscar (Search)
  9: 'utility',       // PonTrampas (Set Trap)
  10: 'lore',         // Conjurar (Spellcraft)
  11: 'perception',   // Avistar (Spot)
  12: 'social',       // RobBolsillos (Pick Pocket)
  13: 'utility',      // UsarObjMagico (Use Magic Device)
  14: 'social',       // Persuadir (Persuade)
  15: 'athletic',     // Pirueta (Tumble)
  16: 'utility',      // Tasacion (Appraise)
  17: 'discipline',   // Disciplina (Discipline)
  18: 'social',       // Intimidar (Intimidate)
  19: 'utility',      // ArtFalsific (Craft Trap)
  20: 'stealth',      // Esconderse (Hide)
  21: 'utility',      // Curar (Heal)
  22: 'utility',      // Herrar (Craft Armor)
  23: 'utility',      // Forjar (Craft Weapon)
  24: 'athletic',     // Nadar (custom - Sail/Swim)
  25: 'social',       // Liderazgo (Leadership)
  26: 'utility',      // Maestria (CraftMastery)
  27: 'utility',      // Supervivencia (Survival)
  // Puerta custom skills (28-38): default to 'utility'
  28: 'utility',
  29: 'utility',
  30: 'utility',
  31: 'utility',
  32: 'utility',
  33: 'utility',
  34: 'utility',
  35: 'utility',
  36: 'utility',
  37: 'athletic',     // Trepar (Climb)
  38: 'utility',      // UsoDeCuerdas (Use Rope)
};

/**
 * Assemble the skill catalog from skills.2da and cls_skill_* tables.
 */
export function assembleSkillCatalog(
  nwsyncReader: NwsyncReader,
  baseGameReader: BaseGameReader,
  tlkResolver: TlkResolver,
  datasetId: string,
): AssembleResult<SkillCatalog> {
  const warnings: string[] = [];

  // Load skills.2da
  let skillsTable: TwoDaTable;
  const skillsBuf = nwsyncReader.getResource('skills', RESTYPE_2DA);
  if (skillsBuf) {
    skillsTable = parseTwoDa(skillsBuf.toString('utf-8'));
  } else {
    const baseBuf = baseGameReader.getResource('skills', RESTYPE_2DA);
    if (!baseBuf) {
      throw new Error('skills.2da not found in nwsync or base game');
    }
    skillsTable = parseTwoDa(baseBuf.toString('utf-8'));
    warnings.push('skills.2da loaded from base game (not in nwsync)');
  }

  // Load classes.2da to map SkillsTable references to class IDs
  let classesTable: TwoDaTable | null = null;
  const classesBuf = nwsyncReader.getResource('classes', RESTYPE_2DA);
  if (classesBuf) {
    classesTable = parseTwoDa(classesBuf.toString('utf-8'));
  }

  // Build a map: SkillsTable name (uppercase) -> class canonical ID[]
  const skillsTableToClassIds = new Map<string, string[]>();
  if (classesTable) {
    for (const [, row] of classesTable.rows) {
      if (row.PlayerClass !== '1') continue;
      const tableRef = row.SkillsTable;
      const label = row.Label;
      if (!tableRef || !label) continue;

      const key = tableRef.toUpperCase();
      const cid = canonicalId('class',label);
      const existing = skillsTableToClassIds.get(key);
      if (existing) {
        existing.push(cid);
      } else {
        skillsTableToClassIds.set(key, [cid]);
      }
    }
  }

  // Load all cls_skill_* tables and build skill -> class mapping
  // Key: skill index, Value: Set of class IDs where it's a class skill
  const skillClassMap = new Map<number, Set<string>>();

  const allResrefs = nwsyncReader.listResources(RESTYPE_2DA);
  const clsSkillResrefs = allResrefs.filter((r) => r.startsWith('cls_skill_'));

  for (const resref of clsSkillResrefs) {
    const buf = nwsyncReader.getResource(resref, RESTYPE_2DA);
    if (!buf) continue;

    const table = parseTwoDa(buf.toString('utf-8'));

    // Find which class IDs this table belongs to
    const tableKey = resref.toUpperCase();
    const classIds = skillsTableToClassIds.get(tableKey) ?? [];

    if (classIds.length === 0) {
      // Try matching by partial name
      // cls_skill_barb -> look for a class with SkillsTable = CLS_SKILL_BARB
      warnings.push(`cls_skill table '${resref}' has no matching PlayerClass=1 in classes.2da`);
      continue;
    }

    // The cls_skill table has columns: SkillLabel, SkillIndex, ClassSkill
    for (const [, row] of table.rows) {
      if (row.ClassSkill !== '1') continue;

      const skillIndex = row.SkillIndex ? parseInt(row.SkillIndex, 10) : NaN;
      if (!Number.isFinite(skillIndex)) continue;

      if (!skillClassMap.has(skillIndex)) {
        skillClassMap.set(skillIndex, new Set());
      }
      const set = skillClassMap.get(skillIndex)!;
      for (const cid of classIds) {
        set.add(cid);
      }
    }
  }

  // Build the skill catalog entries
  const skills: CompiledSkill[] = [];

  for (const [rowIndex, row] of skillsTable.rows) {
    const label = row.Label;
    if (!label) {
      warnings.push(`Skill row ${rowIndex}: missing Label, skipped`);
      continue;
    }

    // 12.4-01 (SPEC R8): fail-closed sentinel filter — DELETED / UNUSED /
    // PADDING / ***DELETED*** / DELETED_* rows never enter the catalog.
    if (isSentinelLabel(label)) {
      warnings.push(`Skill row ${rowIndex}: sentinel label '${label}' — skipped`);
      continue;
    }

    // D-08: Filter hidden skills if HideFromLevelUp column exists
    if (row.HideFromLevelUp === '1') {
      continue;
    }

    const id = canonicalId('skill', label);

    // Resolve TLK names
    const nameStrref = row.Name ? parseInt(row.Name, 10) : NaN;
    const resolvedName = Number.isFinite(nameStrref) ? tlkResolver.resolve(nameStrref) : '';
    const displayLabel = resolvedName || label;

    // Ability key
    const abilityRaw = row.KeyAbility;
    const abilityKey = abilityRaw ? (ABILITY_MAP[abilityRaw.toUpperCase()] ?? 'int') : 'int';

    // Trained only (Untrained column: 0 means trained only, 1 means can use untrained)
    const trainedOnly = row.Untrained === '0';

    // Category
    const category = (SKILL_CATEGORY_MAP[rowIndex] ?? 'utility') as CompiledSkill['category'];

    // Default class IDs from cls_skill mapping
    const classSet = skillClassMap.get(rowIndex);
    const defaultClassIds = classSet ? Array.from(classSet).sort() : [];

    // If no class mapping found, log warning but still include skill
    if (defaultClassIds.length === 0) {
      warnings.push(`Skill ${rowIndex} (${label}): no class-skill mappings found`);
      // Add a placeholder so Zod min(1) validation passes
      // AllClassesCanUse=1 means all classes can use it
      if (row.AllClassesCanUse === '1') {
        // For all-classes-can-use skills, map all player classes
        if (classesTable) {
          for (const [, clsRow] of classesTable.rows) {
            if (clsRow.PlayerClass === '1' && clsRow.Label) {
              defaultClassIds.push(canonicalId('class',clsRow.Label));
            }
          }
          defaultClassIds.sort();
        }
      }
    }

    // If still empty (edge case), add a fallback
    if (defaultClassIds.length === 0) {
      defaultClassIds.push('class:fighter');
      warnings.push(`Skill ${rowIndex} (${label}): using fallback class mapping`);
    }

    skills.push({
      abilityKey,
      category,
      defaultClassIds,
      id,
      label: displayLabel,
      restrictionMetadata: [],
      trainedOnly,
    });
  }

  if (skills.length === 0) {
    throw new Error('No skills found in skills.2da');
  }

  const catalog: SkillCatalog = {
    datasetId,
    restrictionOverrides: [],
    schemaVersion: '1',
    skills,
  };

  // T-05.1-11: Validate with Zod schema
  const parsed = skillCatalogSchema.parse(catalog);

  return { catalog: parsed, warnings };
}
