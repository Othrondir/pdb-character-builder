---
phase: 06-feats-proficiencies
reviewed: 2026-04-16T12:00:00Z
depth: standard
files_reviewed: 17
files_reviewed_list:
  - apps/planner/src/components/shell/center-content.tsx
  - apps/planner/src/components/shell/character-sheet.tsx
  - apps/planner/src/features/feats/compiled-feat-catalog.ts
  - apps/planner/src/features/feats/feat-board.tsx
  - apps/planner/src/features/feats/feat-detail-panel.tsx
  - apps/planner/src/features/feats/feat-search.tsx
  - apps/planner/src/features/feats/feat-sheet-tab.tsx
  - apps/planner/src/features/feats/feat-sheet.tsx
  - apps/planner/src/features/feats/selectors.ts
  - apps/planner/src/features/feats/store.ts
  - apps/planner/src/lib/copy/es.ts
  - apps/planner/src/styles/app.css
  - packages/rules-engine/src/feats/bab-calculator.ts
  - packages/rules-engine/src/feats/feat-eligibility.ts
  - packages/rules-engine/src/feats/feat-prerequisite.ts
  - packages/rules-engine/src/feats/feat-revalidation.ts
  - packages/rules-engine/src/feats/index.ts
findings:
  critical: 1
  warning: 4
  info: 3
  total: 8
status: issues_found
---

# Phase 06: Code Review Report

**Reviewed:** 2026-04-16T12:00:00Z
**Depth:** standard
**Files Reviewed:** 17
**Status:** issues_found

## Summary

The Phase 06 feats implementation covers feat selection UI, prerequisite evaluation, eligibility filtering, revalidation cascading, and BAB/save calculation. The rules-engine modules (`bab-calculator.ts`, `feat-prerequisite.ts`, `feat-eligibility.ts`, `feat-revalidation.ts`) are well-structured pure functions with no React dependencies, following the project's architecture guidelines. The store is cleanly separated from selectors and the component layer follows the established pattern from earlier phases.

One critical bug was found in the prerequisite evaluator where class-level prerequisite resolution looks up a class ID in the feat catalog (wrong entity type). Several warnings relate to broken memoization from unscoped zustand subscriptions and an unsafe type assertion. The code quality is generally high, with clear naming, consistent patterns, and thorough prerequisite coverage.

## Critical Issues

### CR-01: Class-level prerequisite resolves class label from feat catalog (wrong catalog)

**File:** `packages/rules-engine/src/feats/feat-prerequisite.ts:202`
**Issue:** When evaluating a `minLevelClass` prerequisite, line 202 searches `featCatalog.feats` using a class ID (e.g., `class:fighter`). Class IDs are never found in the feat catalog since feats have IDs like `feat:power_attack`. The lookup `featCatalog.feats.find((f) => f.id === classId)` always returns `undefined`, so `classLabel` always falls back to the raw class ID string. More importantly, this function does not receive a class catalog, so it cannot resolve class labels at all. The prerequisite check logic itself (met/not-met) is correct since it uses `buildState.classLevels[classId]` which is correct, but the displayed label is always the raw canonical ID rather than a human-readable name.
**Fix:**
Accept a `ClassCatalog` parameter or a label resolver, and look up the class label from the correct catalog:
```typescript
// Option A: Add classCatalog parameter to evaluateFeatPrerequisites
export function evaluateFeatPrerequisites(
  feat: CompiledFeat,
  buildState: BuildStateAtLevel,
  featCatalog: FeatCatalog,
  classCatalog?: ClassCatalog,  // new optional param
): PrerequisiteCheckResult {
  // ...
  if (prereqs.minLevelClass != null) {
    const classId = prereqs.minLevelClass;
    const requiredLevel = prereqs.minLevel ?? 1;
    const currentClassLevel = buildState.classLevels[classId] ?? 0;
    const classDef = classCatalog?.classes.find((c) => c.id === classId);
    const classLabel = classDef?.label ?? classId;
    // ...
  }
}
```

## Warnings

### WR-01: Unscoped zustand subscription causes broken memoization in FeatSearch

**File:** `apps/planner/src/features/feats/feat-search.tsx:55-56`
**Issue:** `useFeatStore()` is called without a selector, returning the entire store state including all action functions. This means the `featState` reference changes on every store update (any level's feat changes, active level changes, etc.). Since `featState` is included in the `useMemo` dependency array on line 99, the expensive `evaluateAllFeatsForSearch` computation re-runs on every store mutation, defeating the purpose of memoization. The same pattern exists in `feat-board.tsx:14`, `feat-detail-panel.tsx:17`, and `feat-sheet-tab.tsx:15`.
**Fix:**
Select only the specific state slices needed:
```typescript
// In feat-search.tsx -- select only the data properties
const featLevels = useFeatStore((s) => s.levels);
const activeLevel = useFeatStore((s) => s.activeLevel);

// In feat-board.tsx
const featState = useFeatStore((s) => ({
  activeLevel: s.activeLevel,
  levels: s.levels,
  datasetId: s.datasetId,
  lastEditedLevel: s.lastEditedLevel,
}));
```
Alternatively, use `useShallow` from `zustand/react/shallow` if multiple fields are needed.

### WR-02: Unsafe type assertion on feat ID from OptionList

**File:** `apps/planner/src/features/feats/feat-sheet.tsx:73-74`
**Issue:** `featId as CanonicalId` casts a plain `string` from the `onSelect` callback to `CanonicalId` without validation. The `CanonicalId` branded type (`feat:${string}`) has specific structural requirements. If a non-conforming string were passed (e.g., from a future refactor of `OptionList` or corrupt data), the store would silently accept invalid data. Line 78 has the same issue for `handleSelectGeneralFeat`.
**Fix:**
Validate before storing:
```typescript
import { canonicalIdRegex } from '@rules-engine/contracts/canonical-id';

const handleSelectClassFeat = (featId: string) => {
  onFocusFeat(featId);
  if (canonicalIdRegex.test(featId)) {
    setClassFeat(activeLevel, featId as CanonicalId);
  }
};
```

### WR-03: FeatLevelInput.level typed as number, loses ProgressionLevel narrowing

**File:** `packages/rules-engine/src/feats/feat-revalidation.ts:25`
**Issue:** `FeatLevelInput.level` is typed as `number` while the planner store types it as `ProgressionLevel` (a union of literal numbers 1-16). In `selectors.ts:599`, the cast `lvl.level as ProgressionLevel` is required to bridge this gap. This means the rules-engine revalidation function would silently accept out-of-range level values (e.g., 0, 17, or negative numbers) without type-level protection.
**Fix:**
Either import `ProgressionLevel` from the planner (creates a dependency) or define an equivalent numeric range type in the rules-engine contracts:
```typescript
// In rules-engine, define the range independently
export type CharacterLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16;

export interface FeatLevelInput {
  level: CharacterLevel;
  // ...
}
```

### WR-04: selectFeatBoardView recomputes build state for all levels on every call

**File:** `apps/planner/src/features/feats/selectors.ts:381-396`
**Issue:** `selectFeatBoardView` calls `computeBuildStateAtLevel` once for the active level (line 334), then again for every level in `featState.levels` (line 382-388) during revalidation. Since `selectFeatBoardView` is called on every render of `FeatBoard` (and is not memoized), this means 17 calls to `computeBuildStateAtLevel` (1 + 16) on every render. Each call iterates progression levels, skill levels, and feat levels. Combined with WR-01 (broken memoization from unscoped store), this creates a cascade of unnecessary computation on every store mutation.
**Fix:**
Extract the revalidation result into a separate selector that can be independently memoized, or use `useMemo` at the component level:
```typescript
// At minimum, avoid recomputing for the active level
const revalidationInput: FeatLevelInput[] = featState.levels.map((lvl) => {
  if (lvl.level === activeLevel) {
    return { buildState, classFeatId: lvl.classFeatId, generalFeatId: lvl.generalFeatId, level: lvl.level };
  }
  return {
    buildState: computeBuildStateAtLevel(lvl.level as ProgressionLevel, foundationState, progressionState, skillState, featState),
    classFeatId: lvl.classFeatId,
    generalFeatId: lvl.generalFeatId,
    level: lvl.level,
  };
});
```

## Info

### IN-01: Repeated linear scans over feat catalog with no index

**File:** `packages/rules-engine/src/feats/feat-prerequisite.ts:113`, `packages/rules-engine/src/feats/feat-eligibility.ts:132`, `apps/planner/src/features/feats/selectors.ts:221`
**Issue:** `featCatalog.feats.find((f) => f.id === id)` appears in at least 10 locations across the codebase. Each is an O(n) scan over the full feat catalog. While the catalog size is bounded (a few hundred feats), building a `Map<string, CompiledFeat>` at catalog load time would eliminate repeated scans and make the code more uniform.
**Fix:** Add a `featById` index map to the catalog or create a utility function that builds the map once.

### IN-02: Hardcoded Spanish strings in rule-engine layer

**File:** `packages/rules-engine/src/feats/feat-prerequisite.ts:53-59`
**Issue:** `ABILITY_LABELS` contains hardcoded Spanish strings (`'Fuerza'`, `'Destreza'`, etc.) in the rules-engine package. Per the project architecture, the rules engine should be "pure TypeScript domain model and validation engine with no React imports" -- but it should also ideally be language-neutral. The display labels are duplicated in `character-sheet.tsx:18-25` (as `ATTRIBUTE_LABELS`) and in the copy file `es.ts`. Having Spanish strings in the rules-engine layer couples it to the Spanish-first product decision and makes future i18n harder.
**Fix:** Return label keys (e.g., `'str'`, `'dex'`) from the rules engine and let the UI layer resolve them to display strings using the copy file.

### IN-03: FeatSheetTab key collision risk with duplicate feat IDs across slots

**File:** `apps/planner/src/features/feats/feat-sheet-tab.tsx:55-56`
**Issue:** The `key` for feat rows is `feat.featId`. If the same feat ID appears in both the auto-granted list and a selected slot at the same level (unlikely but structurally possible), React would see duplicate keys within the same group. This would cause rendering issues but not a crash.
**Fix:** Use a composite key:
```tsx
key={`${feat.slot}-${feat.featId}`}
```

---

_Reviewed: 2026-04-16T12:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
