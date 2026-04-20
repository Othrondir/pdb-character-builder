/**
 * Phase 12.7-02 (D-05, UAT F4 R2) — skill-point over-allocation gate.
 *
 * Mirrors `packages/rules-engine/src/foundation/ability-budget.ts`
 * (Phase 12.3-01) verbatim pattern: pure `nextIncrementCost` +
 * `canIncrementSkill` pair consumed by the `+` button `disabled` prop
 * in `apps/planner/src/features/skills/skill-sheet.tsx`.
 *
 * Framework-agnostic: no React, no zustand, no @data-extractor, no
 * @planner imports.
 *
 * Framework-purity acceptance (Plan 12.4-03):
 *   grep -cE "^import.*(react|@planner|@data-extractor|zustand)" \
 *     packages/rules-engine/src/skills/skill-budget.ts
 *   # expected: 0
 *
 * UI is the single source of truth for the user-driven path; the store
 * never rejects setter calls (T-12.7-02-02 "accept" disposition — planner
 * is local-first, user self-sabotage is out of threat model). Post-hoc
 * `invalidLevelHint` callout is preserved as belt-and-braces but the gate
 * makes it unreachable via UI clicks.
 */

export interface SkillBudgetSkillEntry {
  costPerRank: number;
  currentRank: number;
  maxAssignableRank: number;
}

export interface SkillBudgetSnapshot {
  pointsAvailable: number;
  pointsSpent: number;
  skills: Record<string, SkillBudgetSkillEntry>;
}

/**
 * Phase 12.7-02 (D-05) — cost delta of raising `skillId`'s rank by 1
 * given the per-level snapshot. Returns null when at/above
 * `maxAssignableRank` OR when `skillId` is absent from `snapshot.skills`
 * (defensive fail-closed: unknown skills must never be bumpable).
 *
 * `level` is currently unused (cost is derived from the snapshot's
 * `costPerRank` which the planner-side adapter already resolves from
 * `class` vs `cross-class` at the active level). The param is reserved
 * for future per-level cost rules such as Puerta skill-point carryover
 * (F5 — deferred to Phase 12.8).
 *
 * Framework-agnostic: no React, no store reads. Safe to call from
 * selectors, tests, and UI.
 */
export function nextIncrementCost(
  skillId: string,
  level: number,
  snapshot: SkillBudgetSnapshot,
): number | null {
  void level; // reserved for F5 carryover rules (Phase 12.8)
  const skill = snapshot.skills[skillId];
  if (skill === undefined) return null;
  if (skill.currentRank >= skill.maxAssignableRank) return null;
  return skill.costPerRank;
}

/**
 * Phase 12.7-02 (D-05, D-06, UAT F4 R2) — overspend gate. Returns false
 * when the `+` button would push `pointsSpent + nextCost` past
 * `pointsAvailable`, OR when the skill is already at its per-rank cap,
 * OR when `skillId` is absent from `snapshot.skills` (fail-closed).
 *
 * The UI mirrors this at the button's `disabled` prop
 * (skill-sheet.tsx:77, post 12.7-02 wire). The store never rejects setter
 * calls, so UI gating is the single source of truth for the user-driven
 * path — matches the Phase 12.3-01 `canIncrementAttribute` contract.
 */
export function canIncrementSkill(
  skillId: string,
  level: number,
  snapshot: SkillBudgetSnapshot,
): boolean {
  const cost = nextIncrementCost(skillId, level, snapshot);
  if (cost === null) return false;
  return snapshot.pointsSpent + cost <= snapshot.pointsAvailable;
}
