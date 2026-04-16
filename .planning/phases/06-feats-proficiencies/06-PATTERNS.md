# Phase 06: Feats & Proficiencies - Pattern Map

**Mapped:** 2026-04-16
**Files analyzed:** 16 new/modified files
**Analogs found:** 16 / 16

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `packages/rules-engine/src/feats/feat-prerequisite.ts` | service | request-response | `packages/rules-engine/src/skills/skill-allocation.ts` | exact |
| `packages/rules-engine/src/feats/feat-eligibility.ts` | service | transform | `packages/rules-engine/src/skills/skill-allocation.ts` | role-match |
| `packages/rules-engine/src/feats/feat-revalidation.ts` | service | transform | `packages/rules-engine/src/skills/skill-revalidation.ts` | exact |
| `packages/rules-engine/src/feats/bab-calculator.ts` | utility | transform | `packages/rules-engine/src/skills/skill-allocation.ts` | role-match |
| `apps/planner/src/features/feats/compiled-feat-catalog.ts` | config | re-export | `apps/planner/src/features/skills/compiled-skill-catalog.ts` | exact |
| `apps/planner/src/features/feats/store.ts` | store | CRUD | `apps/planner/src/features/skills/store.ts` | exact |
| `apps/planner/src/features/feats/selectors.ts` | service | transform | `apps/planner/src/features/skills/selectors.ts` | exact |
| `apps/planner/src/features/feats/feat-board.tsx` | component | request-response | `apps/planner/src/features/skills/skill-board.tsx` | exact |
| `apps/planner/src/features/feats/feat-sheet.tsx` | component | request-response | `apps/planner/src/features/skills/skill-sheet.tsx` | role-match |
| `apps/planner/src/features/feats/feat-detail-panel.tsx` | component | request-response | `apps/planner/src/components/ui/detail-panel.tsx` | role-match |
| `apps/planner/src/features/feats/feat-sheet-tab.tsx` | component | request-response | `apps/planner/src/components/shell/character-sheet.tsx` (FeatsPanel) | exact |
| `apps/planner/src/features/feats/feat-search.tsx` | component | request-response | (none in codebase -- new pattern) | no-analog |
| `apps/planner/src/components/shell/center-content.tsx` (modify) | component | request-response | self (current `case 'feats'` placeholder) | exact |
| `apps/planner/src/components/shell/character-sheet.tsx` (modify) | component | request-response | self (current `FeatsPanel` placeholder) | exact |
| `tests/phase-06/*.spec.ts` (7 test files) | test | batch | `tests/phase-05/skill-rules.spec.ts` | exact |
| `apps/planner/src/lib/copy/es.ts` (modify) | config | N/A | self (existing `feats` keys in `stepper`) | exact |

## Pattern Assignments

### `packages/rules-engine/src/feats/feat-prerequisite.ts` (service, request-response)

**Analog:** `packages/rules-engine/src/skills/skill-allocation.ts`

**Imports pattern** (lines 1-10):
```typescript
import type { CanonicalId } from '../contracts/canonical-id';
import {
  type ValidationOutcome,
  resolveValidationOutcome,
} from '../contracts/validation-outcome';
import type {
  SkillCatalog,
  SkillRestrictionOverride,
} from '@data-extractor/contracts/skill-catalog';
```

Feat equivalent should import:
```typescript
import type { CanonicalId } from '../contracts/canonical-id';
import type {
  CompiledFeat,
  FeatCatalog,
  FeatPrerequisites,
} from '@data-extractor/contracts/feat-catalog';
```

**Core evaluation pattern** (lines 164-306 of skill-allocation.ts):
```typescript
// Pure function that takes an input object and returns a fully evaluated result.
// No side effects, no framework dependencies.
export function evaluateSkillLevel(
  input: EvaluateSkillLevelInput,
): EvaluatedSkillLevel {
  if (!input.level.classId) {
    return {
      allocations: [],
      availablePoints: 0,
      issues: [],
      level: input.level.level,
      remainingPoints: 0,
      spentPoints: 0,
      status: 'pending',
    };
  }
  // ... evaluates each allocation, collects issues, returns status
}
```

The feat prerequisite evaluator should follow this shape: a pure function taking `(feat, buildState, featCatalog)` and returning `{ met: boolean, checks: PrerequisiteCheck[] }`. Each prerequisite type becomes a check entry (same as each skill allocation becomes an evaluated allocation).

**Status derivation pattern** (lines 65-75):
```typescript
function getStatusFromIssues(issues: ValidationOutcome[]): Exclude<SkillEvaluationStatus, 'pending'> {
  if (issues.some((issue) => issue.status === 'illegal')) {
    return 'illegal';
  }
  if (issues.some((issue) => issue.status === 'blocked')) {
    return 'blocked';
  }
  return 'legal';
}
```

---

### `packages/rules-engine/src/feats/feat-eligibility.ts` (service, transform)

**Analog:** `packages/rules-engine/src/skills/skill-allocation.ts`

**Snapshot evaluation pattern** (lines 308-328):
```typescript
export function evaluateSkillSnapshot(
  input: EvaluateSkillSnapshotInput,
): EvaluatedSkillSnapshot {
  const cumulativeRanks: Partial<Record<CanonicalId, number>> = {};
  const levels = input.levels.map((level) => {
    const evaluatedLevel = evaluateSkillLevel({
      catalog: input.catalog,
      cumulativeRanks,
      level,
    });
    for (const allocation of level.allocations) {
      cumulativeRanks[allocation.skillId] =
        (cumulativeRanks[allocation.skillId] ?? 0) + allocation.rank;
    }
    return evaluatedLevel;
  });
  return { levels };
}
```

The feat eligibility function should follow this sequential accumulation pattern: process levels 1..N, at each level accumulate the set of selected feats before evaluating what's eligible at the next level. The `cumulativeRanks` map becomes a `cumulativeSelectedFeatIds: Set<string>`.

---

### `packages/rules-engine/src/feats/feat-revalidation.ts` (service, transform)

**Analog:** `packages/rules-engine/src/skills/skill-revalidation.ts`

**Full file pattern** (lines 1-122):
```typescript
import type { CanonicalId } from '../contracts/canonical-id';
import {
  type ValidationOutcome,
  resolveValidationOutcome,
} from '../contracts/validation-outcome';
import type { SkillCatalog } from '@data-extractor/contracts/skill-catalog';
import {
  evaluateSkillSnapshot,
  type SkillLevelInput,
  type SkillEvaluationStatus,
} from './skill-allocation';

export interface RevalidateSkillSnapshotAfterChangeInput {
  catalog: SkillCatalog;
  levels: SkillLevelInput[];
}

export interface RevalidatedSkillLevel {
  inheritedFromLevel: number | null;
  issues: ValidationOutcome[];
  level: number;
  status: SkillEvaluationStatus;
}

// ... dedupeIssues, getInheritedIssue helpers ...

export function revalidateSkillSnapshotAfterChange(
  input: RevalidateSkillSnapshotAfterChangeInput,
): RevalidatedSkillLevel[] {
  const evaluated = evaluateSkillSnapshot(input);
  let inheritedBreakLevel: number | null = null;

  return input.levels.map((level, index) => {
    const evaluatedLevel = evaluated.levels[index];
    // ... cascading break propagation ...
  });
}
```

The feat revalidation function should follow this exact structure: re-evaluate all feat selections, then propagate inherited breaks downstream. The `inheritedBreakLevel` cascade pattern is the key mechanism to copy.

**Inherited break cascade** (lines 56-122):
```typescript
export function revalidateSkillSnapshotAfterChange(
  input: RevalidateSkillSnapshotAfterChangeInput,
): RevalidatedSkillLevel[] {
  const evaluated = evaluateSkillSnapshot(input);
  let inheritedBreakLevel: number | null = null;

  return input.levels.map((level, index) => {
    const evaluatedLevel = evaluated.levels[index];
    const affectedIds = level.allocations.map((allocation) => allocation.skillId);

    if (!level.classId) {
      return {
        inheritedFromLevel: null,
        issues: [],
        level: level.level,
        status: 'pending',
      };
    }

    if (evaluatedLevel.status === 'illegal') {
      if (inheritedBreakLevel === null) {
        inheritedBreakLevel = level.level;
      }
      return {
        inheritedFromLevel: null,
        issues: dedupeIssues(evaluatedLevel.issues),
        level: level.level,
        status: 'illegal',
      };
    }

    if (inheritedBreakLevel !== null) {
      return {
        inheritedFromLevel: inheritedBreakLevel,
        issues: dedupeIssues([getInheritedIssue(affectedIds)]),
        level: level.level,
        status: 'blocked',
      };
    }

    return {
      inheritedFromLevel: null,
      issues: [],
      level: level.level,
      status: 'legal',
    };
  });
}
```

---

### `packages/rules-engine/src/feats/bab-calculator.ts` (utility, transform)

**Analog:** `packages/rules-engine/src/skills/skill-allocation.ts` (for pure function shape) + `packages/data-extractor/src/contracts/class-catalog.ts` (for data types)

**Class catalog data shape** (class-catalog.ts lines 10-31):
```typescript
export const compiledClassSchema = z.object({
  attackBonusProgression: z.enum(BAB_PROGRESSIONS),  // 'low' | 'medium' | 'high'
  // ...
  savingThrows: z.object({
    fortitude: z.enum(SAVE_PROGRESSIONS),  // 'low' | 'high'
    reflex: z.enum(SAVE_PROGRESSIONS),
    will: z.enum(SAVE_PROGRESSIONS),
  }),
  // ...
});
```

The BAB calculator consumes `attackBonusProgression` from `CompiledClass` to compute total BAB. Same pure-function-with-typed-inputs pattern as other rules-engine files.

---

### `apps/planner/src/features/feats/compiled-feat-catalog.ts` (config, re-export)

**Analog:** `apps/planner/src/features/skills/compiled-skill-catalog.ts`

**Exact pattern** (full file, 2 lines):
```typescript
// Re-export from extracted data. The old hardcoded payload is replaced.
export { compiledSkillCatalog, getCompiledSkillRecord } from '@planner/data/compiled-skills';
```

Feat equivalent:
```typescript
export { compiledFeatCatalog } from '@planner/data/compiled-feats';
```

---

### `apps/planner/src/features/feats/store.ts` (store, CRUD)

**Analog:** `apps/planner/src/features/skills/store.ts`

**Store creation pattern** (lines 1-9, 49-63, 105-147):
```typescript
import { create } from 'zustand';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';

import { compiledSkillCatalog } from './compiled-skill-catalog';
import {
  PROGRESSION_LEVELS,
  type ProgressionLevel,
} from '../level-progression/progression-fixture';

// ... interface definitions ...

export function createEmptySkillLevels(): SkillLevelRecord[] {
  return PROGRESSION_LEVELS.map((level) => ({
    allocations: [],
    level,
  }));
}

export function createInitialSkillState() {
  return {
    activeLevel: 1 as ProgressionLevel,
    datasetId: compiledSkillCatalog.datasetId,
    lastEditedLevel: null,
    levels: createEmptySkillLevels(),
  };
}

// ... helper functions ...

export const useSkillStore = create<SkillStoreState>((set) => ({
  ...createInitialSkillState(),
  // actions as arrow functions using set()
  resetSkillAllocations: () => set(createInitialSkillState()),
  setActiveLevel: (activeLevel) => set({ activeLevel }),
  // ...
}));
```

Key patterns to replicate:
1. `create<StoreState>((set) => ({ ...initialState, ...actions }))` shape
2. `createEmptyLevels()` factory creating per-level records from `PROGRESSION_LEVELS`
3. `createInitialState()` factory used for both initialization and reset
4. Immutable updates via `set((state) => ({ ...updated }))` with map transforms
5. `datasetId` from compiled catalog for versioning

---

### `apps/planner/src/features/feats/selectors.ts` (service, transform)

**Analog:** `apps/planner/src/features/skills/selectors.ts`

**Multi-store selector signature** (lines 294-313, 568-589):
```typescript
function selectBoardArtifacts(
  skillState: SkillStoreState,
  progressionState: LevelProgressionStoreState,
  foundationState: CharacterFoundationStoreState,
) {
  const skillInputs = createSkillLevelInputs(skillState, progressionState, foundationState);
  const evaluation = evaluateSkillSnapshot({
    catalog: compiledSkillCatalog,
    levels: skillInputs,
  });
  const revalidated = revalidateSkillSnapshotAfterChange({
    catalog: compiledSkillCatalog,
    levels: skillInputs,
  });

  return {
    evaluation,
    revalidated,
    skillInputs,
  };
}

export function selectSkillBoardView(
  skillState: SkillStoreState,
  progressionState: LevelProgressionStoreState,
  foundationState: CharacterFoundationStoreState,
): SkillBoardView {
  const progressionHasClass = progressionState.levels.some((level) => level.classId !== null);
  return {
    activeSheet: selectActiveSkillSheetView(skillState, progressionState, foundationState),
    emptyStateBody: progressionHasClass ? null : shellCopyEs.skills.emptyStateBody,
    rail: selectSkillRail(skillState, progressionState, foundationState),
    summaryStrip: selectSkillSummaryStrip(skillState, progressionState, foundationState),
  };
}
```

The feat selectors must add `skillState: SkillStoreState` to the parameter list since feat prerequisites can check skill ranks. The selector receives all store states it depends on.

**View model pattern -- each selector returns a typed view interface** (lines 62-178):
```typescript
export interface SkillRailEntryView {
  active: boolean;
  classId: CanonicalId | null;
  classLabel: string | null;
  inheritedFromLevel: number | null;
  issueCount: number;
  level: ProgressionLevel;
  status: SkillEvaluationStatus;
}

export interface SkillBoardView {
  activeSheet: ActiveSkillSheetView;
  emptyStateBody: string | null;
  rail: SkillRailEntryView[];
  summaryStrip: SkillSummaryStripView;
}
```

**Intelligence modifier pattern for ability scores** (lines 195-206):
```typescript
function getIntelligenceModifier(
  foundationState: CharacterFoundationStoreState,
  progressionState: LevelProgressionStoreState,
  level: ProgressionLevel,
) {
  const baseIntelligence = foundationState.baseAttributes.int;
  const intelligenceIncreases = progressionState.levels.filter(
    (record) => record.level <= level && record.abilityIncrease === 'int',
  ).length;

  return Math.floor((baseIntelligence + intelligenceIncreases - 10) / 2);
}
```

This is the template for computing any ability score at a given level: `base + count of increases at levels <= current`. The feat selectors need a generalized version that computes all six ability scores at a given level.

**Category grouping pattern** (lines 528-535):
```typescript
const groupedRows = rows.reduce<Record<string, SkillSheetRowView[]>>(
  (accumulator, row) => {
    accumulator[row.category] ??= [];
    accumulator[row.category].push(row);
    return accumulator;
  },
  {},
);
```

Use this same reduce-to-groups pattern for feat categories.

**Status comparison / sort pattern** (lines 54-59, 500-505):
```typescript
const STATUS_ORDER: Record<SkillEvaluationStatus, number> = {
  blocked: 1,
  illegal: 0,
  legal: 2,
  pending: 3,
};
// ... sort rows by status then label:
.sort((left, right) => {
  const statusDelta = compareStatuses(left.status, right.status);
  return statusDelta !== 0 ? statusDelta : left.label.localeCompare(right.label);
});
```

---

### `apps/planner/src/features/feats/feat-board.tsx` (component, request-response)

**Analog:** `apps/planner/src/features/skills/skill-board.tsx`

**Full component pattern** (lines 1-37):
```typescript
import { shellCopyEs } from '@planner/lib/copy/es';
import { SelectionScreen } from '@planner/components/ui/selection-screen';
import { DetailPanel } from '@planner/components/ui/detail-panel';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { selectSkillBoardView } from './selectors';
import { SkillSheet } from './skill-sheet';
import { useSkillStore } from './store';

export function SkillBoard() {
  const skillState = useSkillStore();
  const progressionState = useLevelProgressionStore();
  const foundationState = useCharacterFoundationStore();
  const boardView = selectSkillBoardView(skillState, progressionState, foundationState);

  if (boardView.emptyStateBody) {
    return (
      <SelectionScreen title={shellCopyEs.stepper.stepTitles.skills}>
        <DetailPanel
          title={shellCopyEs.skills.emptyStateHeading}
          body={boardView.emptyStateBody}
        />
        <div />
      </SelectionScreen>
    );
  }

  return (
    <SelectionScreen title={shellCopyEs.stepper.stepTitles.skills}>
      <SkillSheet />
      <DetailPanel
        title="Habilidades"
        body="Distribuye los puntos de habilidad disponibles para este nivel."
      />
    </SelectionScreen>
  );
}
```

The FeatBoard follows this exact shape: consume stores, call selector, render `SelectionScreen` with `FeatSheet` (left) and `FeatDetailPanel` (right). The empty state handling with `emptyStateBody` check is the same pattern.

---

### `apps/planner/src/features/feats/feat-sheet.tsx` (component, request-response)

**Analog:** `apps/planner/src/features/skills/skill-sheet.tsx`

**Component structure pattern** (lines 104-173):
```typescript
export function SkillSheet() {
  const skillState = useSkillStore();
  const progressionState = useLevelProgressionStore();
  const foundationState = useCharacterFoundationStore();
  const activeSheet = selectActiveSkillSheetView(
    skillState,
    progressionState,
    foundationState,
  );

  return (
    <aside className="planner-panel planner-panel--inner level-sheet skill-sheet">
      <div>
        <h2>{activeSheet.title}</h2>
        <p className="detail-panel__body">
          {shellCopyEs.progression.levelLabel} {activeSheet.level}
          {activeSheet.classLabel ? ` · ${activeSheet.classLabel}` : ''}
        </p>
      </div>
      {/* ... summary grid, issues, grouped rows ... */}
      {activeSheet.classId ? (
        <div className="skill-sheet__groups">
          {activeSheet.groups.map((group) => (
            <section className="skill-sheet__group" key={group.category}>
              <h3>{group.heading}</h3>
              <div className="skill-sheet__rows">
                {group.rows.map((row) => (
                  <SkillRankRow key={row.skillId} level={activeSheet.level} row={row} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="level-sheet__placeholder">
          <p>{activeSheet.emptyMessage}</p>
        </div>
      )}
    </aside>
  );
}
```

The FeatSheet uses the same structure but replaces grouped skill rows with grouped feat options. For feats, the two sections are "Dotes de clase" and "Dotes generales" instead of skill categories.

**Row item sub-component pattern** (lines 10-101):
```typescript
function SkillRankRow({
  row,
  level,
}: {
  level: ProgressionLevel;
  row: SkillSheetRowView;
}) {
  const decrementSkillRank = useSkillStore((state) => state.decrementSkillRank);
  // ...
  return (
    <article className={`skill-sheet__row is-${row.status}`}>
      {/* ... */}
      {row.issues.length > 0 ? (
        <div className="skill-sheet__issues">
          {row.issues.map((issue) => (
            <p className={`foundation-step__issue is-${row.status}`} key={issue.key}>
              {issue.text}
            </p>
          ))}
        </div>
      ) : null}
    </article>
  );
}
```

This is the template for `FeatRow` -- each feat shows its name, prerequisites inline, and issues below. Instead of `className="skill-sheet__row"`, use `"feat-sheet__row"`. Instead of increment/decrement, feat rows have click-to-select.

---

### `apps/planner/src/features/feats/feat-detail-panel.tsx` (component, request-response)

**Analog:** `apps/planner/src/components/ui/detail-panel.tsx`

**Full component** (lines 1-18):
```typescript
import type { ReactNode } from 'react';

interface DetailPanelProps {
  body?: string | ReactNode;
  children?: ReactNode;
  className?: string;
  title?: string;
}

export function DetailPanel({ body, children, className, title }: DetailPanelProps) {
  return (
    <div className={`detail-panel${className ? ` ${className}` : ''}`}>
      {title && <h3 className="detail-panel__title">{title}</h3>}
      {body && <div className="detail-panel__body">{body}</div>}
      {children}
    </div>
  );
}
```

The feat detail panel extends this base with feat-specific content: description, prerequisite checklist, category badge. It can either compose `DetailPanel` or create a dedicated `FeatDetailPanel` that follows the same class-naming convention.

---

### `apps/planner/src/features/feats/feat-sheet-tab.tsx` (component, request-response)

**Analog:** `apps/planner/src/components/shell/character-sheet.tsx` (FeatsPanel at lines 105-111)

**Current placeholder** to replace:
```typescript
function FeatsPanel() {
  return (
    <div role="tabpanel" id="sheet-panel-feats" aria-labelledby="sheet-tab-feats">
      <p>Dotes del personaje</p>
    </div>
  );
}
```

The replacement should follow the same `role="tabpanel"` + `id`/`aria-labelledby` convention. Content should list all feats accumulated across levels, similar to how `SkillsPanel` would list accumulated skills.

---

### `apps/planner/src/features/feats/feat-search.tsx` (component, request-response)

**No direct analog in codebase.** This is a new pattern -- a search input that filters the feat list.

Use the OptionList interaction pattern from `apps/planner/src/components/ui/option-list.tsx` (lines 1-50):
```typescript
export interface OptionItem {
  blocked?: boolean;
  disabled?: boolean;
  id: string;
  label: string;
  selected?: boolean;
  secondary?: string;
}

interface OptionListProps {
  className?: string;
  items: OptionItem[];
  onSelect: (id: string) => void;
  renderItem?: (item: OptionItem) => ReactNode;
}
```

The search component should produce filtered `OptionItem[]` from the feat catalog and feed them into an `OptionList`. Blocked feats use `blocked: true` with a `renderItem` that shows failure reasons. The `secondary` field can hold the prerequisite summary text.

---

### `apps/planner/src/components/shell/center-content.tsx` (modify)

**Current routing pattern** (lines 22-33):
```typescript
if (expandedLevel !== null && activeLevelSubStep !== null) {
  switch (activeLevelSubStep) {
    case 'class':
      return <BuildProgressionBoard />;
    case 'skills':
      return <SkillBoard />;
    case 'feats':
      return <PlaceholderScreen title="Dotes" body="Las dotes se habilitaran en la siguiente fase." />;
    case 'spells':
      return <PlaceholderScreen title="Conjuros" body="Los conjuros se habilitaran en una fase posterior." />;
  }
}
```

Replace `case 'feats'` placeholder with `return <FeatBoard />;` following the `case 'skills'` pattern exactly.

---

### `apps/planner/src/components/shell/character-sheet.tsx` (modify)

**Current tab panel routing** (lines 142-149):
```typescript
{activeTab === 'stats' && <StatsPanel />}
{activeTab === 'skills' && <SkillsPanel />}
{activeTab === 'feats' && <FeatsPanel />}
{activeTab === 'spells' && <SpellsPanel />}
```

Replace the inline `FeatsPanel` placeholder with an imported `FeatSheetTab` component. Follow the pattern of how `SkillsPanel` is defined (or will be replaced).

---

### `tests/phase-06/*.spec.ts` (test files)

**Analog:** `tests/phase-05/skill-rules.spec.ts` and `tests/phase-05/skill-revalidation.spec.ts`

**Test file structure** (skill-rules.spec.ts lines 1-21):
```typescript
import { describe, expect, it } from 'vitest';
import { compiledSkillCatalog } from '@planner/features/skills/compiled-skill-catalog';
import {
  evaluateSkillSnapshot,
  type SkillLevelInput,
} from '@rules-engine/skills/skill-allocation';

function createLevel(
  level: number,
  overrides: Partial<SkillLevelInput> = {},
): SkillLevelInput {
  return {
    allocations: [],
    armorCategory: null,
    classId: 'class:fighter',
    intelligenceModifier: 0,
    level,
    skillPointsBase: 2,
    ...overrides,
  };
}

describe('phase 05 skill rules', () => {
  it('prices class and cross-class ranks differently against the compiled catalog', () => {
    // ... test body ...
  });
});
```

Key patterns:
1. `import { describe, expect, it } from 'vitest'`
2. Import from `@planner/` and `@rules-engine/` path aliases
3. `createLevel()` factory with defaults and partial overrides
4. `describe('phase NN ...')` top-level grouping
5. Use `expect(...).toMatchObject(...)` for partial assertions
6. Test against the actual compiled catalog data, not mocks
7. Environment: `node` (not jsdom) for rules-engine tests

**Revalidation test pattern** (skill-revalidation.spec.ts lines 29-65):
```typescript
describe('phase 05 skill revalidation', () => {
  it('keeps later levels visible and inherited when an earlier level becomes overspent', () => {
    const revalidated = revalidateSkillSnapshotAfterChange({
      catalog: compiledSkillCatalog,
      levels: [
        createLevel(1, { /* ... */ }),
        createLevel(2, { /* ... */ }),
        createLevel(3, { /* ... */ }),
      ],
    });

    expect(revalidated[1]).toMatchObject({
      inheritedFromLevel: null,
      level: 2,
      status: 'illegal',
    });
    expect(revalidated[2]).toMatchObject({
      inheritedFromLevel: 2,
      level: 3,
      status: 'blocked',
    });
  });
});
```

---

### `apps/planner/src/lib/copy/es.ts` (modify)

**Existing copy structure** (lines 125-171):
```typescript
stepper: {
  // ...
  levelSubSteps: {
    class: 'Clase',
    skills: 'Habilidades',
    feats: 'Dotes',  // already exists
    spells: 'Conjuros',
  },
  sheetTabs: {
    stats: 'Estadisticas',
    skills: 'Habilidades',
    feats: 'Dotes',  // already exists
    spells: 'Conjuros',
  },
  stepTitles: {
    // ...
    feats: 'Selecciona las dotes del nivel',  // already exists
  },
},
```

The `stepper.feats` key exists. A new `feats` top-level key needs to be added following the same shape as `skills`:
```typescript
skills: {
  sheetHeading: 'Habilidades del nivel',
  emptyStateHeading: '...',
  emptyStateBody: '...',
  availablePointsLabel: '...',
  // ...
},
```

---

## Shared Patterns

### Store-Selector-BoardView Architecture
**Source:** `apps/planner/src/features/skills/` (store.ts, selectors.ts, skill-board.tsx)
**Apply to:** All feat feature files

The three-layer pattern:
1. **Store** (zustand): Raw per-level selections. No derived data.
2. **Selectors** (pure functions): Take multiple store states as args, call rules-engine functions, return typed view models.
3. **Components** (React): Consume store hooks + call selectors inline. No rules logic.

### Revalidation Cascade
**Source:** `packages/rules-engine/src/skills/skill-revalidation.ts` lines 56-122
**Apply to:** `feat-revalidation.ts`, feat selectors

When a level has an invalid selection, all subsequent levels are marked `blocked` with `inheritedFromLevel` pointing to the break origin. Selectors expose this to the UI for rail/sheet/summary projection.

### Severity Projection
**Source:** `apps/planner/src/features/skills/selectors.ts` lines 392-448 (selectSkillRail, selectSkillSummaryStrip)
**Apply to:** Feat selectors for rail, sheet tab, and summary strip views

Each selector computes status from revalidated + evaluated levels. The `status` field on view models is consumed by CSS class `is-${status}` for visual treatment.

### Empty State Handling
**Source:** `apps/planner/src/features/skills/skill-board.tsx` lines 16-26
**Apply to:** FeatBoard

Check `boardView.emptyStateBody` before rendering the full board. If progression has no class selected, show empty state with `SelectionScreen` + `DetailPanel`.

### CSS Class Naming
**Source:** `apps/planner/src/features/skills/skill-sheet.tsx`
**Apply to:** All feat UI components

Pattern: `feature-name__element` with `is-status` modifiers.
- `skill-sheet__row is-illegal` becomes `feat-sheet__row is-illegal`
- `skill-sheet__issues` becomes `feat-sheet__issues`
- `skill-sheet__group` becomes `feat-sheet__group`

### Spanish Copy Convention
**Source:** `apps/planner/src/lib/copy/es.ts`
**Apply to:** All UI strings in feat components

All user-facing strings come from `shellCopyEs`. Never hardcode Spanish strings directly in JSX except in non-shipped fixture/debug contexts.

### Vitest Configuration
**Source:** `vitest.config.ts` lines 1-18
**Apply to:** All phase-06 test files

- Path aliases: `@data-extractor`, `@planner`, `@rules-engine`
- Default environment: `node` (not jsdom) for rules-engine tests
- Add `['tests/phase-06/**/*.spec.{ts,tsx}', 'jsdom']` to `environmentMatchGlobs` only if component tests need DOM

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `apps/planner/src/features/feats/feat-search.tsx` | component | request-response | No search/filter component exists in the codebase yet. Use `OptionList` props pattern for item rendering, and standard `useState` + `normalize('NFD')` for accent-insensitive text filtering. |

---

## Metadata

**Analog search scope:** `apps/planner/src/`, `packages/rules-engine/src/`, `packages/data-extractor/src/contracts/`, `tests/`
**Files scanned:** 35+
**Pattern extraction date:** 2026-04-16
