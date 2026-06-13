import { abilityModifier } from '@rules-engine/foundation';
import { getRaceSkillPointBonus } from '@rules-engine/progression/race-constants';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';
import type { ArmorCategory, SkillLevelInput } from '@rules-engine/skills/skill-allocation';
import type { CharacterFoundationStoreState } from '@planner/features/character-foundation/store';
import type { LevelProgressionStoreState } from '@planner/features/level-progression/store';
import { plannerClassCatalog } from '@planner/features/level-progression/class-fixture';
import { computeFinalAttributeTotals } from '@planner/features/character-foundation/final-attributes';
import {
  plannerRaceSkillBonusesById,
  plannerSubraceMechanicsById,
} from '@planner/data/race-catalog';

import type { SkillStoreState, SkillLevelRecord } from './store';

const CLASS_SKILL_POINTS: Partial<Record<string, number>> = {
  'class:bard': 6,
  'class:cleric': 2,
  'class:druid': 4,
  'class:fighter': 2,
  'class:monk': 4,
  'class:paladin': 2,
  'class:ranger': 4,
  'class:rogue': 8,
  'class:shadowdancer': 6,
  'class:weapon-master': 2,
  'class:wizard': 2,
};

function getSkillPointsBase(classId: string | null) {
  if (!classId) {
    return 0;
  }

  const compiled = plannerClassCatalog.classes.find((entry) => entry.id === classId);
  if (compiled?.skillPointsPerLevel !== undefined) {
    return compiled.skillPointsPerLevel;
  }

  return CLASS_SKILL_POINTS[classId] ?? 2;
}

function getArmorCategory(
  _progressionState: LevelProgressionStoreState,
  _level: number,
): ArmorCategory {
  return null;
}

function getIntelligenceModifier(
  foundationState: CharacterFoundationStoreState,
  progressionState: LevelProgressionStoreState,
  level: number,
) {
  const attributesBeforeLevel = computeFinalAttributeTotals(
    foundationState.baseAttributes,
    foundationState.racialModifiers,
    progressionState.levels.filter((record) => record.level < level),
    {
      characterLevel: level,
      raceId: foundationState.raceId,
      subraceId: foundationState.subraceId,
    },
  );

  return abilityModifier(attributesBeforeLevel.int);
}

function addSkillBonuses(
  target: Partial<Record<CanonicalId, number>>,
  source: Readonly<Partial<Record<string, number>>> | undefined,
) {
  if (!source) {
    return;
  }

  for (const [skillId, bonus] of Object.entries(source)) {
    if (bonus == null || bonus === 0) {
      continue;
    }
    const canonicalSkillId = skillId as CanonicalId;
    target[canonicalSkillId] = (target[canonicalSkillId] ?? 0) + bonus;
  }
}

export function getFoundationSkillBonuses(
  foundationState: CharacterFoundationStoreState,
): Partial<Record<CanonicalId, number>> {
  const bonuses: Partial<Record<CanonicalId, number>> = {};

  addSkillBonuses(
    bonuses,
    foundationState.raceId
      ? plannerRaceSkillBonusesById.get(foundationState.raceId)
      : undefined,
  );
  addSkillBonuses(
    bonuses,
    foundationState.subraceId
      ? plannerSubraceMechanicsById.get(foundationState.subraceId)?.skillBonuses
      : undefined,
  );

  return bonuses;
}

export function createSkillLevelInput(
  skillRecord: SkillLevelRecord,
  progressionState: LevelProgressionStoreState,
  foundationState: CharacterFoundationStoreState,
): SkillLevelInput {
  const progressionRecord =
    progressionState.levels.find((record) => record.level === skillRecord.level) ?? null;
  const raceSkillBonus = getRaceSkillPointBonus(foundationState.raceId);

  return {
    allocations: skillRecord.allocations,
    armorCategory: getArmorCategory(progressionState, skillRecord.level),
    bonusSkillPointsAtFirstLevel: raceSkillBonus.firstLevel,
    bonusSkillPointsPerLevel: raceSkillBonus.laterLevels,
    classId: progressionRecord?.classId ?? null,
    intelligenceModifier: getIntelligenceModifier(
      foundationState,
      progressionState,
      skillRecord.level,
    ),
    level: skillRecord.level,
    skillBonuses: getFoundationSkillBonuses(foundationState),
    skillPointsBase: getSkillPointsBase(progressionRecord?.classId ?? null),
  };
}

export function createSkillLevelInputs(
  skillState: SkillStoreState,
  progressionState: LevelProgressionStoreState,
  foundationState: CharacterFoundationStoreState,
) {
  return skillState.levels.map((level) =>
    createSkillLevelInput(level, progressionState, foundationState),
  );
}
