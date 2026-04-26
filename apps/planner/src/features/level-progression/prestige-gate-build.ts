import type { CanonicalId } from '@rules-engine/contracts/canonical-id';
import { computeTotalBab } from '@rules-engine/feats/bab-calculator';
import { determineFeatSlots } from '@rules-engine/feats/feat-eligibility';

import { compiledClassCatalog } from '@planner/data/compiled-classes';
import { compiledFeatCatalog } from '@planner/data/compiled-feats';
import type { CharacterFoundationStoreState } from '@planner/features/character-foundation/store';
import {
  getGeneralFeatIds,
  type FeatStoreState,
} from '@planner/features/feats/store';
import type { SkillStoreState } from '@planner/features/skills/store';

import type { LevelProgressionStoreState } from './store';
import type { ProgressionLevel } from './progression-fixture';

export interface PrestigeGateBuildState {
  abilityScores: Record<string, number>;
  bab: number;
  classLevels: Record<string, number>;
  featIds: Set<string>;
  /**
   * Phase 12.8-02 — renamed from `highestArcaneClassLevel` to match the
   * rules-engine evaluator input (`PrestigeGateInput.highestArcaneSpellLevel`).
   * Computed via `computeHighestSpellLevel(classLevels, 'arcane')` so the
   * field semantically matches `minArcaneSpellLevel` (1-9 spell-slot level)
   * instead of raw class level.
   */
  highestArcaneSpellLevel: number;
  highestSpellLevel: number;
  raceId: string | null;
  skillRanks: Record<string, number>;
}

const FULL_CASTER_PROGRESS = [
  1,
  1,
  2,
  2,
  3,
  3,
  4,
  4,
  5,
  5,
  6,
  6,
  7,
  7,
  8,
  8,
  9,
  9,
  9,
  9,
] as const;

const SORCERER_PROGRESS = [
  1,
  1,
  1,
  2,
  2,
  3,
  3,
  4,
  4,
  5,
  5,
  6,
  6,
  7,
  7,
  8,
  8,
  9,
  9,
  9,
] as const;

const BARD_PROGRESS = [
  1,
  1,
  1,
  2,
  2,
  2,
  3,
  3,
  3,
  4,
  4,
  4,
  5,
  5,
  5,
  6,
  6,
  6,
  6,
  6,
] as const;

const PALADIN_PROGRESS = [
  0,
  0,
  0,
  0,
  0,
  1,
  1,
  1,
  1,
  2,
  2,
  3,
  3,
  3,
  4,
  4,
  4,
  4,
  4,
  4,
] as const;

const ASSASSIN_PROGRESS = [
  0,
  1,
  1,
  2,
  2,
  3,
  3,
  4,
  4,
  4,
  4,
  4,
  4,
  4,
  4,
  4,
  4,
  4,
  4,
  4,
] as const;

const ARTIFICE_PROGRESS = [
  1,
  1,
  1,
  1,
  1,
  2,
  2,
  2,
  3,
  3,
  3,
  4,
  4,
  4,
  5,
  5,
  5,
  6,
  6,
  6,
] as const;

const SPELL_LEVEL_PROGRESSIONS: Partial<Record<CanonicalId, readonly number[]>> = {
  'class:artifice': ARTIFICE_PROGRESS,
  'class:assassin': ASSASSIN_PROGRESS,
  'class:bard': BARD_PROGRESS,
  'class:cleric': FULL_CASTER_PROGRESS,
  'class:druid': FULL_CASTER_PROGRESS,
  'class:paladin': PALADIN_PROGRESS,
  'class:paladin-antiguos': PALADIN_PROGRESS,
  'class:paladin-oscuro': PALADIN_PROGRESS,
  'class:paladin-vengador': PALADIN_PROGRESS,
  'class:ranger': PALADIN_PROGRESS,
  'class:sorcerer': SORCERER_PROGRESS,
  'class:wizard': FULL_CASTER_PROGRESS,
};

const ARCANE_SPELLCASTER_IDS = new Set<CanonicalId>([
  'class:artifice',
  'class:assassin',
  'class:bard',
  'class:sorcerer',
  'class:wizard',
]);

function getSpellLevelAtClassLevel(
  classId: string,
  classLevel: number,
): number {
  const progression = SPELL_LEVEL_PROGRESSIONS[classId as CanonicalId] ?? null;
  if (!progression || classLevel <= 0) {
    return 0;
  }

  const index = Math.min(classLevel, progression.length) - 1;
  return progression[index] ?? 0;
}

function buildPriorClassLevels(
  progressionState: LevelProgressionStoreState,
  level: ProgressionLevel,
) {
  const classLevels: Record<string, number> = {};

  for (const record of progressionState.levels) {
    if (record.level >= level || record.classId === null) {
      continue;
    }

    classLevels[record.classId] = (classLevels[record.classId] ?? 0) + 1;
  }

  return classLevels;
}

function buildPriorFeatIds(
  progressionState: LevelProgressionStoreState,
  featState: FeatStoreState,
  level: ProgressionLevel,
) {
  const featIds = new Set<string>();

  for (const featLevel of featState.levels) {
    if (featLevel.level >= level) {
      continue;
    }

    if (featLevel.classFeatId) {
      featIds.add(featLevel.classFeatId);
    }

    for (const featId of getGeneralFeatIds(featLevel)) {
      featIds.add(featId);
    }
  }

  for (const record of progressionState.levels) {
    if (record.level >= level || record.classId === null) {
      continue;
    }

    const classLevelInClass = progressionState.levels.filter(
      (entry) => entry.level <= record.level && entry.classId === record.classId,
    ).length;

    // Phase 16-02 (D-03): determineFeatSlots takes BuildStateAtLevel + optional
    // compiledClass. We only need autoGrantedFeatIds from the result, so build
    // a minimal snapshot. Pass compiledClass to honour D-01 precedence.
    const compiledClassForLevel =
      compiledClassCatalog.classes.find((c) => c.id === record.classId) ?? null;
    const slots = determineFeatSlots(
      {
        abilityScores: {},
        bab: 0,
        characterLevel: record.level,
        classLevels: { [record.classId]: classLevelInClass },
        fortitudeSave: 0,
        selectedFeatIds: new Set(),
        skillRanks: {},
        raceId: null,
        activeClassIdAtLevel: record.classId,
      },
      compiledFeatCatalog.classFeatLists,
      compiledClassForLevel,
    );

    for (const featId of slots.autoGrantedFeatIds) {
      featIds.add(featId);
    }
  }

  return featIds;
}

function buildPriorSkillRanks(
  skillState: SkillStoreState,
  level: ProgressionLevel,
) {
  const skillRanks: Record<string, number> = {};

  for (const skillLevel of skillState.levels) {
    if (skillLevel.level >= level) {
      continue;
    }

    for (const allocation of skillLevel.allocations) {
      skillRanks[allocation.skillId] =
        (skillRanks[allocation.skillId] ?? 0) + allocation.rank;
    }
  }

  return skillRanks;
}

function buildAbilityScores(
  foundationState: CharacterFoundationStoreState,
  progressionState: LevelProgressionStoreState,
  level: ProgressionLevel,
) {
  const abilityScores: Record<string, number> = {
    cha:
      foundationState.baseAttributes.cha +
      (foundationState.racialModifiers?.cha ?? 0),
    con:
      foundationState.baseAttributes.con +
      (foundationState.racialModifiers?.con ?? 0),
    dex:
      foundationState.baseAttributes.dex +
      (foundationState.racialModifiers?.dex ?? 0),
    int:
      foundationState.baseAttributes.int +
      (foundationState.racialModifiers?.int ?? 0),
    str:
      foundationState.baseAttributes.str +
      (foundationState.racialModifiers?.str ?? 0),
    wis:
      foundationState.baseAttributes.wis +
      (foundationState.racialModifiers?.wis ?? 0),
  };

  for (const record of progressionState.levels) {
    if (record.level >= level || record.abilityIncrease === null) {
      continue;
    }

    abilityScores[record.abilityIncrease] =
      (abilityScores[record.abilityIncrease] ?? 0) + 1;
  }

  return abilityScores;
}

function computeHighestSpellLevel(
  classLevels: Record<string, number>,
  kind: 'any' | 'arcane',
) {
  let highest = 0;

  for (const [classId, classLevel] of Object.entries(classLevels)) {
    if (kind === 'arcane' && !ARCANE_SPELLCASTER_IDS.has(classId as CanonicalId)) {
      continue;
    }

    highest = Math.max(highest, getSpellLevelAtClassLevel(classId, classLevel));
  }

  return highest;
}

export function buildPrestigeGateBuildState(
  progressionState: LevelProgressionStoreState,
  foundationState: CharacterFoundationStoreState,
  featState: FeatStoreState,
  skillState: SkillStoreState,
  level: ProgressionLevel,
): PrestigeGateBuildState {
  const classLevels = buildPriorClassLevels(progressionState, level);
  const featIds = buildPriorFeatIds(progressionState, featState, level);
  const skillRanks = buildPriorSkillRanks(skillState, level);
  const abilityScores = buildAbilityScores(
    foundationState,
    progressionState,
    level,
  );

  return {
    abilityScores,
    bab: computeTotalBab(classLevels, compiledClassCatalog),
    classLevels,
    featIds,
    // Phase 12.8-02 — use the arcane SPELL-level progression (1-9) not the
    // raw CLASS level. `minArcaneSpellLevel: 3` on pale-master means "can
    // cast L3 arcane spells", which for Wizard lands at wizard L5, not
    // wizard L3. `computeHighestSpellLevel(classLevels, 'arcane')` returns
    // the correct quantity via the per-class progression tables above.
    highestArcaneSpellLevel: computeHighestSpellLevel(classLevels, 'arcane'),
    highestSpellLevel: computeHighestSpellLevel(classLevels, 'any'),
    raceId: foundationState.raceId,
    skillRanks,
  };
}
