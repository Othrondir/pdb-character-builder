---
phase: 05-skills-derived-statistics
reviewed: 2026-04-16T15:14:13Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - apps/planner/src/features/skills/skill-board.tsx
  - apps/planner/src/features/skills/skill-sheet.tsx
  - apps/planner/src/styles/app.css
findings:
  critical: 0
  warning: 2
  info: 2
  total: 4
status: issues_found
---

# Phase 05: Code Review Report

**Reviewed:** 2026-04-16T15:14:13Z
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Reviewed the skill board and skill sheet React components and the supporting CSS. The components are well-structured with clean separation between view logic (selectors) and presentation. The store interactions are correct and the CSS is well-organized with responsive breakpoints. Two warnings were found: a React key collision bug in the skill sheet issue list rendering, and a defensive-coding gap in the repair message conditional that relies on strict inequality with `null` but receives `undefined` in the edge case. Two informational items relate to an incorrect `inputMode` attribute and a minor unnecessary re-render pattern.

## Warnings

### WR-01: React key collision on skill sheet level issues

**File:** `apps/planner/src/features/skills/skill-sheet.tsx:140`
**Issue:** The `key` for each issue `<p>` element is the issue string itself (`key={issue}`). The backing selector (`selectors.ts:551-555`) maps all non-blocked issues to the same static string (`shellCopyEs.skills.invalidLevelHint`). If a level has multiple non-blocked issues, they will share the same React key, causing React to skip rendering duplicates or produce unpredictable DOM reconciliation.
**Fix:**
```tsx
{activeSheet.issues.map((issue, index) => (
  <p className={`foundation-step__issue is-${activeSheet.status}`} key={`${issue}-${index}`}>
    {issue}
  </p>
))}
```
Alternatively, change the selector to produce objects with unique keys (consistent with the `SkillRowIssueView` pattern already used for per-skill issues at line 87).

### WR-02: Repair message shown incorrectly when activeRepair is undefined

**File:** `apps/planner/src/features/skills/skill-sheet.tsx:133` (consumed), root cause in `selectors.ts:558-561`
**Issue:** The `repairMessage` field is computed as:
```ts
repairMessage:
  activeRepair?.inheritedFromLevel !== null
    ? shellCopyEs.skills.repairCallout
    : null,
```
If `activeRepair` is `undefined` (which happens when `activeIndex` is `-1`, i.e., `activeLevel` does not match any entry in `skillState.levels`), then `undefined?.inheritedFromLevel` evaluates to `undefined`, and `undefined !== null` is `true`. This would incorrectly display the repair callout message. While the current store initialization makes this unlikely, it is a latent bug that would surface if `setActiveLevel` ever receives an out-of-range value.
**Fix:** In `selectors.ts` line 558, use loose equality or an explicit guard:
```ts
repairMessage:
  activeRepair != null && activeRepair.inheritedFromLevel !== null
    ? shellCopyEs.skills.repairCallout
    : null,
```

## Info

### IN-01: inputMode="decimal" on integer-only skill rank input

**File:** `apps/planner/src/features/skills/skill-sheet.tsx:59`
**Issue:** The `<input>` for skill rank uses `inputMode="decimal"`, which presents a decimal point key on mobile keyboards. Skill ranks in the NWN rules engine are always integers (the store enforces `Math.round()` on every mutation, and `step` is always `1`). Using `"decimal"` may confuse users into thinking fractional ranks are valid.
**Fix:**
```tsx
inputMode="numeric"
```

### IN-02: SkillSheet subscribes to entire store state

**File:** `apps/planner/src/features/skills/skill-sheet.tsx:99`
**Issue:** `useSkillStore()` is called without a selector, subscribing `SkillSheet` to every property in the store (including all action functions). Any mutation to the skill store will trigger a re-render of `SkillSheet` and all its child `SkillRankRow` components. This is not a correctness bug but a code quality concern since other components in the codebase (e.g., `SkillRankRow` at lines 17-19) correctly use targeted selectors.
**Fix:**
```tsx
const skillState = useSkillStore((state) => ({
  activeLevel: state.activeLevel,
  datasetId: state.datasetId,
  levels: state.levels,
}));
```
Or use `useShallow` from `zustand/react/shallow` if the object identity matters:
```tsx
import { useShallow } from 'zustand/react/shallow';

const skillState = useSkillStore(useShallow((state) => ({
  activeLevel: state.activeLevel,
  datasetId: state.datasetId,
  levels: state.levels,
})));
```

---

_Reviewed: 2026-04-16T15:14:13Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
