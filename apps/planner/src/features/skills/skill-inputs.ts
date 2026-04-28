import { abilityModifier } from '@rules-engine/foundation';
import type { ArmorCategory, SkillLevelInput } from '@rules-engine/skills/skill-allocation';
import type { CharacterFoundationStoreState } from '@planner/features/character-foundation/store';
import type { LevelProgressionStoreState } from '@planner/features/level-progression/store';
import { compiledClassCatalog } from '@planner/data/compiled-classes';

import type { SkillStoreState, SkillLevelRecord } from './store';

const HUMAN_RACE_ID = 'race:human';
const HUMAN_SKILL_POINT_PER_LEVEL = 1;

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

  const compiled = compiledClassCatalog.classes.find((entry) => entry.id === classId);
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
  const baseIntelligence = foundationState.baseAttributes.int;
  const racialIntelligence = foundationState.racialModifiers?.int ?? 0;
  const intelligenceIncreases = progressionState.levels.filter(
    (record) => record.level < level && record.abilityIncrease === 'int',
  ).length;

  return abilityModifier(baseIntelligence + racialIntelligence + intelligenceIncreases);
}

export function createSkillLevelInput(
  skillRecord: SkillLevelRecord,
  progressionState: LevelProgressionStoreState,
  foundationState: CharacterFoundationStoreState,
): SkillLevelInput {
  const progressionRecord =
    progressionState.levels.find((record) => record.level === skillRecord.level) ?? null;

  return {
    allocations: skillRecord.allocations,
    armorCategory: getArmorCategory(progressionState, skillRecord.level),
    bonusSkillPointsPerLevel:
      foundationState.raceId === HUMAN_RACE_ID ? HUMAN_SKILL_POINT_PER_LEVEL : 0,
    classId: progressionRecord?.classId ?? null,
    intelligenceModifier: getIntelligenceModifier(
      foundationState,
      progressionState,
      skillRecord.level,
    ),
    level: skillRecord.level,
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
