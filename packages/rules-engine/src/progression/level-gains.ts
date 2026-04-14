import type { CanonicalId } from '../contracts/canonical-id';

interface GainRow {
  choicePrompts: string[];
  classLevel: number;
  features: string[];
}

interface ClassGainRecord {
  gainTable: GainRow[];
  id: CanonicalId;
}

interface LevelRecord {
  classId: CanonicalId | null;
  level: number;
}

export interface GetLevelGainsForSelectionInput {
  abilityIncreaseLevels: number[];
  classRecord: ClassGainRecord | null;
  level: number;
  levels: LevelRecord[];
}

export interface LevelGainSummary {
  abilityIncreaseAvailable: boolean;
  choicePrompts: string[];
  features: string[];
}

export function getLevelGainsForSelection(
  input: GetLevelGainsForSelectionInput,
): LevelGainSummary {
  if (!input.classRecord) {
    return {
      abilityIncreaseAvailable: input.abilityIncreaseLevels.includes(input.level),
      choicePrompts: [],
      features: [],
    };
  }

  const classLevel = input.levels
    .filter(
      (record) =>
        record.level <= input.level && record.classId === input.classRecord?.id,
    )
    .length;
  const gainRow =
    input.classRecord.gainTable.find((entry) => entry.classLevel === classLevel) ??
    null;

  return {
    abilityIncreaseAvailable: input.abilityIncreaseLevels.includes(input.level),
    choicePrompts: gainRow?.choicePrompts ?? [],
    features: gainRow?.features ?? [],
  };
}
