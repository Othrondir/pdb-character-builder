import type { CanonicalId } from '@rules-engine/contracts/canonical-id';

import type { AttributeKey } from '@planner/features/character-foundation/foundation-fixture';

export const PROGRESSION_LEVEL_CAP = 16;

export const PROGRESSION_LEVELS = [
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
] as const;

export type ProgressionLevel = (typeof PROGRESSION_LEVELS)[number];
export type ProgressionStatus = 'blocked' | 'illegal' | 'legal' | 'pending';

export interface ProgressionLevelRecord {
  abilityIncrease: AttributeKey | null;
  classId: CanonicalId | null;
  level: ProgressionLevel;
}

export function createEmptyProgressionLevels(): ProgressionLevelRecord[] {
  return PROGRESSION_LEVELS.map((level) => ({
    abilityIncrease: null,
    classId: null,
    level,
  }));
}
