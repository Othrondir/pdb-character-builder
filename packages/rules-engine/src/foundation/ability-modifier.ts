/**
 * Phase 14-05 — single canonical D&D 3.5 / NWN1 EE ability-modifier formula.
 *
 * Computes `floor((score - 10) / 2)`. The literal `10` is the attribute
 * baseline (a 10 score yields a 0 modifier). Centralizing here removes the
 * 4 inline copies of this expression that previously lived in
 * `apps/planner/src/features/skills/selectors.ts`,
 * `apps/planner/src/features/character-foundation/attributes-board.tsx`,
 * `apps/planner/src/features/summary/resumen-selectors.ts`,
 * and `apps/planner/src/components/shell/character-sheet.tsx`.
 *
 * Pure framework-agnostic helper: no React, no zustand, no compiled-catalog
 * imports. Safe to import from rules-engine internals AND from the planner.
 *
 * NWN1 EE attribute scores are clamped to `[3, 25]` at the schema boundary
 * (`apps/planner/src/lib/persistence/build-document-schema.ts`). Inputs below
 * 1 are accepted but treated by the math accordingly (e.g. `score=0 → -5`,
 * `score=1 → -5`); the schema is the validation gate, not this helper.
 */
export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}
