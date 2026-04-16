# Phase 07: Magic & Full Legality Engine - Pattern Map

**Mapped:** 2026-04-16
**Files analyzed:** 28 new/modified files
**Analogs found:** 26 / 28 (2 hybrid / derived from multiple analogs)

Phase 7 is the **third execution** of the cascade + selector + store pattern already shipped for skills (Phase 5) and feats (Phase 6). Every new file below has a direct analog. Innovation is unwarranted per RESEARCH.md "Key Findings #2": deviation from the established pattern is the largest implementation risk after catalog completeness.

---

## File Classification

### Rules-engine (framework-agnostic, pure functions)

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `packages/rules-engine/src/magic/caster-level.ts` | utility | transform | `packages/rules-engine/src/feats/bab-calculator.ts` | exact (same per-class flooring + sum shape) |
| `packages/rules-engine/src/magic/spell-prerequisite.ts` | service | transform | `packages/rules-engine/src/feats/feat-prerequisite.ts` | exact (PrerequisiteCheckResult shape reused) |
| `packages/rules-engine/src/magic/domain-rules.ts` | service | transform | `packages/rules-engine/src/feats/feat-prerequisite.ts` | role-match (simpler: alignment + class-level only) |
| `packages/rules-engine/src/magic/spell-eligibility.ts` | service | transform | `packages/rules-engine/src/feats/feat-eligibility.ts` | role-match (eligibility filtering) |
| `packages/rules-engine/src/magic/catalog-fail-closed.ts` | utility | transform | `packages/rules-engine/src/contracts/validation-outcome.ts` (consumer) | role-match (`blockKind: 'missing-source'` pattern) |
| `packages/rules-engine/src/magic/magic-revalidation.ts` | service | event-driven | `packages/rules-engine/src/feats/feat-revalidation.ts` | exact (inheritedBreakLevel cascade) |
| `packages/rules-engine/src/magic/magic-legality-aggregator.ts` | service | transform | `packages/rules-engine/src/feats/feat-revalidation.ts` (status rollup) | role-match (aggregates per-level into build-wide status) |
| `packages/rules-engine/src/magic/index.ts` | config | barrel-export | `packages/rules-engine/src/feats/index.ts` | exact |

### Planner feature (zustand store + selectors + React UI)

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `apps/planner/src/features/magic/compiled-magic-catalog.ts` | config | barrel-export | `apps/planner/src/features/feats/compiled-feat-catalog.ts` | exact |
| `apps/planner/src/features/magic/store.ts` | store | CRUD | `apps/planner/src/features/feats/store.ts` | exact (per-level record pattern) |
| `apps/planner/src/features/magic/selectors.ts` | service | transform | `apps/planner/src/features/feats/selectors.ts` | exact (multi-store composition + view model) |
| `apps/planner/src/features/magic/magic-board.tsx` | component | request-response | `apps/planner/src/features/feats/feat-board.tsx` | exact (SelectionScreen + sheet + detail panel) |
| `apps/planner/src/features/magic/magic-sheet.tsx` | component | request-response | `apps/planner/src/features/feats/feat-sheet.tsx` | role-match (dispatcher to paradigm sub-views) |
| `apps/planner/src/features/magic/magic-detail-panel.tsx` | component | request-response | `apps/planner/src/features/feats/feat-detail-panel.tsx` | exact (prereq-list pattern) |
| `apps/planner/src/features/magic/magic-sheet-tab.tsx` | component | request-response | `apps/planner/src/features/feats/feat-sheet-tab.tsx` | exact (read-only sheet tab) |
| `apps/planner/src/features/magic/spell-level-tabs.tsx` | component | request-response | (none — new component; loosely patterned on `stepper-step.tsx`) | no-analog |
| `apps/planner/src/features/magic/domain-tile-grid.tsx` | component | request-response | `apps/planner/src/features/feats/feat-sheet.tsx` (OptionList usage) | role-match |
| `apps/planner/src/features/magic/spell-row.tsx` | component | request-response | `apps/planner/src/features/feats/feat-sheet-tab.tsx` (row + state classes) | role-match |
| `apps/planner/src/features/magic/swap-spell-dialog.tsx` | component | request-response | `apps/planner/src/components/ui/confirm-dialog.tsx` (wrapped) | role-match (two-step ConfirmDialog) |

### Modified files (extensions only, no rewrites)

| Modified File | Role | Change | Analog for the change |
|---------------|------|--------|---------------------|
| `apps/planner/src/lib/sections.ts` | config | Extend `LevelSubStep` (or reuse `'spells'`); Phase 7 decision (RESEARCH §Pitfall 2): reuse existing `'spells'` identifier, rename label from "Conjuros" → "Magia" | n/a (additive enum edit) |
| `apps/planner/src/lib/copy/es.ts` | config | Add `shellCopyEs.magic` namespace; update `stepper.levelSubSteps.spells` + `stepper.stepTitles.spells` | `shellCopyEs.feats` namespace (lines 125-155) |
| `apps/planner/src/components/shell/center-content.tsx` | component | Replace `case 'spells'` placeholder with `<MagicBoard />` | existing switch pattern (line 24-33) |
| `apps/planner/src/components/shell/character-sheet.tsx` | component | Replace `SpellsPanel` body with `<MagicSheetTab />` | `FeatSheetTab` integration pattern (line 139) |
| `apps/planner/src/components/shell/level-sub-steps.tsx` | component | Filter out `'spells'` when class-at-level has no casting (D-02) | existing `levelSubSteps.map` (line 16) |
| `apps/planner/src/state/planner-shell.ts` | store | Extend `PlannerValidationStatus` with `'repair_needed'` (OQ-4 recommendation) | existing `PlannerValidationStatus` union (line 4) |
| `packages/rules-engine/src/feats/feat-prerequisite.ts` | service | Replace `BuildStateAtLevel.spellcastingLevel: number` with `casterLevelByClass: Record<CanonicalId, number>` + derived helper | existing `BuildStateAtLevel` interface (lines 10-27) |
| `apps/planner/src/features/feats/selectors.ts` | service | Update `computeBuildStateAtLevel` to compute per-class caster level instead of hardcoded `0` | existing body (lines 123-211) |

### Phase 7 test files (Wave 0)

| New File | Role | Analog |
|----------|------|--------|
| `tests/phase-07/caster-level.spec.ts` | test | `tests/phase-06/bab-calculator.spec.ts` |
| `tests/phase-07/spell-prerequisite.spec.ts` | test | `tests/phase-06/feat-prerequisite.spec.ts` |
| `tests/phase-07/spell-eligibility.spec.ts` | test | `tests/phase-06/feat-eligibility.spec.ts` |
| `tests/phase-07/domain-rules.spec.ts` | test | `tests/phase-06/feat-prerequisite.spec.ts` |
| `tests/phase-07/magic-revalidation.spec.ts` | test | `tests/phase-06/feat-revalidation.spec.ts` |
| `tests/phase-07/magic-legality-aggregator.spec.ts` | test | `tests/phase-06/feat-revalidation.spec.ts` |
| `tests/phase-07/catalog-fail-closed.spec.ts` | test | `tests/phase-06/feat-prerequisite.spec.ts` (shape; validation-outcome usage) |
| `tests/phase-07/magic-store.spec.ts` | test | `tests/phase-06/feat-store.spec.ts` |

---

## Pattern Assignments

### `packages/rules-engine/src/magic/caster-level.ts` (utility, transform)

**Analog:** `packages/rules-engine/src/feats/bab-calculator.ts`

**Imports pattern** (lines 1-1):
```typescript
import type { ClassCatalog } from '@data-extractor/contracts/class-catalog';
```
Phase 7 version will additionally import `SpellCatalog` and `CanonicalId`.

**Core per-class-summed computation pattern** (lines 26-47 of `bab-calculator.ts`):
```typescript
export function computeTotalBab(
  classLevels: Record<string, number>,
  classCatalog: ClassCatalog,
): number {
  let totalBab = 0;

  for (const [classId, level] of Object.entries(classLevels)) {
    const classDef = classCatalog.classes.find((c) => c.id === classId);

    if (!classDef) {
      continue;
    }

    const babFn = BAB_PER_LEVEL[classDef.attackBonusProgression];

    if (babFn) {
      totalBab += babFn(level);
    }
  }

  return totalBab;
}
```

**Phase 7 adaptation:** `computeCasterLevelByClass` returns `Record<string, number>` (per-class, NOT summed — RESEARCH §Pitfall 3), and `computeSpellSlots(classId, casterLevel, spellCatalog)` indexes `spellCatalog.spellGainTables[classId][casterLevel-1].slots[spellLevel]`. Iterate `Object.entries(classLevels)` identically. Skip classes where `classDef.spellCaster === false` or `classDef.spellGainTableRef == null`.

---

### `packages/rules-engine/src/magic/spell-prerequisite.ts` (service, transform)

**Analog:** `packages/rules-engine/src/feats/feat-prerequisite.ts`

**Exported types to REUSE verbatim** (lines 29-51):
```typescript
export interface PrerequisiteCheck {
  type:
    | 'ability'
    | 'bab'
    | 'feat'
    | 'skill'
    | 'level'
    | 'class-level'
    | 'spell-level'
    | 'fort-save'
    | 'or-feats'
    | 'max-level'
    | 'epic';
  label: string;
  met: boolean;
  required: string;
  current: string;
}

export interface PrerequisiteCheckResult {
  met: boolean;
  checks: PrerequisiteCheck[];
}
```
**DO NOT duplicate** — import from `@rules-engine/feats/feat-prerequisite`. RESEARCH §Don't Hand-Roll: "Mirror feat-prerequisite.ts API shape (`PrerequisiteCheckResult`)".

**Spanish ability labels** (lines 53-60) — REUSE:
```typescript
const ABILITY_LABELS: Record<string, string> = {
  str: 'Fuerza',
  dex: 'Destreza',
  con: 'Constitucion',
  int: 'Inteligencia',
  wis: 'Sabiduria',
  cha: 'Carisma',
};
```
Import this map from `feat-prerequisite.ts` or colocate a re-export. Do NOT hand-author new Spanish labels (RESEARCH §Don't Hand-Roll).

**Evaluator function signature pattern** (lines 75-98):
```typescript
export function evaluateFeatPrerequisites(
  feat: CompiledFeat,
  buildState: BuildStateAtLevel,
  featCatalog: FeatCatalog,
): PrerequisiteCheckResult {
  const checks: PrerequisiteCheck[] = [];
  const prereqs = feat.prerequisites;

  // Ability score checks
  for (const [prereqKey, abilityKey] of Object.entries(ABILITY_PREREQ_MAP)) {
    const value = prereqs[prereqKey as keyof typeof prereqs] as number | null | undefined;

    if (value != null && value > 0) {
      const currentScore = buildState.abilityScores[abilityKey] ?? 0;

      checks.push({
        type: 'ability',
        label: ABILITY_LABELS[abilityKey] ?? abilityKey,
        met: currentScore >= value,
        required: String(value),
        current: String(currentScore),
      });
    }
  }
```
**Phase 7 adaptation:** `evaluateSpellPrerequisites(spell, buildState, spellCatalog)`. Spells have fewer prereq types than feats — primarily `classLevels[classId]` (required caster level to know/cast) plus optional `spellPrereqIds` for chain-learned spells. `result.met = checks.every(c => c.met)` same as feat.

---

### `packages/rules-engine/src/magic/domain-rules.ts` (service, transform)

**Analog:** `packages/rules-engine/src/feats/feat-prerequisite.ts` (prerequisite evaluator shape)

**Adapted for domain-specific checks:** alignment restriction + cleric-class-level ≥ 1 + selection count ≤ 2. Use `PrerequisiteCheckResult` shape. Key function: `evaluateDomainSelection(domainId, buildState, domainCatalog): PrerequisiteCheckResult`.

---

### `packages/rules-engine/src/magic/catalog-fail-closed.ts` (utility, transform)

**Analog:** `packages/rules-engine/src/contracts/validation-outcome.ts` (consumer — invokes `resolveValidationOutcome`)

**Pattern source** (RESEARCH §Code Examples Catalog fail-closed integration):
```typescript
import { resolveValidationOutcome } from '../contracts/validation-outcome';

export function detectMissingDomainData(
  domainId: string,
  catalog: DomainCatalog,
): ValidationOutcome | null {
  const dom = catalog.domains.find(d => d.id === domainId);
  if (!dom) {
    return resolveValidationOutcome({
      affectedIds: [domainId],
      blockKind: 'missing-source',
      hasConflict: false, hasMissingEvidence: true, passesRule: false, ruleKnown: true,
    });
  }
  if (dom.grantedFeatIds.length === 0) {
    return resolveValidationOutcome({ /* same shape */ });
  }
  return null;
}
```

**Validation-outcome contract** (lines 70-136 of `validation-outcome.ts`):
```typescript
export interface ResolveValidationOutcomeInput {
  ruleKnown: boolean;
  passesRule: boolean;
  hasConflict: boolean;
  hasMissingEvidence: boolean;
  evidence?: ReadonlyArray<ValidationEvidence>;
  affectedIds?: ReadonlyArray<string>;
  blockKind?: Exclude<BlockKind, 'conflict'>;
}
```
Use `blockKind: 'missing-source'` + `hasMissingEvidence: true` → produces `{ status: 'blocked', blockKind: 'missing-source', code: 'RULE_NOT_VERIFIABLE', messageKey: 'validation.blocked.notVerifiable' }` (lines 108-117).

---

### `packages/rules-engine/src/magic/magic-revalidation.ts` (service, event-driven)

**Analog:** `packages/rules-engine/src/feats/feat-revalidation.ts`

**Status enum pattern** (line 12) — REUSE:
```typescript
export type FeatEvaluationStatus = 'legal' | 'illegal' | 'blocked' | 'pending';
```
Alias as `MagicEvaluationStatus` or import directly. RESEARCH §Don't Hand-Roll: "Reuse `FeatEvaluationStatus`".

**Dedupe helper** (lines 28-46 of `feat-revalidation.ts`) — COPY VERBATIM:
```typescript
function dedupeIssues(issues: ValidationOutcome[]): ValidationOutcome[] {
  const seen = new Set<string>();

  return issues.filter((issue) => {
    const key = JSON.stringify([
      issue.status,
      issue.code,
      [...issue.affectedIds].sort(),
      'blockKind' in issue ? issue.blockKind : null,
    ]);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}
```

**Inherited-issue helper** (lines 48-57):
```typescript
function getInheritedIssue(affectedIds: string[]): ValidationOutcome {
  return resolveValidationOutcome({
    affectedIds,
    blockKind: 'missing-source',
    hasConflict: false,
    hasMissingEvidence: true,
    passesRule: false,
    ruleKnown: true,
  });
}
```

**Cascade body** (lines 74-191 of `feat-revalidation.ts`) — direct template. Key pieces:
```typescript
let inheritedBreakLevel: number | null = null;

return input.levels.map((levelInput) => {
  // ... evaluate this level's selections ...

  if (hasIllegal) {
    if (inheritedBreakLevel === null) {
      inheritedBreakLevel = levelInput.level;
    }
    return { inheritedFromLevel: null, issues: dedupeIssues(issues), level, status: 'illegal' };
  }

  if (inheritedBreakLevel !== null && affectedIds.length > 0) {
    return { inheritedFromLevel: inheritedBreakLevel, issues: dedupeIssues([getInheritedIssue(affectedIds)]), level, status: 'blocked' };
  }

  if (inheritedBreakLevel !== null) {
    return { inheritedFromLevel: inheritedBreakLevel, issues: [], level, status: 'blocked' };
  }

  return { inheritedFromLevel: null, issues: [], level, status: hasNoSelections ? 'pending' : 'legal' };
});
```

**Pending detection** (lines 92-103) — adapt: "pending" when no class selected AND no magic selections at this level.

**Phase 7 input shape**: `MagicLevelInput { level, buildState, domainsSelected, spellbookAdditions, knownSpellsAdded, swapsApplied }` instead of `FeatLevelInput { classFeatId, generalFeatId }`.

---

### `packages/rules-engine/src/magic/magic-legality-aggregator.ts` (service, transform)

**Analog:** `packages/rules-engine/src/feats/feat-revalidation.ts` (per-level status → build-wide rollup pattern)

**Rollup pattern** (RESEARCH §Code Examples):
```typescript
const overallStatus: MagicEvaluationStatus = issues.some(i => i.status === 'illegal') ? 'illegal'
  : issues.some(i => i.status === 'blocked') ? 'blocked'
  : 'legal';
```

**Status priority** follows `STATUS_ORDER` from `feats/selectors.ts:47-52`:
```typescript
const STATUS_ORDER: Record<FeatEvaluationStatus, number> = {
  illegal: 0,
  blocked: 1,
  legal: 2,
  pending: 3,
};
```
Lower value = higher priority (illegal beats blocked beats legal).

---

### `packages/rules-engine/src/magic/index.ts` (config, barrel-export)

**Analog:** `packages/rules-engine/src/feats/index.ts` (4 lines):
```typescript
export * from './bab-calculator';
export * from './feat-prerequisite';
export * from './feat-eligibility';
export * from './feat-revalidation';
```
Phase 7 version exports caster-level, spell-prerequisite, spell-eligibility, domain-rules, magic-revalidation, magic-legality-aggregator, catalog-fail-closed.

---

### `apps/planner/src/features/magic/compiled-magic-catalog.ts` (config, barrel-export)

**Analog:** `apps/planner/src/features/feats/compiled-feat-catalog.ts` (2 lines):
```typescript
export { compiledFeatCatalog } from '@planner/data/compiled-feats';
export { compiledClassCatalog } from '@planner/data/compiled-classes';
```
Phase 7: `compiledDomainCatalog` from `@planner/data/compiled-domains`, `compiledSpellCatalog` from `@planner/data/compiled-spells`, plus re-export `compiledClassCatalog`.

---

### `apps/planner/src/features/magic/store.ts` (store, CRUD)

**Analog:** `apps/planner/src/features/feats/store.ts`

**Imports + fixture pattern** (lines 1-8):
```typescript
import { create } from 'zustand';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';

import { compiledFeatCatalog } from './compiled-feat-catalog';
import {
  PROGRESSION_LEVELS,
  type ProgressionLevel,
} from '../level-progression/progression-fixture';
```

**Per-level record pattern** (lines 10-28):
```typescript
export interface FeatLevelRecord {
  classFeatId: CanonicalId | null;
  generalFeatId: CanonicalId | null;
  level: ProgressionLevel;
}

export interface FeatStoreState {
  activeLevel: ProgressionLevel;
  datasetId: string;
  lastEditedLevel: ProgressionLevel | null;
  levels: FeatLevelRecord[];
  clearClassFeat: (level: ProgressionLevel) => void;
  clearGeneralFeat: (level: ProgressionLevel) => void;
  resetFeatSelections: () => void;
  resetLevel: (level: ProgressionLevel) => void;
  setActiveLevel: (level: ProgressionLevel) => void;
  setClassFeat: (level: ProgressionLevel, featId: CanonicalId) => void;
  setGeneralFeat: (level: ProgressionLevel, featId: CanonicalId) => void;
}
```

**Factory helpers pattern** (lines 30-45):
```typescript
export function createEmptyFeatLevels(): FeatLevelRecord[] {
  return PROGRESSION_LEVELS.map((level) => ({
    classFeatId: null,
    generalFeatId: null,
    level,
  }));
}

export function createInitialFeatState() {
  return {
    activeLevel: 1 as ProgressionLevel,
    datasetId: compiledFeatCatalog.datasetId,
    lastEditedLevel: null,
    levels: createEmptyFeatLevels(),
  };
}
```
**Re-use exactly**: tests rely on `create*` factories (see `tests/phase-06/feat-store.spec.ts:10-12` for `beforeEach(() => useFeatStore.setState(createInitialFeatState()))`).

**Action shape pattern** (lines 47-88):
```typescript
export const useFeatStore = create<FeatStoreState>((set) => ({
  ...createInitialFeatState(),
  setClassFeat: (level, featId) =>
    set((state) => ({
      lastEditedLevel: level,
      levels: state.levels.map((r) =>
        r.level === level ? { ...r, classFeatId: featId } : r,
      ),
    })),
  // ...
}));
```

**Phase 7 adaptation:** `MagicLevelRecord { level, domains: CanonicalId[], spellbookAdditions: Record<number, CanonicalId[]>, knownSpells: Record<number, CanonicalId[]>, swapsApplied: Array<{ forgotten, learned, appliedAtLevel }> }`. Actions per D-14/D-15/D-16: `setDomains`, `addSpellbookEntry`, `removeSpellbookEntry`, `addKnownSpell`, `applySwap`, `resetLevel`, `resetMagicSelections`. See store complexity precedent in `apps/planner/src/features/skills/store.ts:105-147` for multi-step mutations with helper functions (`updateLevelSkillRank`, `getCurrentLevelSkillRank`).

---

### `apps/planner/src/features/magic/selectors.ts` (service, transform)

**Analog:** `apps/planner/src/features/feats/selectors.ts`

**Imports + multi-store composition pattern** (lines 1-27):
```typescript
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';
import {
  computeTotalBab,
  computeFortSave,
} from '@rules-engine/feats/bab-calculator';
import {
  evaluateFeatPrerequisites,
  type BuildStateAtLevel,
} from '@rules-engine/feats/feat-prerequisite';
import {
  determineFeatSlots,
  getEligibleFeats,
} from '@rules-engine/feats/feat-eligibility';
import {
  revalidateFeatSnapshotAfterChange,
  type FeatEvaluationStatus,
  type FeatLevelInput,
} from '@rules-engine/feats/feat-revalidation';

import { shellCopyEs } from '@planner/lib/copy/es';
import type { CharacterFoundationStoreState } from '@planner/features/character-foundation/store';
import type { ProgressionLevel } from '@planner/features/level-progression/progression-fixture';
import type { LevelProgressionStoreState } from '@planner/features/level-progression/store';
import type { SkillStoreState } from '@planner/features/skills/store';

import { compiledFeatCatalog, compiledClassCatalog } from './compiled-feat-catalog';
import type { FeatLevelRecord, FeatStoreState } from './store';
```

**`computeBuildStateAtLevel` composition pattern** (lines 123-211):
```typescript
export function computeBuildStateAtLevel(
  level: ProgressionLevel,
  foundationState: CharacterFoundationStoreState,
  progressionState: LevelProgressionStoreState,
  skillState: SkillStoreState,
  featState: FeatStoreState,
): BuildStateAtLevel {
  // 1. Ability scores: base + ability increases from progression
  const abilityScores: Record<string, number> = { ...foundationState.baseAttributes };
  for (const rec of progressionState.levels) {
    if (rec.level <= level && rec.abilityIncrease) {
      abilityScores[rec.abilityIncrease] = (abilityScores[rec.abilityIncrease] ?? 0) + 1;
    }
  }

  // 2. Class levels: count levels per class up to current level
  const classLevels: Record<string, number> = {};
  for (const rec of progressionState.levels) {
    if (rec.level <= level && rec.classId) {
      classLevels[rec.classId] = (classLevels[rec.classId] ?? 0) + 1;
    }
  }

  // 3. BAB
  const bab = computeTotalBab(classLevels, compiledClassCatalog);

  // 4. Skill ranks, 5. feats, 6. Fort save... (unchanged Phase 7)

  return {
    abilityScores,
    bab,
    characterLevel: level,
    classLevels,
    fortitudeSave,
    selectedFeatIds,
    skillRanks,
    spellcastingLevel: 0, // Phase 7 will compute this
  };
}
```

**Phase 7 MUST edit this function** at `apps/planner/src/features/feats/selectors.ts:209` — replace `spellcastingLevel: 0` with `casterLevelByClass: computeCasterLevelByClass(classLevels, compiledClassCatalog)` and a derived `getMaxSpellLevelAcrossClasses(...)` for feat `minSpellLevel` prereqs (RESEARCH §Pitfall 3). This is a coordinated edit between plans.

**View-model pattern** (lines 58-117) — structural template:
```typescript
export interface FeatOptionView {
  category: string;
  categoryLabel: string;
  description: string;
  featId: string;
  label: string;
  /** D-04: inline prereq text e.g. "[Fue 13, Poder]" */
  prereqSummary: string;
  selected: boolean;
}

export interface ActiveFeatSheetView {
  classId: CanonicalId | null;
  classLabel: string | null;
  eligibleClassFeats: FeatOptionView[];
  eligibleGeneralFeats: FeatOptionView[];
  emptyMessage: string;
  hasClassBonusSlot: boolean;
  hasGeneralSlot: boolean;
  level: ProgressionLevel;
  selectedClassFeatId: CanonicalId | null;
  selectedGeneralFeatId: CanonicalId | null;
  status: FeatEvaluationStatus;
  title: string;
}

export interface FeatBoardView {
  activeSheet: ActiveFeatSheetView;
  emptyStateBody: string | null;
  /** D-03: which step is active in the sequential flow */
  sequentialStep: 'class-bonus' | 'general' | null;
}
```

**Phase 7 view models:** `SpellOptionView`, `DomainOptionView`, `ActiveMagicSheetView { paradigm: 'domains' | 'spellbook' | 'known' | 'prepared-summary' | 'empty', level, classId, slotCounts, eligibleSpells, selectedSpells, status, title }`, `MagicBoardView { activeSheet, emptyStateBody, swapAvailable: boolean, swapLevel: number | null }`.

**Empty-state + revalidation orchestration** (lines 290-426) — direct template:
```typescript
export function selectFeatBoardView(
  featState: FeatStoreState,
  progressionState: LevelProgressionStoreState,
  foundationState: CharacterFoundationStoreState,
  skillState: SkillStoreState,
): FeatBoardView {
  const progressionHasClass = progressionState.levels.some(
    (level) => level.classId !== null,
  );

  if (!progressionHasClass) {
    // return empty state...
  }

  // compute buildState, eligible options, revalidate all levels:
  const revalidationInput: FeatLevelInput[] = featState.levels.map((lvl) => ({
    buildState: computeBuildStateAtLevel(/*...*/),
    classFeatId: lvl.classFeatId,
    generalFeatId: lvl.generalFeatId,
    level: lvl.level,
  }));
  const revalidated = revalidateFeatSnapshotAfterChange({
    levels: revalidationInput,
    featCatalog: compiledFeatCatalog,
  });
  const activeRevalidated = revalidated.find((r) => r.level === activeLevel) ?? null;

  // compose activeSheet view model with activeRevalidated.status
  // ...
}
```

**Spanish prereq-summary helper** (lines 217-254):
```typescript
function buildPrereqSummary(featId: string, buildState: BuildStateAtLevel): string {
  const feat = compiledFeatCatalog.feats.find((f) => f.id === featId);
  if (!feat) return '';

  const result = evaluateFeatPrerequisites(feat, buildState, compiledFeatCatalog);
  if (result.checks.length === 0) return '';

  const parts = result.checks.map((check) => {
    if (check.type === 'ability') return `${check.label} ${check.required}`;
    if (check.type === 'bab') return `BAB ${check.required}`;
    if (check.type === 'feat' || check.type === 'or-feats') return check.label;
    if (check.type === 'skill') return `${check.label} ${check.required}`;
    return check.label;
  });

  return `[${parts.join(', ')}]`;
}
```
Phase 7 `buildSpellPrereqSummary` mirrors this exactly, swapping the evaluator to `evaluateSpellPrerequisites`.

---

### `apps/planner/src/features/magic/magic-board.tsx` (component, request-response)

**Analog:** `apps/planner/src/features/feats/feat-board.tsx` (entire file, lines 1-57)

**Imports pattern** (lines 1-11):
```typescript
import { useState } from 'react';
import { shellCopyEs } from '@planner/lib/copy/es';
import { SelectionScreen } from '@planner/components/ui/selection-screen';
import { DetailPanel } from '@planner/components/ui/detail-panel';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useSkillStore } from '@planner/features/skills/store';
import { selectFeatBoardView } from './selectors';
import { FeatSheet } from './feat-sheet';
import { FeatDetailPanel } from './feat-detail-panel';
import { useFeatStore } from './store';
```

**Component body pattern** (lines 13-57):
```typescript
export function FeatBoard() {
  const featState = useFeatStore();
  const progressionState = useLevelProgressionStore();
  const foundationState = useCharacterFoundationStore();
  const skillState = useSkillStore();
  const boardView = selectFeatBoardView(
    featState, progressionState, foundationState, skillState,
  );

  const [focusedFeatId, setFocusedFeatId] = useState<string | null>(null);

  if (boardView.emptyStateBody) {
    return (
      <SelectionScreen title={shellCopyEs.stepper.stepTitles.feats}>
        <DetailPanel title={shellCopyEs.feats.emptyStateHeading} body={boardView.emptyStateBody} />
        <div />
      </SelectionScreen>
    );
  }

  const title = boardView.sequentialStep === 'class-bonus'
    ? shellCopyEs.feats.classFeatStepTitle
    : boardView.sequentialStep === 'general'
      ? shellCopyEs.feats.generalFeatStepTitle
      : shellCopyEs.stepper.stepTitles.feats;

  return (
    <SelectionScreen title={title} className="feat-board">
      <FeatSheet boardView={boardView} focusedFeatId={focusedFeatId} onFocusFeat={setFocusedFeatId} />
      <FeatDetailPanel boardView={boardView} focusedFeatId={focusedFeatId} />
    </SelectionScreen>
  );
}
```
**Phase 7 adaptation:** `useMagicStore`, `selectMagicBoardView(...)` (adds magic state to 4-store composition → 5-store), title dispatches by `boardView.paradigm` (domains / grimorio / known / prepared-summary) per UI-SPEC §Copywriting sub-step titles.

---

### `apps/planner/src/features/magic/magic-sheet.tsx` (component, request-response)

**Analog:** `apps/planner/src/features/feats/feat-sheet.tsx`

**Props shape + store-action bindings pattern** (lines 9-80):
```typescript
interface FeatSheetProps {
  boardView: FeatBoardView;
  focusedFeatId: string | null;
  onFocusFeat: (featId: string | null) => void;
}

export function FeatSheet({ boardView, focusedFeatId, onFocusFeat }: FeatSheetProps) {
  const setClassFeat = useFeatStore((s) => s.setClassFeat);
  const setGeneralFeat = useFeatStore((s) => s.setGeneralFeat);
  // ...
  const handleSelectClassFeat = (featId: string) => {
    onFocusFeat(featId);
    setClassFeat(activeLevel, featId as CanonicalId);
  };
```

**Section wrapper pattern** (lines 94-152):
```typescript
return (
  <aside className="planner-panel planner-panel--inner feat-sheet">
    <div className="feat-board__search">
      <input type="search" role="searchbox" aria-label="Buscar dotes" /* ... */ />
    </div>
    {/* conditional sections: */}
    {showClassSection ? (
      <section className="feat-sheet__group">
        <h3 className="feat-board__section-heading">{shellCopyEs.feats.sectionClassFeats}</h3>
        <OptionList items={classItems} onSelect={handleSelectClassFeat} renderItem={renderFeatItem} />
      </section>
    ) : null}
  </aside>
);
```
**Phase 7 adaptation:** MagicSheet dispatches by `boardView.paradigm`:
- `'domains'` → `<DomainTileGrid />`
- `'spellbook'` → `<SpellLevelTabs />` + spellbook add/remove list built from `OptionList` (reuse `renderItem` pattern)
- `'known'` → `<SpellLevelTabs />` + known list + `<SwapSpellDialog>` trigger
- `'prepared-summary'` → read-only slot card
- `'empty'` → empty-state body (UI-SPEC "Esta clase no lanza conjuros en este nivel")

The `aside.planner-panel.planner-panel--inner.magic-sheet` class shape matches UI-SPEC §Layout Contract exactly.

---

### `apps/planner/src/features/magic/magic-detail-panel.tsx` (component, request-response)

**Analog:** `apps/planner/src/features/feats/feat-detail-panel.tsx` (entire file, lines 1-89)

**Direct re-use pattern** (lines 16-88):
```typescript
export function FeatDetailPanel({ boardView, focusedFeatId }: FeatDetailPanelProps) {
  const featState = useFeatStore();
  // ... pull stores, compute buildState ...
  if (!focusedFeatId) {
    return <DetailPanel title={shellCopyEs.stepper.stepTitles.feats} body={shellCopyEs.feats.emptyStateBody} />;
  }

  const feat = compiledFeatCatalog.feats.find((f) => f.id === focusedFeatId);
  if (!feat) {
    return <DetailPanel title={focusedFeatId} body={shellCopyEs.feats.emptyStateBody} />;
  }

  const buildState = computeBuildStateAtLevel(/*...*/);
  const prereqResult = evaluateFeatPrerequisites(feat, buildState, compiledFeatCatalog);

  return (
    <DetailPanel title={feat.label} className="feat-detail-panel">
      <div className="detail-panel__body">{feat.description}</div>
      {prereqResult.checks.length > 0 && (
        <ul className="feat-board__prereq-list" role="list">
          {prereqResult.checks.map((check, i) => (
            <li
              key={`${check.type}-${i}`}
              className={`feat-board__prereq-item ${check.met ? 'is-met' : 'is-failed'}`}
              role="listitem"
              aria-label={check.met ? `${check.label} cumplido` : `${check.label} no cumplido`}
            >
              {check.met ? (
                <span>{check.label} {check.required} &#10003;</span>
              ) : (
                <span>{check.label} {check.required} ({shellCopyEs.feats.prereqPrefix} {check.current}) &#10007;</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </DetailPanel>
  );
}
```

**Phase 7 adaptation:** Two branches — spell selected vs domain selected. For domains, body shows `domain.description` plus an eyebrow list of `domain.grantedFeatIds.map(...)` + a "CONJUROS ADICIONALES" list of `domain.spellIds[level].map(...)` (UI-SPEC §Data-to-UI Contract). Reuse `feat-board__prereq-list` class for spell prereq rendering — UI-SPEC §Rejection presentation says to mirror exactly.

**Fail-closed fallback for empty descriptions** (D-13 + RESEARCH §Pitfall 1):
```typescript
<div className="detail-panel__body">
  {spell.description || shellCopyEs.magic.missingDescription /* "Descripción no disponible — completar en próxima extracción" */}
</div>
```

---

### `apps/planner/src/features/magic/magic-sheet-tab.tsx` (component, request-response)

**Analog:** `apps/planner/src/features/feats/feat-sheet-tab.tsx` (entire file, lines 1-73)

**Complete structural template:**
```typescript
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useSkillStore } from '@planner/features/skills/store';
import { shellCopyEs } from '@planner/lib/copy/es';
import { selectFeatSheetTabView } from './selectors';
import { useFeatStore } from './store';

const SLOT_LABELS: Record<string, string> = {
  'class-bonus': 'Dote de clase',
  'general': 'Dote general',
  'auto': shellCopyEs.feats.autoGrantedLabel,
};

export function FeatSheetTab() {
  const featState = useFeatStore();
  // ... stores ...
  const sheetTabView = selectFeatSheetTabView(/*...*/);

  return (
    <div role="tabpanel" id="sheet-panel-feats" aria-labelledby="sheet-tab-feats" className="feat-sheet-tab">
      <div className="feat-sheet-tab__header">
        <span>{shellCopyEs.feats.sheetTabTotal.replace('{count}', String(sheetTabView.totalCount))}</span>
        {sheetTabView.invalidCount > 0 && (
          <span> - {shellCopyEs.feats.sheetTabInvalid.replace('{count}', String(sheetTabView.invalidCount))}</span>
        )}
      </div>
      {sheetTabView.groups.map((group) => (
        <section className="feat-sheet-tab__group" key={group.level}>
          <h3>{group.heading}</h3>
          {group.feats.map((feat) => (
            <article key={feat.featId} className={`feat-sheet-tab__row is-${feat.status}${feat.auto ? ' is-auto' : ''}`}>
              <span className="feat-sheet-tab__label">{feat.label}</span>
              <span className="feat-sheet-tab__slot">{SLOT_LABELS[feat.slot] ?? feat.slot}</span>
              {feat.statusReason && <span className="feat-sheet-tab__reason">{feat.statusReason}</span>}
            </article>
          ))}
        </section>
      ))}
    </div>
  );
}
```

**Phase 7 adaptation:** `role="tabpanel" id="sheet-panel-spells" aria-labelledby="sheet-tab-spells"` (UI-SPEC line 320). Class `magic-sheet-tab` reusing CSS parity: `__group`, `__row`, `__label`, `__slot`, `__reason`. Groups = `{class, spellLevel}` pairs (UI-SPEC line 322 "{Clase} — Nivel de lanzador {N}"). SLOT_LABELS includes keys `'del-dominio'` → `'Del dominio'`, `'auto'` → `'Automático'`, `'spellbook'` → `'Grimorio'`, `'known'` → `'Conocido'` — source strings from `shellCopyEs.magic` per UI-SPEC §Copywriting.

---

### `apps/planner/src/features/magic/spell-level-tabs.tsx` (component, request-response)

**Analog:** No direct match. Closest structural reference is the `level-sub-steps.tsx` tab rail pattern (10 `StepperStep` instances via `levelSubSteps.map`). Use UI-SPEC §Spell Level Tabs for visual contract.

**Skeleton pattern:**
```typescript
interface SpellLevelTabsProps {
  activeSpellLevel: number;
  classId: CanonicalId;
  slotsByLevel: Record<number, { current: number; max: number; status: 'legal' | 'blocked' | 'illegal' }>;
  onSelect: (spellLevel: number) => void;
}

export function SpellLevelTabs(props: SpellLevelTabsProps) {
  const spellLevels = Array.from({ length: 10 }, (_, i) => i); // 0..9
  return (
    <div role="tablist" aria-label="Niveles de conjuro" className="magic-board__level-tabs">
      {spellLevels.map((lvl) => {
        const entry = props.slotsByLevel[lvl];
        const disabled = !entry || entry.max === 0;
        const isActive = lvl === props.activeSpellLevel;
        return (
          <button
            key={lvl}
            role="tab"
            aria-selected={isActive}
            aria-disabled={disabled}
            className={`magic-board__level-tab ${isActive ? 'is-active' : ''} ${disabled ? 'is-disabled' : ''}`}
            onClick={() => !disabled && props.onSelect(lvl)}
          >
            {`Nivel ${lvl}`}
            {entry && entry.max > 0 && <span className="magic-board__level-tab-counter">{entry.current}/{entry.max}</span>}
          </button>
        );
      })}
    </div>
  );
}
```
CSS class targets per UI-SPEC §Color (`.magic-board__level-tab.is-active` gold bottom border, etc.).

---

### `apps/planner/src/features/magic/domain-tile-grid.tsx` (component, request-response)

**Analog:** `apps/planner/src/features/feats/feat-sheet.tsx` (OptionList usage + section wrapper)

**Phase 7 adaptation:** 2-col grid of domain tiles via CSS grid (`.magic-board__domain-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-sm); }`). Each tile = click target that sets `focusedDomainId` + calls `setDomains(level, [...selected, domainId])` on commit. Apply state classes (`is-eligible` / `is-selected` / `is-ineligible-hard`) from UI-SPEC §Color table. Selection cap = 2 (cleric level 1 only) enforced by store + hard-block prereq from `evaluateDomainSelection`.

---

### `apps/planner/src/features/magic/spell-row.tsx` (component, request-response)

**Analog:** `apps/planner/src/features/feats/feat-sheet-tab.tsx` row shape (lines 55-67)

**Row structure pattern:**
```typescript
<article key={feat.featId} className={`feat-sheet-tab__row is-${feat.status}${feat.auto ? ' is-auto' : ''}`}>
  <span className="feat-sheet-tab__label">{feat.label}</span>
  <span className="feat-sheet-tab__slot">{SLOT_LABELS[feat.slot] ?? feat.slot}</span>
  {feat.statusReason && <span className="feat-sheet-tab__reason">{feat.statusReason}</span>}
</article>
```

**Phase 7 adaptation:** `className="magic-sheet__row is-{state}"` with states from UI-SPEC §Color line 112-118. Add `+` / `-` button (reuse `NwnButton` primitive) and inline rejection span — state classes mirror `.feat-board__blocked-reason.is-failed` + `.skill-sheet__row.is-illegal` (UI-SPEC §Rejection presentation).

---

### `apps/planner/src/features/magic/swap-spell-dialog.tsx` (component, request-response)

**Analog:** `apps/planner/src/components/ui/confirm-dialog.tsx` (wrapper pattern)

**ConfirmDialog source** (entire file, 36 lines):
```typescript
export function ConfirmDialog({ body, onCancel, onConfirm, open, title }: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog className="nwn-frame confirm-dialog" ref={dialogRef} onCancel={onCancel}>
      <h2 className="confirm-dialog__title">{title}</h2>
      <p className="confirm-dialog__body">{body}</p>
      <div className="confirm-dialog__actions">
        <NwnButton onClick={onCancel} variant="secondary">Cancelar</NwnButton>
        <NwnButton onClick={onConfirm} variant="primary">Aceptar</NwnButton>
      </div>
    </dialog>
  );
}
```

**Phase 7 adaptation:** Two-step stateful wrapper orchestrating two sequential ConfirmDialog opens — step 1 "Olvida un conjuro" with an OptionList of currently-known spells, step 2 "Aprende un conjuro" with OptionList of eligible spells at the swap level, then a final confirm with both picks. Body text from `shellCopyEs.magic.swapConfirmBody` (UI-SPEC §Copywriting line 382).

---

### `apps/planner/src/lib/copy/es.ts` (config, modification)

**Analog:** existing `shellCopyEs.feats` namespace (lines 125-155) — template for `shellCopyEs.magic`:
```typescript
feats: {
  classFeatStepTitle: 'Dote de clase',
  emptyStateBody: 'Completa una progresion valida en Construccion para seleccionar dotes por nivel.',
  emptyStateHeading: 'Las dotes siguen bloqueadas',
  errorState: 'Seleccion no permitida: revisa los requisitos marcados y corrige el paso anterior.',
  planStates: {
    empty: 'Sin dotes seleccionadas',
    inProgress: 'Dotes en curso',
    ready: 'Dotes listas',
    repair: 'Dotes en reparacion',
  },
  prereqPrefix: 'Requiere:',
  // ... etc
},
```

**Phase 7 `shellCopyEs.magic` keys** — all strings enumerated in UI-SPEC §Copywriting Contract (lines 360-409). Key additions:
```typescript
magic: {
  // Sub-step titles (per paradigm)
  domainsStepTitle: 'Selecciona los dominios del nivel',
  spellbookStepTitle: 'Amplía el grimorio',
  knownSpellsStepTitle: 'Selecciona los conjuros conocidos',
  preparedStepTitle: 'Magia preparada por descanso',
  noCastingStepTitle: 'Este nivel no concede magia',
  // Actions
  addToSpellbook: 'Escribir conjuro',
  removeFromSpellbook: 'Eliminar del grimorio',
  learnSpell: 'Aprender conjuro',
  swapSpell: 'Cambiar conjuro conocido',
  // Rejection prefixes
  rejectionPrefixHard: 'Requiere',
  rejectionPrefixRepair: 'Reparar:',
  rejectionPrefixIllegal: 'No válido:',
  // Soft-block messages
  slotOverflow: 'Ranura nivel {N} agotada: reduce o elimina una selección.',
  knownOverflow: 'Conocidos agotados: olvida un conjuro antes de aprender otro.',
  domainMismatch: 'Dominio incompatible con la clase actual: repara o reinicia la selección.',
  // Catalog fail-closed fallback
  missingDescription: 'Descripción no disponible — completar en próxima extracción',
  missingGrants: '(pendiente extracción)',
  // Validation pill
  validationLegal: 'Magia coherente',
  validationRepair: 'Magia en reparación',
  validationIllegal: 'Magia no válida',
  // Plan states
  planStates: {
    empty: 'Sin magia',
    inProgress: 'Magia en curso',
    ready: 'Magia lista',
    repair: 'Magia en reparación',
  },
  // ... all other strings from UI-SPEC §Copywriting
} as const,
```

**Existing key edits** (lines 165-175):
- `stepper.levelSubSteps.spells: 'Conjuros'` → `'Magia'` (UI-SPEC §Stepper Integration: display label change only; union identifier stays `'spells'` per RESEARCH §Pitfall 2)
- `stepper.stepTitles.spells: 'Selecciona los conjuros del nivel'` → dispatched at selector layer by paradigm (RESEARCH recommends keeping static here, letting `MagicBoard` override with paradigm-specific title from `shellCopyEs.magic.*StepTitle`)

---

### `apps/planner/src/components/shell/center-content.tsx` (modification)

**Analog:** existing switch statement (lines 24-33)

**Exact edit target:**
```typescript
// BEFORE (line 31-32):
case 'spells':
  return <PlaceholderScreen title="Conjuros" body="Los conjuros se habilitaran en una fase posterior." />;

// AFTER:
case 'spells':
  return <MagicBoard />;
```

Plus add top-of-file import: `import { MagicBoard } from '@planner/features/magic/magic-board';`

---

### `apps/planner/src/components/shell/character-sheet.tsx` (modification)

**Analog:** existing `FeatSheetTab` integration (line 139)

**Exact edit target:**
```typescript
// BEFORE (lines 106-111, 140):
function SpellsPanel() {
  return (
    <div role="tabpanel" id="sheet-panel-spells" aria-labelledby="sheet-tab-spells">
      <p>Conjuros del personaje</p>
    </div>
  );
}
// ...
{activeTab === 'spells' && <SpellsPanel />}

// AFTER: delete SpellsPanel entirely, replace usage:
{activeTab === 'spells' && <MagicSheetTab />}
```

Plus add top-of-file import: `import { MagicSheetTab } from '@planner/features/magic/magic-sheet-tab';`

---

### `apps/planner/src/components/shell/level-sub-steps.tsx` (modification)

**Analog:** existing `levelSubSteps.map` at line 16

**Phase 7 edit pattern** (D-02 filtering):
```typescript
// Before:
{levelSubSteps.map((subStep) => { /* unconditional render */ })}

// After:
{levelSubSteps
  .filter((subStep) =>
    subStep.id !== 'spells' || classHasCastingAtLevel(level, classCatalogFromProgressionStore)
  )
  .map((subStep) => { /* unchanged */ })}
```
Helper `classHasCastingAtLevel(level, ctx)` reads progression-store + compiledClassCatalog to check `classDef.spellCaster === true` at `level`.

Also extend the stepper status prop to propagate `magic` severity — `status={magicStatusForLevel(subStep.id, level) ?? (isActive ? 'active' : 'complete')}` using `StepperStep` 'blocked' / 'illegal' / 'repair_needed' states per UI-SPEC §Stepper Integration.

---

### `apps/planner/src/state/planner-shell.ts` (modification)

**Analog:** existing `PlannerValidationStatus` union (line 4)

**Exact edit target:**
```typescript
// BEFORE:
export type PlannerValidationStatus = 'blocked' | 'illegal' | 'legal' | 'pending';

// AFTER (per OQ-4 + UI-SPEC §Shell Summary Severity):
export type PlannerValidationStatus = 'blocked' | 'illegal' | 'legal' | 'pending' | 'repair_needed';
```
Plus add a severity projector (RESEARCH §Code Examples "Planner-shell severity extension"):
```typescript
function projectSeverity(s: AllStores): PlannerValidationStatus {
  if (s.foundation.status === 'illegal' || s.foundation.status === 'blocked') return s.foundation.status;
  if (s.progression.status === 'illegal' || s.progression.status === 'blocked') return s.progression.status;
  if (s.skills.status === 'illegal' || s.skills.status === 'blocked') return s.skills.status;
  if (s.feats.status === 'illegal' || s.feats.status === 'blocked') return s.feats.status;
  if (s.magic.status === 'illegal') return 'illegal';            // NEW
  if (s.magic.status === 'blocked') return 'repair_needed';     // NEW (D-08 soft block)
  return 'legal';
}
```

---

### `packages/rules-engine/src/feats/feat-prerequisite.ts` (modification)

**Analog:** existing `BuildStateAtLevel` (lines 10-27)

**Exact edit target** (RESEARCH §Pitfall 3, Assumption A4):
```typescript
// BEFORE (line 26):
  /** Max spell level castable (0 until Phase 7) */
  spellcastingLevel: number;

// AFTER:
  /** Per-class caster level (class:wizard → 5, class:cleric → 3, etc.) */
  casterLevelByClass: Record<string, number>;
```
Plus add a derived helper (exported for feat `minSpellLevel` prereq checks):
```typescript
export function getMaxSpellLevelAcrossClasses(
  buildState: BuildStateAtLevel,
  spellCatalog: SpellCatalog,
  classCatalog: ClassCatalog,
): number {
  // iterate buildState.casterLevelByClass, look up max accessible spell level per class
  // via spellCatalog.spellGainTables[classId][casterLevel-1].slots (highest level with slots > 0)
  // return max across classes
}
```

Coordinate edit with `apps/planner/src/features/feats/selectors.ts:209`. All existing tests in `tests/phase-06/feat-prerequisite.spec.ts` use `createBuildState` factory (line 8-22):
```typescript
function createBuildState(overrides: Partial<BuildStateAtLevel> = {}): BuildStateAtLevel {
  return {
    abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    bab: 0,
    // ...
    spellcastingLevel: 0,
    ...overrides,
  };
}
```
Update this factory's default `spellcastingLevel: 0` → `casterLevelByClass: {}` plus a `spellcastingLevelMax` helper-derived value if any test explicitly reads `minSpellLevel` prereqs. Audit every test file for `spellcastingLevel` references before editing.

---

## Shared Patterns

### Validation outcome construction (catalog fail-closed + illegal rules)

**Source:** `packages/rules-engine/src/contracts/validation-outcome.ts:80-136`
**Apply to:** `catalog-fail-closed.ts`, `magic-revalidation.ts`, `magic-legality-aggregator.ts`

```typescript
import { resolveValidationOutcome } from '../contracts/validation-outcome';

// Missing catalog data → blocked + missing-source:
resolveValidationOutcome({
  affectedIds: [entityId],
  blockKind: 'missing-source',
  hasConflict: false,
  hasMissingEvidence: true,
  passesRule: false,
  ruleKnown: true,
});

// Rule-failed (prereq) → illegal:
resolveValidationOutcome({
  affectedIds,
  hasConflict: false,
  hasMissingEvidence: false,
  passesRule: false,
  ruleKnown: true,
});
```
Produces discriminated union with `status: 'blocked' | 'illegal' | 'legal'`, `code`, `messageKey`, and shape consumed by all downstream view-model builders.

### Cascade revalidation (inheritedBreakLevel accumulator)

**Source:** `packages/rules-engine/src/feats/feat-revalidation.ts:74-191` + `packages/rules-engine/src/skills/skill-revalidation.ts:56-122`
**Apply to:** `magic-revalidation.ts`

Both prior implementations use identical body shapes. Pick `feat-revalidation.ts` as primary template (closest domain). The `dedupeIssues` and `getInheritedIssue` helpers must be copy-pasted byte-for-byte to prevent drift across the three cascade modules.

### Per-level zustand store shape

**Source:** `apps/planner/src/features/feats/store.ts:10-88` (simpler) and `apps/planner/src/features/skills/store.ts:10-147` (multi-field per level, closer to magic needs)
**Apply to:** `apps/planner/src/features/magic/store.ts`

Conventions to preserve:
- `activeLevel`, `datasetId`, `lastEditedLevel`, `levels` state keys
- `createEmpty*Levels()` + `createInitial*State()` factories (tests depend on these, see `tests/phase-06/feat-store.spec.ts:10-15`)
- Reducer shape: every setter returns `{ lastEditedLevel, levels: state.levels.map(...) }`
- Setters accept `level: ProgressionLevel` as first arg; tests assert `lastEditedLevel` is set
- Use `CanonicalId` type for all id fields (from `@rules-engine/contracts/canonical-id`)

### Multi-store selector composition

**Source:** `apps/planner/src/features/feats/selectors.ts:123-211` (`computeBuildStateAtLevel`) + lines 290-426 (`selectFeatBoardView`)
**Apply to:** `apps/planner/src/features/magic/selectors.ts`

Pass stores in **fixed order** (foundation, progression, skill, feat, magic) to all selectors. This matches the RESEARCH §Pitfall 4 fixed-phase compute order and prevents cascade cycles.

### Spanish ability labels + status enum constants

**Source:** `packages/rules-engine/src/feats/feat-prerequisite.ts:53-60` (ABILITY_LABELS) + `apps/planner/src/features/feats/selectors.ts:47-52` (STATUS_ORDER)
**Apply to:** `apps/planner/src/features/magic/selectors.ts` (import, don't duplicate)

```typescript
const ABILITY_LABELS: Record<string, string> = {
  str: 'Fuerza', dex: 'Destreza', con: 'Constitucion',
  int: 'Inteligencia', wis: 'Sabiduria', cha: 'Carisma',
};
```
Phase 7 adds (and SHOULD hand-author, since catalog uses English keys per RESEARCH lines 430-445):
```typescript
const SCHOOL_LABELS_ES: Record<string, string> = {
  abjuration: 'Abjuración',
  conjuration: 'Conjuración',
  divination: 'Adivinación',
  enchantment: 'Encantamiento',
  evocation: 'Evocación',
  illusion: 'Ilusión',
  necromancy: 'Nigromancia',
  transmutation: 'Transmutación',
  unknown: 'Desconocida',
};
```

### Test scaffolding (Vitest)

**Source:** `tests/phase-06/feat-prerequisite.spec.ts:1-22` (build-state factory) + `tests/phase-06/feat-store.spec.ts:1-15` (store beforeEach reset)
**Apply to:** every `tests/phase-07/*.spec.ts` file

```typescript
import { describe, expect, it, beforeEach } from 'vitest';
import { compiledFeatCatalog } from '@planner/data/compiled-feats';
import { createInitialFeatState, useFeatStore } from '@planner/features/feats/store';

describe('phase 06 feat store', () => {
  beforeEach(() => {
    useFeatStore.setState(createInitialFeatState());
  });
  // ...
});
```
Test file extension is `.spec.ts` (RESEARCH §Validation Architecture — `tests/**/*.spec.ts` only). Helper `createBuildState` pattern from `feat-prerequisite.spec.ts:8-22` should be adapted into `createMagicBuildState(overrides)` helper in `tests/phase-07/helpers.ts` or inlined per file.

### UI primitive composition (SelectionScreen + DetailPanel + OptionList + ConfirmDialog + NwnButton)

**Source:** UI-SPEC §Design System + `apps/planner/src/components/ui/*`
**Apply to:** All Phase 7 components

No new primitives may be introduced (UI-SPEC §Registry Safety). Every MagicBoard composition must wrap in `<SelectionScreen>` with `className="magic-board"`, left-pane under `<aside className="planner-panel planner-panel--inner magic-sheet">`, right-pane via `<DetailPanel className="magic-detail-panel">`.

### CSS class naming (BEM-style per feature)

**Source:** `app.css` `.feat-board__*`, `.feat-sheet-tab__*`, `.skill-sheet__*`, `.skill-board`
**Apply to:** All Phase 7 components

UI-SPEC §Layout Contract uses `.magic-board`, `.magic-sheet`, `.magic-detail-panel`, `.magic-board__section-heading`, `.magic-board__level-tab.is-active`, etc. Follow existing feature prefix convention; reuse `.feat-board__prereq-list` for spell prereq rendering (UI-SPEC says to mirror exactly, not to duplicate CSS).

### Cascade cycle avoidance

**Source:** RESEARCH §Pitfall 4 — new pattern (not present in existing code yet, but a known hazard)
**Apply to:** `apps/planner/src/features/feats/selectors.ts:209` + `apps/planner/src/features/magic/selectors.ts`

Fixed compute order per commit:
1. Foundation → ability scores
2. Progression → class levels, BAB, saves
3. Skills → skill ranks
4. **Magic pass 1: casterLevelByClass** (no feat input)
5. Feats → use casterLevelByClass for `minSpellLevel`
6. **Magic pass 2: selection legality** (uses selected feats for metamagic slot cost)

Planner should document this as comments in `selectors.ts` and avoid any magic → feat → magic back-edge.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `apps/planner/src/features/magic/spell-level-tabs.tsx` | component | request-response | No existing tablist with counter-pill pattern; build from scratch per UI-SPEC §Spell Level Tabs (loose inspiration from `stepper-step.tsx` state class conventions) |
| `packages/rules-engine/src/magic/catalog-fail-closed.ts` | utility | transform | Fail-closed helper around `resolveValidationOutcome` is new — no prior module dedicates itself to this. Pattern inferred from `validation-outcome.ts` and RESEARCH §Code Examples. Treat as new module, not an analog copy. |

Both files are low-risk because they have complete specifications in UI-SPEC / RESEARCH.

---

## Cross-Cutting Concerns for Planner

1. **Catalog completeness is a Wave 0 blocker**, not a runtime concern. Per RESEARCH Key Findings #1 and Catalog Completeness Risk section, Plan 07-01 must address the 376 empty spell descriptions and 27 empty domain `grantedFeatIds` BEFORE any UI work. Three remediation options (A, B, D from RESEARCH) should be scheduled in Plan 07-01.

2. **Sub-step identifier stays `'spells'`, display label becomes "Magia"** (RESEARCH §Pitfall 2 + UI-SPEC §Stepper Integration). Do NOT introduce a new `'magia'` union member — it cascades breakage across 20+ tests and existing copy keys.

3. **`BuildStateAtLevel.spellcastingLevel: 0` hardcode at `feats/selectors.ts:209`** must be replaced with per-class caster level map. This is a **coordinated edit** between the rules-engine plan and the feats-selector edit; both must ship together to avoid breaking feat tests.

4. **`PlannerValidationStatus` extension with `'repair_needed'`** (OQ-4 recommendation) is additive and safe. Apply in `state/planner-shell.ts` before wiring magic severity.

5. **Three open questions (OQ-1, OQ-2, OQ-3)** are still unresolved in research. Planner must either resolve via user clarification before plan execution OR include conservative-fallback TODO comments with override-registry paths (RESEARCH recommendation for OQ-3).

---

## Metadata

**Analog search scope:**
- `packages/rules-engine/src/feats/**`
- `packages/rules-engine/src/skills/**`
- `packages/rules-engine/src/contracts/**`
- `apps/planner/src/features/feats/**`
- `apps/planner/src/features/skills/**`
- `apps/planner/src/state/**`
- `apps/planner/src/components/shell/**`
- `apps/planner/src/components/ui/**`
- `apps/planner/src/lib/**`
- `tests/phase-06/**`

**Files scanned:** 28
**Pattern extraction date:** 2026-04-16
