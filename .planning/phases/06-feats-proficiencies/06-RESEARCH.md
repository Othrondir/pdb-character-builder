# Phase 6: Feats & Proficiencies - Research

**Researched:** 2026-04-16
**Domain:** Feat selection UI, prerequisite evaluation engine, proficiency modeling, revalidation on upstream changes
**Confidence:** HIGH

## Summary

Phase 6 builds the feat selection and proficiency subsystem for the NWN1 character planner. The compiled feat catalog (1,487 feats, 39 class feat lists, full prerequisites) is already extracted and validated against Zod schemas from Phase 05.1. The planner shell already has navigation slots wired for `feats` as both a `LevelSubStep` and `SheetTab`, with placeholder components in `center-content.tsx` and `character-sheet.tsx` ready for replacement. The UI design contract (`06-UI-SPEC.md`) is approved and specifies all visual, interaction, and copywriting details.

The core engineering challenge is the prerequisite evaluation engine: a pure function that takes the build state at a given level (ability scores, class levels, BAB, skill ranks, selected feats at earlier levels) and returns a per-prerequisite pass/fail report for any feat. This engine must be framework-agnostic (living in `packages/rules-engine`) and composed into React selectors that follow the identical pattern established by the skill store/selectors in Phase 5. The revalidation pattern (preserve selections, mark invalid, project severity) is also directly inherited from Phase 5 skills.

**Primary recommendation:** Follow the Phase 5 skills architecture exactly -- zustand store for raw selections, pure rules-engine functions for prerequisite evaluation and revalidation, derived selectors that compose store state with progression/foundation/skill state to produce view models. The compiled feat catalog is the single source of truth for feat data, class feat lists, and prerequisites.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Show only eligible feats by default. Feats that fail prerequisites are filtered out of the selection list entirely.
- **D-02:** Group eligible feats into two sections: "Dotes de clase" (bonus feat from class level) and "Dotes generales". Replicates NWN1's slot distinction. Maps to `classFeatLists` with `list` field (0=general availability, 1+=class bonus).
- **D-03:** When a level grants both a class bonus feat and a general feat, present selection sequentially: class feat first, then general feat. Two clear steps per the NWN1 flow.
- **D-04:** Each feat in the eligible list shows name + fulfilled prerequisites inline (e.g., "Gran Poder [Fue 13, Poder]").
- **D-05:** Auto-granted class feats (e.g., Barbarian "Furia" at level 1) appear in the level gains summary (as `features[]` in level-gains.ts already does), NOT as a selectable slot.
- **D-06:** A search field lets the player look up any feat by name. If the searched feat is not eligible, it appears in the results but blocked/greyed with the exact reason inline below the name.
- **D-07:** Blocked feats in search results show failure reasons inline under the feat name in red/amber text. No extra click needed.
- **D-08:** Proficiencies live as feats in the feat catalog. No separate proficiency data file.
- **D-09:** Proficiencies appear in the feat selection list and character sheet as normal feats, grouped by category. No separate "Proficiencies" section.
- **D-10:** When upstream changes invalidate a previously selected feat, the feat stays selected but is marked invalid/red with the reason. Same pattern as Phase 4/5 revalidation.
- **D-11:** Invalid feat severity projects to: level rail button, character sheet Feats tab, and summary strip. Same projection pattern as skills/progression.

### Claude's Discretion
- Exact mapping of raw 2DA category numbers (0, 2, 3, 7, 8, 10, 12, 15, 17, 22) to human-readable category labels
- Search field implementation details (debounce, minimum characters, exact placement)
- How feat prerequisites are evaluated internally (pure function signature, caching strategy)
- Exact visual treatment of the "class feat" vs "general feat" section headers
- Whether the prerequisite checklist on eligible feats uses icons, text, or both

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FEAT-01 | El usuario puede elegir dotes generales, dotes custom y dotes de clase disponibles en el servidor. | Compiled feat catalog has 1,487 feats with class feat lists for all 39 classes. `classFeatLists` with `list` field distinguishes general (0), class bonus (1-2), and auto-granted (3). Store + selectors pattern from skills phase provides the template. |
| FEAT-02 | El usuario puede ver prerrequisitos incumplidos y razones exactas por las que una dote no es legal. | Feat prerequisites schema covers all 2DA prerequisite types (minStr/Dex/Con/Int/Wis/Cha, minBab, minLevel, requiredFeat1/2, orReqFeats, requiredSkill/2, minSpellLevel, minLevelClass, minFortSave, preReqEpic, maxLevel). Pure evaluator function produces per-prerequisite pass/fail with specific failure reasons. |
| FEAT-03 | El planner modela las competencias con armas, armaduras y escudos segun la version custom del servidor. | Proficiency feats are already in the catalog: 43 armor (category "8"), 41 shield (category "10"), 6 weapon (category "7"). They follow the same feat data shape and are auto-granted or selectable through class feat lists. |
| FEAT-04 | El planner modela divisiones o cambios custom de competencias y dotes que difieren del NWN base. | Puerta's custom splits are captured in the extracted 2DA data. The catalog includes Puerta-specific feats (e.g., "herramientapb1-varitaemociones", custom class feats). Class feat lists come from the server's cls_feat_* tables, not base game. |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Feat prerequisite evaluation | Rules Engine (pure TS) | -- | Must be framework-agnostic, deterministic, testable without React. Same tier as skill allocation evaluation. |
| Feat eligibility filtering | Rules Engine (pure TS) | -- | Which feats are eligible given build state is a rules question, not a UI question. |
| Feat selection state | Frontend (zustand store) | -- | Per-level feat selections are UI state, same pattern as skill store. |
| Feat revalidation | Rules Engine (pure TS) | -- | Detecting invalid feats after upstream changes is a rules computation. |
| Feat board UI | Frontend (React) | -- | Composition of existing SelectionScreen/OptionList/DetailPanel primitives with feat-specific content. |
| Feat sheet tab UI | Frontend (React) | -- | Character sheet panel showing all feats across levels. |
| Severity projection | Frontend (selectors) | -- | Derived selectors compose rules engine output into view models for rail/sheet/summary. |
| BAB computation for prereqs | Rules Engine (pure TS) | -- | BAB is derived from class levels + attackBonusProgression in compiled class catalog. |
| Search filtering | Frontend (React) | -- | Client-side text search over feat labels. Simple enough for the UI tier. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zustand | 5.0.10 | Feat selection store | Same state management as skills store; project standard. [VERIFIED: already installed] |
| React | 19.2.3 | UI components | Project standard. [VERIFIED: already installed] |
| TypeScript | 5.9.2 | Type-safe prerequisite evaluation | Project standard. [VERIFIED: already installed] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vitest | 4.0.16 | Prerequisite engine + revalidation tests | Testing the rules engine functions. [VERIFIED: already installed] |
| @testing-library/jest-dom | (installed) | DOM assertions for component tests | Already in test setup.ts. [VERIFIED: test setup imports it] |

### Alternatives Considered
No new libraries needed. This phase composes existing project infrastructure.

## Architecture Patterns

### System Architecture Diagram

```
User clicks "Dotes" sub-step
       |
       v
[center-content.tsx] -- routes to --> [FeatBoard]
       |                                   |
       |                         +---------+---------+
       |                         |                   |
       v                         v                   v
[FeatSheet]              [FeatDetailPanel]    [FeatSearch]
  (OptionList             (DetailPanel          (text input)
   with feat rows)        with prereqs)            |
       |                         |                  |
       +------------+------------+------------------+
                    |
                    v
        [selectFeatBoardView] (selector)
                    |
    +---------------+---------------+
    |               |               |
    v               v               v
[useFeatStore]  [useProgressionStore]  [useFoundationStore]
(per-level       (class choices,       (ability scores)
 feat picks)      ability increases)
    |               |               |
    +-------+-------+-------+------+
            |               |
            v               v
  [evaluateFeatPrereqs]  [getEligibleFeats]
  (rules-engine)         (rules-engine)
            |
            v
  [compiledFeatCatalog]  +  [compiledClassCatalog]
  (1,487 feats)             (39 classes with BAB progression)
```

### Data Flow: Selecting a Feat

1. User navigates to level N, "Dotes" sub-step
2. `FeatBoard` reads feat store + progression store + foundation store + skill store
3. Selector calls rules-engine `getEligibleFeats(level, slotType, buildState)`:
   - Computes cumulative feat selections from levels 1..N-1
   - Computes ability scores at level N (base + racial + increases)
   - Computes BAB at level N (sum of per-class BAB from attackBonusProgression)
   - Computes skill ranks at level N (from skill store)
   - Filters feat catalog to those meeting all prerequisites
   - Splits into class feats (from classFeatLists where list >= 1) and general feats
4. User selects a feat -> store action `setClassFeat(level, featId)` or `setGeneralFeat(level, featId)`
5. Selectors recompute, updating rail/sheet/summary views

### Recommended Project Structure
```
apps/planner/src/features/feats/
  compiled-feat-catalog.ts     # Re-exports compiledFeatCatalog with type
  store.ts                     # Zustand store: per-level feat selections
  selectors.ts                 # Derived view models (board, sheet, summary)
  feat-board.tsx               # Center content component
  feat-sheet.tsx               # Left panel: OptionList + search
  feat-detail-panel.tsx        # Right panel: description + prereqs
  feat-sheet-tab.tsx           # Character sheet "Dotes" tab
  feat-search.tsx              # Search input component

packages/rules-engine/src/feats/
  feat-prerequisite.ts         # Pure prereq evaluator
  feat-eligibility.ts          # Eligible feat filtering
  feat-revalidation.ts         # Revalidation after upstream changes
  bab-calculator.ts            # BAB from class progression
```

### Pattern 1: Per-Level Feat Store (mirrors skill store)
**What:** Zustand store holding feat selections per level, following the exact same shape as the skill store.
**When to use:** For all feat selection state management.
**Example:**
```typescript
// Source: apps/planner/src/features/skills/store.ts (project pattern)
interface FeatLevelRecord {
  classFeatId: CanonicalId | null;
  generalFeatId: CanonicalId | null;
  level: ProgressionLevel;
}

interface FeatStoreState {
  activeLevel: ProgressionLevel;
  levels: FeatLevelRecord[];
  setClassFeat: (level: ProgressionLevel, featId: CanonicalId | null) => void;
  setGeneralFeat: (level: ProgressionLevel, featId: CanonicalId | null) => void;
  setActiveLevel: (level: ProgressionLevel) => void;
  resetFeatSelections: () => void;
}
```

### Pattern 2: Pure Prerequisite Evaluator (rules-engine)
**What:** A framework-agnostic pure function that takes a feat's prerequisites and the current build state, returning a per-prerequisite pass/fail report.
**When to use:** Called by selectors to determine feat eligibility and display prerequisite status.
**Example:**
```typescript
// Source: project architecture (packages/rules-engine pattern)
interface BuildStateAtLevel {
  abilityScores: Record<string, number>;  // str, dex, con, int, wis, cha
  bab: number;
  characterLevel: number;
  classLevels: Record<CanonicalId, number>;  // class -> levels in that class
  fortitudeSave: number;
  selectedFeatIds: Set<string>;  // all feats selected at levels <= current
  skillRanks: Record<string, number>;  // skill -> total ranks
  spellcastingLevel: number;  // max spell level castable
}

interface PrerequisiteCheckResult {
  met: boolean;
  checks: PrerequisiteCheck[];
}

interface PrerequisiteCheck {
  type: 'ability' | 'bab' | 'feat' | 'skill' | 'level' | 'class-level' | 'spell-level' | 'fort-save' | 'or-feats';
  label: string;       // Spanish display label
  met: boolean;
  required: string;    // e.g., "13" or "feat:poder"
  current: string;     // e.g., "10" or "(no tomada)"
}

function evaluateFeatPrerequisites(
  feat: CompiledFeat,
  buildState: BuildStateAtLevel,
  featCatalog: FeatCatalog,
): PrerequisiteCheckResult;
```

### Pattern 3: Revalidation via Selector Recomputation
**What:** Feat validity is recomputed from raw state on every selector call, not cached. When upstream changes invalidate a feat, the selector returns it with `status: 'illegal'`.
**When to use:** Always -- this is the project's established pattern from skill revalidation.
**Example:**
```typescript
// Source: apps/planner/src/features/skills/selectors.ts (project pattern)
// Selectors recompute from raw state -- no cached validity
function selectFeatBoardView(
  featState: FeatStoreState,
  progressionState: LevelProgressionStoreState,
  foundationState: CharacterFoundationStoreState,
  skillState: SkillStoreState,
): FeatBoardView {
  // Build state at active level
  // Evaluate prerequisites for all selected feats
  // Return view with status per feat
}
```

### Pattern 4: BAB Computation from Class Progression
**What:** BAB at level N is the sum of per-class BAB contributions derived from `attackBonusProgression` (low/medium/high) in the compiled class catalog.
**When to use:** For feat prerequisites that require minimum BAB.
**Example:**
```typescript
// Source: D&D 3.5 BAB tables [VERIFIED: standard NWN1 rules]
const BAB_PER_LEVEL: Record<string, (classLevel: number) => number> = {
  high: (level) => level,                          // Fighter, Paladin, Ranger, Barbarian
  medium: (level) => Math.floor(level * 3 / 4),    // Cleric, Druid, Rogue, Monk, Bard
  low: (level) => Math.floor(level / 2),            // Wizard, Sorcerer
};

function computeBab(
  classLevels: Map<CanonicalId, number>,
  classCatalog: ClassCatalog,
): number {
  let totalBab = 0;
  for (const [classId, levels] of classLevels) {
    const classDef = classCatalog.classes.find(c => c.id === classId);
    if (classDef) {
      totalBab += BAB_PER_LEVEL[classDef.attackBonusProgression](levels);
    }
  }
  return totalBab;
}
```

### Pattern 5: Class Feat List Interpretation
**What:** The `classFeatLists` data uses a `list` field with values 0-3 that control how feats appear for each class. [VERIFIED: codebase feat-assembler.ts and compiled-feats.ts]
**When to use:** For determining which feats are eligible in which slot and which are auto-granted.
**Interpretation:**
```
list = 0: General availability — feat appears as a general feat option
list = 1: Class bonus feat — selectable from the class bonus feat list
list = 2: Class bonus feat (alternative tier) — also selectable from bonus list
list = 3: Auto-granted at grantedOnLevel — not selectable, appears in level gains

grantedOnLevel = null: Not auto-granted; must be chosen from a list
grantedOnLevel = N: Auto-granted when the class reaches level N (list=3)
                     or available as bonus from level N onward (list=1/2)
onMenu = true: Appears in the selection menu
onMenu = false: Does not appear in the menu (auto-granted silently)
```

### Anti-Patterns to Avoid
- **Caching prerequisite evaluation results in state:** Computed validity is a derived value. Always recompute from raw state in selectors, same as skills. Caching creates stale data bugs when upstream changes.
- **Putting rules logic in React components:** Prerequisite evaluation, eligibility filtering, and BAB computation must live in `packages/rules-engine`. Components only consume selector output.
- **Treating proficiencies as a separate data type:** Per D-08/D-09, proficiencies ARE feats. They use the same data shape, same selection flow, same prerequisite evaluation. Do not create parallel data structures.
- **Hardcoding class feat lists or BAB tables:** All data comes from the compiled catalogs. The class-fixture.ts (Phase 4 hardcoded class data) only covers 7 classes. The compiled class catalog has all 39 classes with BAB progression data.
- **Using the Phase 4 class fixture for rules calculations:** `class-fixture.ts` is a UI fixture for the progression board with limited class data. Feat prerequisite evaluation needs the full compiled class catalog (39 classes, BAB progressions, saving throw progressions).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Feat data model | Custom feat type definitions | `CompiledFeat`, `ClassFeatEntry` from `feat-catalog.ts` | Already extracted and Zod-validated with all prerequisite fields |
| Feat catalog | Manual feat list | `compiledFeatCatalog` from `compiled-feats.ts` | 1,487 feats with full server data, auto-generated |
| Class feat lists | Hardcoded per-class feat arrays | `classFeatLists` from compiled catalog | All 39 classes covered with list/grantedOnLevel/onMenu metadata |
| Text search | Custom search algorithm | `String.prototype.normalize('NFD').replace(/[\u0300-\u036f]/g, '')` + `includes()` | Standard accent-insensitive search for Spanish text |
| Debounced input | Custom timer management | `setTimeout`/`clearTimeout` in useEffect or a thin `useDebounce` hook | Simple enough to inline; no library needed |
| Prerequisite display text | Template string construction | Copy templates from `shellCopyEs.feats` namespace | All Spanish strings centralized per project convention |

## Common Pitfalls

### Pitfall 1: Stale Build State in Prerequisite Evaluation
**What goes wrong:** Evaluating prerequisites against ability scores that don't include racial bonuses or ability increases from earlier levels.
**Why it happens:** Base attributes in the foundation store are pre-racial, pre-increase values. Ability increases are stored per-level in the progression store.
**How to avoid:** The `BuildStateAtLevel` computation must sum: base attributes + racial modifiers (if applicable) + ability increases from levels 1..N. Follow the same pattern as `getIntelligenceModifier` in skill selectors.
**Warning signs:** Feat prerequisites for Str 13 pass at level 1 but fail at level 4 when they should still pass.

### Pitfall 2: Circular Feat Prerequisites
**What goes wrong:** Feat A requires Feat B, and Feat B's eligibility depends on other state that changed because Feat A was selected.
**Why it happens:** Feat selections at earlier levels affect feat eligibility at later levels. Revalidation must handle this chain correctly.
**How to avoid:** Process levels sequentially (1 through 16). At each level, the "selected feats" set includes all confirmed selections from prior levels. Never include the current level's pending selection in its own prerequisite check.
**Warning signs:** Feat shows as eligible, gets selected, then immediately shows as invalid.

### Pitfall 3: Missing BAB Calculation for Class Combinations
**What goes wrong:** BAB computed incorrectly for multiclass characters because each class's BAB contribution is floored independently before summing.
**Why it happens:** NWN1 BAB is NOT `floor(totalLevel * rate)`. It's `sum(floor(classLevel_i * rate_i))` for each class independently.
**How to avoid:** Compute BAB per-class, floor each, then sum. This matches NWN1 engine behavior. [ASSUMED: standard NWN1 BAB calculation]
**Warning signs:** A Fighter 4 / Wizard 4 should have BAB 4+2=6, not floor(8*0.75)=6 (coincidence) -- test with Ranger 3 / Wizard 3 where correct is 3+1=4, not floor(6*0.625)=3.

### Pitfall 4: Class Feat List Misinterpretation
**What goes wrong:** Auto-granted feats (list=3 with grantedOnLevel) appear as selectable options, or class bonus feats (list=1) don't appear when they should.
**Why it happens:** The `list` field semantics are subtle. List=3 + grantedOnLevel means auto-granted. List=1/2 + grantedOnLevel means "available as bonus starting at this level". List=0 means general availability.
**How to avoid:** Implement a clear classification function:
- `list === 3 && grantedOnLevel !== null` -> auto-granted (show in features[], not selectable)
- `list === 1 || list === 2` -> class bonus feat (show in "Dotes de clase" section)
- `list === 0` -> general availability (show in "Dotes generales" section)
- Check `onMenu` flag: if false, feat is auto-granted silently even for list=1/2
**Warning signs:** Players see auto-granted feats as selectable, or class bonus feats missing from the class feat list.

### Pitfall 5: Accent-Insensitive Search Not Working for Spanish
**What goes wrong:** Searching for "Rapida" doesn't find "Rapida" (or vice versa with accent variants).
**Why it happens:** Spanish text in the TLK has accented characters. Direct `includes()` comparison is accent-sensitive.
**How to avoid:** Normalize both the search query and feat labels using `str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()` before comparison.
**Warning signs:** Feats with accents in their names are unfindable by search.

### Pitfall 6: Not Accounting for Feats That Have Already Been Selected
**What goes wrong:** The same feat appears as selectable at multiple levels, or a feat selected at level 3 satisfies a prerequisite for level 5 but the evaluator doesn't see it.
**Why it happens:** Eligible feat computation doesn't exclude already-selected feats from the list, or doesn't include them in the "selected feats" set for prerequisite checking.
**How to avoid:** The `selectedFeatIds` set in `BuildStateAtLevel` must include ALL feats from levels 1..N-1 (both class and general slots, plus auto-granted). The eligible feat list for level N must exclude any feat already in `selectedFeatIds` (feats in NWN1 are generally one-time selections).
**Warning signs:** Duplicate feat selections across levels, or prerequisite chains that break despite earlier selections.

## Code Examples

### Build State Computation for Prerequisite Evaluation
```typescript
// Source: project codebase pattern (selectors.ts in skills feature)
function computeBuildStateAtLevel(
  level: ProgressionLevel,
  foundationState: CharacterFoundationStoreState,
  progressionState: LevelProgressionStoreState,
  skillState: SkillStoreState,
  featState: FeatStoreState,
  classCatalog: ClassCatalog,
): BuildStateAtLevel {
  // 1. Ability scores: base + increases from progression
  const abilityScores = { ...foundationState.baseAttributes };
  for (const rec of progressionState.levels) {
    if (rec.level <= level && rec.abilityIncrease) {
      abilityScores[rec.abilityIncrease] += 1;
    }
  }

  // 2. Class levels: count levels per class up to current level
  const classLevels: Record<string, number> = {};
  for (const rec of progressionState.levels) {
    if (rec.level <= level && rec.classId) {
      classLevels[rec.classId] = (classLevels[rec.classId] ?? 0) + 1;
    }
  }

  // 3. BAB: sum per-class contributions
  const bab = computeTotalBab(classLevels, classCatalog);

  // 4. Skill ranks: sum all allocations up to current level
  const skillRanks: Record<string, number> = {};
  for (const skillLevel of skillState.levels) {
    if (skillLevel.level <= level) {
      for (const alloc of skillLevel.allocations) {
        skillRanks[alloc.skillId] = (skillRanks[alloc.skillId] ?? 0) + alloc.rank;
      }
    }
  }

  // 5. Selected feats: all feats from levels 1..level-1
  const selectedFeatIds = new Set<string>();
  for (const featLevel of featState.levels) {
    if (featLevel.level < level) {
      if (featLevel.classFeatId) selectedFeatIds.add(featLevel.classFeatId);
      if (featLevel.generalFeatId) selectedFeatIds.add(featLevel.generalFeatId);
    }
    // Also add auto-granted feats from classFeatLists
  }

  return {
    abilityScores,
    bab,
    characterLevel: level,
    classLevels,
    fortitudeSave: computeFortSave(classLevels, classCatalog),
    selectedFeatIds,
    skillRanks,
    spellcastingLevel: 0, // Placeholder until Phase 7
  };
}
```

### Prerequisite Evaluation Function
```typescript
// Source: project architecture (rules-engine pattern from skill-allocation.ts)
function evaluateFeatPrerequisites(
  feat: CompiledFeat,
  buildState: BuildStateAtLevel,
  featCatalog: FeatCatalog,
): PrerequisiteCheckResult {
  const checks: PrerequisiteCheck[] = [];
  const prereqs = feat.prerequisites;

  // Ability score checks
  if (prereqs.minStr) {
    checks.push({
      type: 'ability',
      label: 'Fuerza',
      met: buildState.abilityScores.str >= prereqs.minStr,
      required: String(prereqs.minStr),
      current: String(buildState.abilityScores.str),
    });
  }
  // ... similar for dex, con, int, wis, cha

  // BAB check
  if (prereqs.minBab) {
    checks.push({
      type: 'bab',
      label: 'BAB',
      met: buildState.bab >= prereqs.minBab,
      required: `+${prereqs.minBab}`,
      current: `+${buildState.bab}`,
    });
  }

  // Required feat checks (AND)
  if (prereqs.requiredFeat1) {
    const reqFeat = featCatalog.feats.find(f => f.id === prereqs.requiredFeat1);
    checks.push({
      type: 'feat',
      label: reqFeat?.label ?? prereqs.requiredFeat1,
      met: buildState.selectedFeatIds.has(prereqs.requiredFeat1),
      required: reqFeat?.label ?? prereqs.requiredFeat1,
      current: buildState.selectedFeatIds.has(prereqs.requiredFeat1) ? '(tomada)' : '(no tomada)',
    });
  }

  // OR-required feats
  if (prereqs.orReqFeats && prereqs.orReqFeats.length > 0) {
    const anyMet = prereqs.orReqFeats.some(id => buildState.selectedFeatIds.has(id));
    checks.push({
      type: 'or-feats',
      label: prereqs.orReqFeats.map(id => {
        const f = featCatalog.feats.find(ff => ff.id === id);
        return f?.label ?? id;
      }).join(' o '),
      met: anyMet,
      required: 'una de las siguientes',
      current: anyMet ? '(cumplido)' : '(ninguna tomada)',
    });
  }

  return {
    met: checks.every(c => c.met),
    checks,
  };
}
```

### Feat Slot Determination per Level
```typescript
// Source: codebase analysis of level-gains.ts + classFeatLists structure
interface FeatSlotsAtLevel {
  classBonusFeatSlot: boolean;  // Level grants a class bonus feat pick
  generalFeatSlot: boolean;     // Level grants a general feat pick
  autoGrantedFeats: string[];   // Feat IDs auto-granted at this level
}

function determineFeatSlots(
  level: ProgressionLevel,
  classId: CanonicalId | null,
  classLevelInClass: number,
  classFeatLists: FeatCatalog['classFeatLists'],
): FeatSlotsAtLevel {
  const autoGrantedFeats: string[] = [];
  let classBonusFeatSlot = false;

  if (classId && classFeatLists[classId]) {
    for (const entry of classFeatLists[classId]) {
      // Auto-granted: list=3, grantedOnLevel matches, not on menu
      if (entry.list === 3 && entry.grantedOnLevel === classLevelInClass) {
        autoGrantedFeats.push(entry.featId);
      }
    }
    // Class bonus feat slot: determined by class gain table
    // Fighters get bonus feats at levels 1, 2, 4, 6, 8...
    // This comes from the class gain table's choicePrompts or a separate
    // bonus feat schedule per class
  }

  // General feat slot: every 3 character levels (1, 3, 6, 9, 12, 15)
  // NWN1: levels 1, 3, 6, 9, 12, 15 for general feats
  const generalFeatSlot = [1, 3, 6, 9, 12, 15].includes(level);

  return { classBonusFeatSlot, generalFeatSlot, autoGrantedFeats };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded skill catalog (Phase 5 initial) | Compiled catalogs from extractor (Phase 05.1) | 2026-04-15 | All feat data now comes from compiled catalog, not hardcoded fixtures |
| Phase 4 class fixture (7 classes) | Compiled class catalog (39 classes) | 2026-04-15 | Feat prerequisite evaluation must use compiled class catalog for full coverage |
| Per-feature state caching | Selector-based recomputation | Phase 5 pattern | Feat validity is always derived, never stored |

**Deprecated/outdated:**
- `phase04ClassFixture` in `class-fixture.ts`: Only covers 7 classes. Use `compiledClassCatalog` from `compiled-classes.ts` for feat prerequisite evaluation (BAB progression, saving throws).

## Key Data Analysis

### Feat Catalog Statistics [VERIFIED: compiled-feats.ts analysis]

| Metric | Value |
|--------|-------|
| Total feats | 1,487 |
| Category "general" | 1,286 |
| Category "22" (Clase) | 93 |
| Category "8" (Armadura) | 43 |
| Category "10" (Escudo) | 41 |
| Category "7" (Arma) | 6 |
| Category "3" (Arcana) | 7 |
| Category "2" (Combate) | 4 |
| Category "0" | 3 |
| Category "12" (Habilidad) | 2 |
| Category "15" (Divina) | 1 |
| Category "17" (Epica) | 1 |
| Classes with feat lists | 39 |
| Class feat entries (list=0) | 578 |
| Class feat entries (list=1, bonus) | 4,963 |
| Class feat entries (list=2, bonus alt) | 188 |
| Class feat entries (list=3, auto-grant) | 1,338 |
| Feats with grantedOnLevel | 1,767 |
| Feats with requiredFeat1 | 705 |
| Feats with minBab | 220 |
| Feats with minLevel | 322 |
| Feats with minLevelClass | 295 |
| Feats with requiredSkill | 67 |
| Feats with orReqFeats | 56 |

### Feat Category Mapping (Claude's Discretion) [VERIFIED: UI-SPEC.md]

| 2DA Category | Spanish Label | Count |
|-------------|---------------|-------|
| general | General | 1,286 |
| 0 | General | 3 |
| 2 | Combate | 4 |
| 3 | Arcana | 7 |
| 7 | Arma | 6 |
| 8 | Armadura | 43 |
| 10 | Escudo | 41 |
| 12 | Habilidad | 2 |
| 15 | Divina | 1 |
| 17 | Epica | 1 |
| 22 | Clase | 93 |

**Note:** Categories "0" and "general" should merge under the same "General" label. The extractor emits "general" as a fallback when the CATEGORY column is empty or "****".

### NWN1 General Feat Schedule [ASSUMED: standard NWN1 rules]

Characters get a general feat pick at character levels: 1, 3, 6, 9, 12, 15.
Human characters get a bonus feat at level 1 (total 2 general feats at level 1).

### NWN1 Fighter Bonus Feat Schedule [ASSUMED: standard NWN1 rules]

Fighters get a bonus combat feat at Fighter class levels: 1, 2, 4, 6, 8, 10, 12, 14, 16.
This should be derivable from the class gain table or from a dedicated bonus feat schedule.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | NWN1 BAB is computed by summing per-class floored contributions, not a single rate applied to total level | Pitfall 3 / Pattern 4 | Incorrect BAB means wrong feat eligibility for ~220 feats with minBab prerequisites |
| A2 | General feat levels are 1, 3, 6, 9, 12, 15 in NWN1 | Key Data Analysis | Wrong feat slot availability at certain levels |
| A3 | Humans get a bonus general feat at level 1 | Key Data Analysis | Human characters might miss or get extra feat slots |
| A4 | Fighter bonus feat levels are 1, 2, 4, 6, 8, 10, 12, 14, 16 | Key Data Analysis | Fighter class bonus feat availability wrong |
| A5 | list=3 + grantedOnLevel means auto-granted, list=1/2 means class bonus selectable | Pattern 5 | Wrong feat slot assignment for class feats |
| A6 | preReqEpic feats can be ignored for level 1-16 range (epic starts at level 21) | Data Analysis | If Puerta server has custom epic-like feats below level 21, they'd be incorrectly excluded |
| A7 | Saving throw computation for fortitude follows D&D 3.5 rules: high = 2 + floor(level/2), low = floor(level/3) | BAB Calculator | Only 5 feats use minFortSave prereq, but they'd be wrong |
| A8 | Medium BAB progression is floor(level * 3/4) per NWN1 engine | Pattern 4 | BAB mismatch for medium-BAB classes affecting ~220 feat prereqs |

## Open Questions

1. **Fighter bonus feat schedule derivation**
   - What we know: Fighters get bonus combat feats at specific class levels. The `classFeatLists` for `class:fighter` has entries with `list=1` and various `grantedOnLevel` values.
   - What's unclear: Is the bonus feat slot schedule hardcoded per class (Fighter, Ranger, etc.) or derivable from `classFeatLists`/`level-gains.ts` `choicePrompts`?
   - Recommendation: Check if the class gain table `choicePrompts` already signal "bonus feat available" for Fighter/Ranger/Monk/etc. If not, derive from `classFeatLists` entries where list=1 and check which grantedOnLevel values have selectable entries.

2. **Human bonus feat at level 1**
   - What we know: Humans traditionally get an extra feat at level 1 in NWN1.
   - What's unclear: Is this modeled in the compiled data (e.g., a race-specific feat grant) or does it need to be a rules-engine hardcoded rule?
   - Recommendation: Check the race catalog or compiled feat data for human-specific entries.

3. **spellcastingLevel prerequisite computation**
   - What we know: 33 feats have `minSpellLevel` prerequisites. Spell mechanics are Phase 7.
   - What's unclear: How to compute the character's max spell level at a given progression level without the full spell system.
   - Recommendation: Either defer `minSpellLevel` evaluation to Phase 7 (mark as "pendiente") or compute a simplified version based on class + class level using NWN1 spell progression tables.

4. **Compiled class catalog vs. Phase 4 class fixture**
   - What we know: The Phase 4 class fixture has 7 classes with gain tables. The compiled class catalog has 39 classes with BAB/save progressions but no gain tables.
   - What's unclear: How to access gain table data (for bonus feat schedules) for all 39 classes.
   - Recommendation: For Phase 6, the bonus feat schedule can be derived from `classFeatLists` data rather than class gain tables. The gain table is used for `features[]` (auto-granted feat display in the level summary), which already works via level-gains.ts.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.16 |
| Config file | `vitest.config.ts` (project root) |
| Quick run command | `pnpm vitest run tests/phase-06 --reporter=verbose` |
| Full suite command | `pnpm vitest run --reporter=verbose` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FEAT-01 | Eligible feats filtered correctly for general/class/custom feats | unit | `pnpm vitest run tests/phase-06/feat-eligibility.spec.ts -x` | Wave 0 |
| FEAT-01 | Feat store holds per-level selections | unit | `pnpm vitest run tests/phase-06/feat-store.spec.ts -x` | Wave 0 |
| FEAT-02 | Prerequisites evaluated with exact failure reasons | unit | `pnpm vitest run tests/phase-06/feat-prerequisite.spec.ts -x` | Wave 0 |
| FEAT-02 | Prerequisite status displayed in UI (blocked feats in search) | manual-only | Visual inspection: search for blocked feat, verify inline reasons | n/a |
| FEAT-03 | Proficiency feats appear in catalog with correct categories | unit | `pnpm vitest run tests/phase-06/feat-proficiency.spec.ts -x` | Wave 0 |
| FEAT-04 | Puerta custom feats/proficiency splits modeled correctly | unit | `pnpm vitest run tests/phase-06/feat-puerta-custom.spec.ts -x` | Wave 0 |
| FEAT-ALL | Revalidation marks feats invalid when upstream changes | unit | `pnpm vitest run tests/phase-06/feat-revalidation.spec.ts -x` | Wave 0 |
| FEAT-ALL | BAB computed correctly for multiclass characters | unit | `pnpm vitest run tests/phase-06/bab-calculator.spec.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm vitest run tests/phase-06 --reporter=verbose`
- **Per wave merge:** `pnpm vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/phase-06/feat-prerequisite.spec.ts` -- covers FEAT-02 (prerequisite evaluation engine)
- [ ] `tests/phase-06/feat-eligibility.spec.ts` -- covers FEAT-01 (eligible feat filtering)
- [ ] `tests/phase-06/feat-revalidation.spec.ts` -- covers FEAT-ALL (revalidation after upstream changes)
- [ ] `tests/phase-06/bab-calculator.spec.ts` -- covers FEAT-02 (BAB computation for prereqs)
- [ ] `tests/phase-06/feat-store.spec.ts` -- covers FEAT-01 (store operations)
- [ ] `tests/phase-06/feat-proficiency.spec.ts` -- covers FEAT-03 (proficiency feats in catalog)
- [ ] `tests/phase-06/feat-puerta-custom.spec.ts` -- covers FEAT-04 (Puerta custom content)
- [ ] Add `['tests/phase-06/**/*.spec.{ts,tsx}', 'jsdom']` to `environmentMatchGlobs` if component tests are added

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | n/a -- static client-side app |
| V3 Session Management | no | n/a -- no sessions |
| V4 Access Control | no | n/a -- no server |
| V5 Input Validation | yes | Zod schema validation on compiled catalog import; search input sanitization (display-only, no injection risk) |
| V6 Cryptography | no | n/a -- no secrets |

### Known Threat Patterns for Static SPA

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malformed compiled data | Tampering | Zod validation on catalog import (`featCatalogSchema.parse()`) |
| XSS via feat descriptions | Tampering | React's default JSX escaping handles all string output |
| URL manipulation | Tampering | Zod validation on URL params (Phase 8 concern, not Phase 6) |

## Sources

### Primary (HIGH confidence)
- `packages/data-extractor/src/contracts/feat-catalog.ts` -- Feat schema, prerequisite types, class feat entry schema
- `packages/data-extractor/src/assemblers/feat-assembler.ts` -- How feats are extracted, list/grantedOnLevel semantics
- `apps/planner/src/data/compiled-feats.ts` -- 1,487 feats, 39 class feat lists, actual prerequisite distribution
- `apps/planner/src/features/skills/store.ts` -- Store pattern to follow
- `apps/planner/src/features/skills/selectors.ts` -- Selector pattern to follow
- `packages/rules-engine/src/skills/skill-allocation.ts` -- Rules engine function pattern
- `packages/rules-engine/src/skills/skill-revalidation.ts` -- Revalidation pattern
- `packages/data-extractor/src/contracts/class-catalog.ts` -- BAB progression types
- `.planning/phases/06-feats-proficiencies/06-UI-SPEC.md` -- Approved UI design contract
- `.planning/phases/06-feats-proficiencies/06-CONTEXT.md` -- User decisions

### Secondary (MEDIUM confidence)
- NWN1 BAB computation rules (training knowledge, consistent with D&D 3.5 SRD)
- General feat schedule (1, 3, 6, 9, 12, 15) from NWN1 rules knowledge
- Fighter bonus feat schedule from NWN1 rules knowledge

### Tertiary (LOW confidence)
- Human bonus feat at level 1 behavior -- needs verification against compiled data
- Exact interaction of `onMenu` flag with feat selection UI

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, all existing project infrastructure
- Architecture: HIGH -- direct extension of established Phase 5 skills pattern with identical data flow
- Pitfalls: HIGH -- prerequisite evaluation is well-understood domain; pitfalls derived from codebase analysis
- Data model: HIGH -- compiled catalog fully analyzed, prerequisite types enumerated
- BAB computation: MEDIUM -- standard NWN1/D&D 3.5 rules but not verified against game engine

**Research date:** 2026-04-16
**Valid until:** 2026-05-16 (stable -- no external dependencies changing)
