import type { CanonicalId } from '@rules-engine/contracts/canonical-id';

import type { AttributeKey } from '@planner/features/character-foundation/foundation-fixture';

// UAT-2026-04-20 P6 — level range extended 1..16 → 1..20 per user request.
// Breaks the prior CLAUDE.md "Initial Level Range: 1-16" constraint; ripples
// through: sections.ts type dup, level-editor-action-bar terminal gate,
// e2e/L16 canary tests, share-URL worst-case budget (url-budget.ts docstring),
// resumen-table header copy.
export const PROGRESSION_LEVEL_CAP = 20;

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
  17,
  18,
  19,
  20,
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
