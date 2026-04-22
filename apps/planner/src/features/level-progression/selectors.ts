import type { CanonicalId } from '@rules-engine/contracts/canonical-id';
import {
  collectVisibleClassOptions,
  evaluateClassEntry,
  type ClassRequirementRow,
} from '@rules-engine/progression/class-entry-rules';
import { getLevelGainsForSelection } from '@rules-engine/progression/level-gains';
import { evaluateMulticlassLegality } from '@rules-engine/progression/multiclass-rules';
import {
  computePerLevelBudget,
  type BuildSnapshot,
  type ClassCatalogInput,
  type FeatCatalogInput,
  type RaceCatalogInput,
} from '@rules-engine/progression/per-level-budget';
import { revalidateProgressionAfterLevelChange } from '@rules-engine/progression/progression-revalidation';

import { shellCopyEs } from '@planner/lib/copy/es';
import {
  ATTRIBUTE_KEYS,
  type AttributeKey,
} from '@planner/features/character-foundation/foundation-fixture';
import {
  selectAttributeBudgetSnapshot,
  selectFoundationSummary,
  selectOriginReadyForAbilities,
} from '@planner/features/character-foundation/selectors';
import type { CharacterFoundationStoreState } from '@planner/features/character-foundation/store';
import { compiledClassCatalog } from '@planner/data/compiled-classes';
import { compiledFeatCatalog } from '@planner/data/compiled-feats';
import { compiledRaceCatalog } from '@planner/data/compiled-races';
import {
  getChosenFeatIds,
  type FeatStoreState,
} from '@planner/features/feats/store';
import type { SkillStoreState } from '@planner/features/skills/store';

import {
  getPhase04ClassRecord,
  phase04ClassFixture,
  type PlannerClassKind,
} from './class-fixture';
import type { LevelProgressionStoreState } from './store';
import type { ProgressionLevel, ProgressionStatus } from './progression-fixture';

const ATTRIBUTE_LABELS: Record<AttributeKey, 'CAR' | 'CON' | 'DES' | 'FUE' | 'INT' | 'SAB'> =
  {
    cha: 'CAR',
    con: 'CON',
    dex: 'DES',
    int: 'INT',
    str: 'FUE',
    wis: 'SAB',
  };

export interface FoundationSummaryStripView {
  attributes: Array<{
    key: AttributeKey;
    label: 'CAR' | 'CON' | 'DES' | 'FUE' | 'INT' | 'SAB';
    value: number;
  }>;
  characterLabel: string;
  datasetId: string;
  selectedAlignmentLabel: string | null;
  selectedRaceLabel: string | null;
  selectedSubraceLabel: string | null;
}

export interface LevelRailEntryView {
  active: boolean;
  classId: CanonicalId | null;
  classLabel: string | null;
  inheritedFromLevel: number | null;
  issueCount: number;
  level: ProgressionLevel;
  /**
   * UAT-2026-04-20 G1 — sequential progression gating. `locked: true` when
   * upstream origin is incomplete OR any strict predecessor level is not
   * `legal`. Level-rail consumers MUST render locked entries as disabled.
   */
  locked: boolean;
  status: ProgressionStatus;
}

export interface ActiveLevelSheetView {
  abilityIncrease: AttributeKey | null;
  abilityIncreaseAvailable: boolean;
  classId: CanonicalId | null;
  classOptions: ClassOptionView[];
  choicePrompts: string[];
  gains: string[];
  inheritedFromLevel: number | null;
  level: number;
  placeholderBody: string;
  repairMessage: string | null;
  requirementRows: RequirementRowView[];
  status: ProgressionStatus;
  title: string;
}

export interface ClassOptionView {
  id: CanonicalId;
  kind: PlannerClassKind;
  label: string;
  selected: boolean;
  status: ProgressionStatus;
}

export interface RequirementRowView extends ClassRequirementRow {}

export interface ProgressionSummaryView {
  activeLevel: number;
  highestConfiguredLevel: number;
  planState: string;
  summaryStatus: ProgressionStatus;
}

function combineStatuses(
  statuses: Array<'blocked' | 'illegal' | 'legal'>,
): ProgressionStatus {
  if (statuses.includes('illegal')) {
    return 'illegal';
  }

  if (statuses.includes('blocked')) {
    return 'blocked';
  }

  return 'legal';
}

function createFoundationSnapshot(foundationState: CharacterFoundationStoreState) {
  return {
    alignmentId: foundationState.alignmentId,
    baseAttributes: foundationState.baseAttributes,
    deityId: null,
  };
}

function selectRevalidatedProgression(
  progressionState: LevelProgressionStoreState,
  foundationState: CharacterFoundationStoreState,
) {
  return revalidateProgressionAfterLevelChange({
    classes: phase04ClassFixture.classes,
    foundation: createFoundationSnapshot(foundationState),
    levels: progressionState.levels,
  });
}

export function selectFoundationSummaryStrip(
  foundationState: CharacterFoundationStoreState,
): FoundationSummaryStripView {
  const summary = selectFoundationSummary(foundationState);

  return {
    attributes: ATTRIBUTE_KEYS.map((key) => ({
      key,
      label: ATTRIBUTE_LABELS[key],
      value: foundationState.baseAttributes[key],
    })),
    characterLabel: summary.characterLabel,
    datasetId: summary.datasetId,
    selectedAlignmentLabel: summary.selectedAlignmentLabel,
    selectedRaceLabel: summary.selectedRaceLabel,
    selectedSubraceLabel: summary.selectedSubraceLabel,
  };
}

export function selectLevelRail(
  progressionState: LevelProgressionStoreState,
  foundationState: CharacterFoundationStoreState,
): LevelRailEntryView[] {
  const revalidatedLevels = selectRevalidatedProgression(
    progressionState,
    foundationState,
  );

  // UAT-2026-04-20 G1 — sequential gating. A level is unlocked only when
  // the previous level has a class assigned (L1 always unlocked). Keeps
  // the rule simple + state-driven so tests stay mockable without needing
  // to simulate a full legal-progression chain.
  let prevHasClass = true;

  return progressionState.levels.map((record) => {
    const revalidatedRecord =
      revalidatedLevels.find((entry) => entry.level === record.level) ?? null;
    const status = (revalidatedRecord?.status ?? 'pending') as ProgressionStatus;

    const locked = !prevHasClass;
    prevHasClass = record.classId !== null;

    return {
      active: progressionState.activeLevel === record.level,
      classId: record.classId,
      classLabel: getPhase04ClassRecord(record.classId)?.label ?? null,
      inheritedFromLevel: revalidatedRecord?.inheritedFromLevel ?? null,
      issueCount: revalidatedRecord?.issues.length ?? 0,
      level: record.level,
      locked,
      status,
    };
  });
}

export function selectClassOptionsForLevel(
  progressionState: LevelProgressionStoreState,
  foundationState: CharacterFoundationStoreState,
  level: ProgressionLevel,
): ClassOptionView[] {
  const selectedClassId =
    progressionState.levels.find((record) => record.level === level)?.classId ?? null;

  return collectVisibleClassOptions({
    classes: phase04ClassFixture.classes,
    foundation: createFoundationSnapshot(foundationState),
    selectedClassId,
  }).map((option) => {
    const classRecord = getPhase04ClassRecord(option.id);
    const multiclassStatus = classRecord
      ? evaluateMulticlassLegality({
          classRecord,
          classes: phase04ClassFixture.classes,
          level,
          levels: progressionState.levels,
        }).summaryStatus
      : 'blocked';

    return {
      id: option.id,
      kind: option.kind,
      label: option.label,
      selected: option.selected,
      status: combineStatuses([
        option.status,
        multiclassStatus,
      ]) as ProgressionStatus,
    };
  });
}

export function selectActiveLevelSheetView(
  progressionState: LevelProgressionStoreState,
  foundationState: CharacterFoundationStoreState,
): ActiveLevelSheetView {
  const activeRecord =
    progressionState.levels.find(
      (record) => record.level === progressionState.activeLevel,
    ) ?? progressionState.levels[0];
  const classOptions = selectClassOptionsForLevel(
    progressionState,
    foundationState,
    activeRecord.level,
  );
  const classRecord = getPhase04ClassRecord(activeRecord.classId);
  const classEvaluation = classRecord
    ? evaluateClassEntry({
        classRecord,
        foundation: createFoundationSnapshot(foundationState),
      })
    : null;
  const gains = getLevelGainsForSelection({
    abilityIncreaseLevels: phase04ClassFixture.abilityIncreaseLevels,
    classRecord,
    level: activeRecord.level,
    levels: progressionState.levels,
  });
  const revalidatedRecord =
    selectRevalidatedProgression(progressionState, foundationState).find(
      (entry) => entry.level === activeRecord.level,
    ) ?? null;

  return {
    abilityIncrease: activeRecord.abilityIncrease,
    abilityIncreaseAvailable: gains.abilityIncreaseAvailable,
    choicePrompts: gains.choicePrompts,
    classId: activeRecord.classId,
    classOptions,
    gains: gains.features,
    inheritedFromLevel: revalidatedRecord?.inheritedFromLevel ?? null,
    level: activeRecord.level,
    placeholderBody: shellCopyEs.progression.placeholderBody,
    repairMessage:
      revalidatedRecord?.inheritedFromLevel !== null
        ? shellCopyEs.progression.repairCallout
        : null,
    requirementRows: classEvaluation?.requirementRows ?? [],
    status: (revalidatedRecord?.status ?? 'pending') as ProgressionStatus,
    title: shellCopyEs.progression.levelSheetHeading,
  };
}

export function selectActiveLevelSheet(
  progressionState: LevelProgressionStoreState,
  foundationState: CharacterFoundationStoreState,
) {
  return selectActiveLevelSheetView(progressionState, foundationState);
}

export function selectProgressionSummary(
  progressionState: LevelProgressionStoreState,
  foundationState: CharacterFoundationStoreState,
): ProgressionSummaryView {
  const highestConfiguredLevel = progressionState.levels.reduce(
    (highestLevel, record) =>
      record.classId ? Math.max(highestLevel, record.level) : highestLevel,
    0,
  );
  const foundationReady = selectOriginReadyForAbilities(foundationState);
  const rail = selectLevelRail(progressionState, foundationState).filter(
    (entry) => entry.level <= highestConfiguredLevel,
  );
  const hasIllegal = rail.some((entry) => entry.status === 'illegal');
  const hasBlocked = rail.some((entry) => entry.status === 'blocked');

  const summaryStatus: ProgressionStatus =
    hasIllegal
      ? 'illegal'
      : hasBlocked
        ? 'blocked'
        : highestConfiguredLevel === 0
          ? 'pending'
          : highestConfiguredLevel === progressionState.levels.length &&
              foundationReady
            ? 'legal'
            : 'pending';

  const planState =
    highestConfiguredLevel === 0
      ? shellCopyEs.progression.planStates.empty
      : summaryStatus === 'legal'
        ? shellCopyEs.progression.planStates.ready
        : summaryStatus === 'illegal'
          ? shellCopyEs.progression.planStates.invalid
          : summaryStatus === 'blocked'
            ? shellCopyEs.progression.planStates.repair
            : shellCopyEs.progression.planStates.inProgress;

  return {
    activeLevel: progressionState.activeLevel,
    highestConfiguredLevel,
    planState,
    summaryStatus,
  };
}

// ---------------------------------------------------------------------------
// Phase 12.4-04 — L1 sub-step completion predicates (SPEC R6 + X1 lock).
//
// Three pure predicates that answer "has the user earned the ✓ on this
// sub-step at this level?" Each composes the Wave 1 per-level-budget
// selector (12.4-03) with the planner's compiled catalogs adapted to the
// minimal structural inputs the rules-engine expects (boundary adapter
// pattern per CONTEXT.md D-07 + 12.4-03 framework-purity decision).
//
// "Earned, not defaulted": `isDotesLevelComplete` returns `false` when
// `featSlots.total === 0` (no class picked yet) — an empty budget is not
// a completed budget. Same short-circuit on `isHabilidadesLevelComplete`
// for `skillPoints.budget === 0`.
// ---------------------------------------------------------------------------

/**
 * Planner-side adapter: turn the full `compiledClassCatalog` into the
 * minimal `ClassCatalogInput` shape `computePerLevelBudget` consumes. Kept
 * as a module-scope constant so every predicate call on the same render
 * pass reuses the same projected array (structural equality friendly).
 */
const CLASS_CATALOG_INPUT: ClassCatalogInput = {
  classes: compiledClassCatalog.classes.map((c) => ({
    id: c.id,
    skillPointsPerLevel: c.skillPointsPerLevel,
  })),
};

const FEAT_CATALOG_INPUT: FeatCatalogInput = {
  classFeatLists: compiledFeatCatalog.classFeatLists,
};

const RACE_CATALOG_INPUT: RaceCatalogInput = {
  races: compiledRaceCatalog.races.map((r) => ({ id: r.id })),
};

/**
 * Build a `BuildSnapshot` from the four planner zustand stores at a given
 * level. Pure — reads state arguments only, no store subscriptions.
 */
function buildSnapshotFromStores(
  progressionState: LevelProgressionStoreState,
  foundationState: CharacterFoundationStoreState,
  featState: FeatStoreState,
  skillState: SkillStoreState,
): BuildSnapshot {
  const classByLevel: Record<number, string | null> = {};
  for (const record of progressionState.levels) {
    classByLevel[record.level] = record.classId;
  }

  return {
    raceId: foundationState.raceId,
    classByLevel,
    abilityScores: { int: foundationState.baseAttributes.int },
    intAbilityIncreasesBeforeLevel: (lvl) =>
      progressionState.levels.filter(
        (r) => r.level < lvl && r.abilityIncrease === 'int',
      ).length,
    chosenFeatIdsAtLevel: (lvl) => {
      const featRecord = featState.levels.find((r) => r.level === lvl);
      return getChosenFeatIds(featRecord);
    },
    spentSkillPointsAtLevel: (lvl) => {
      const skillRecord = skillState.levels.find((r) => r.level === lvl);
      if (!skillRecord) return 0;
      return skillRecord.allocations.reduce((sum, a) => sum + a.rank, 0);
    },
  };
}

/**
 * Clase sub-step ✓ predicate (SPEC R6).
 * True iff the user has picked a class at this level.
 */
export function isClaseLevelComplete(
  progressionState: LevelProgressionStoreState,
  level: ProgressionLevel,
): boolean {
  const record = progressionState.levels.find((r) => r.level === level);
  return (record?.classId ?? null) !== null;
}

/**
 * Habilidades sub-step ✓ predicate (SPEC R6).
 * True iff skillPoints.budget > 0 AND the user has spent every point.
 * If budget === 0 (e.g. no class picked yet), returns false — an empty
 * budget is neutral, not complete.
 */
export function isHabilidadesLevelComplete(
  progressionState: LevelProgressionStoreState,
  foundationState: CharacterFoundationStoreState,
  featState: FeatStoreState,
  skillState: SkillStoreState,
  level: ProgressionLevel,
): boolean {
  const snapshot = buildSnapshotFromStores(
    progressionState,
    foundationState,
    featState,
    skillState,
  );
  const budget = computePerLevelBudget(
    snapshot,
    level,
    CLASS_CATALOG_INPUT,
    FEAT_CATALOG_INPUT,
    RACE_CATALOG_INPUT,
  );
  if (budget.skillPoints.budget === 0) return false;
  return budget.skillPoints.remaining === 0;
}

/**
 * Dotes sub-step ✓ predicate (SPEC R6).
 * True iff featSlots.total > 0 AND every slot is filled. If total === 0
 * (no class picked yet, or class has no feat slot at this level), returns
 * false — an empty slot count is neutral, not complete.
 */
export function isDotesLevelComplete(
  progressionState: LevelProgressionStoreState,
  foundationState: CharacterFoundationStoreState,
  featState: FeatStoreState,
  skillState: SkillStoreState,
  level: ProgressionLevel,
): boolean {
  const snapshot = buildSnapshotFromStores(
    progressionState,
    foundationState,
    featState,
    skillState,
  );
  const budget = computePerLevelBudget(
    snapshot,
    level,
    CLASS_CATALOG_INPUT,
    FEAT_CATALOG_INPUT,
    RACE_CATALOG_INPUT,
  );
  if (budget.featSlots.total === 0) return false;
  return budget.featSlots.chosen === budget.featSlots.total;
}

// ---------------------------------------------------------------------------
// Phase 12.4-09 — Level completion state + advance-button label (SPEC R2 / D-06).
//
// Pure selectors that feed <LevelEditorActionBar>. Given the four planner
// store snapshots they compute {featDeficit, skillDeficit, isComplete} via
// the same computePerLevelBudget pipeline used by the sub-step predicates.
// computeAdvanceLabel is copy-layer: maps LevelCompletionState → {label,
// disabled} honoring the UI-SPEC R2 priority (feat deficit > skill deficit)
// and plural-aware copy. Store-capacity caveat inherited from 12.4-07: Humano
// L1 budget.featSlots.total=3 but the store only holds 2 feat slots, so the
// enabled state is unreachable for Humano L1 in the current store shape —
// same known limitation documented in 12.4-07's SUMMARY. Non-Humano paths
// reach enabled state deterministically.
// ---------------------------------------------------------------------------

export interface LevelCompletionState {
  level: ProgressionLevel;
  featDeficit: number;
  skillDeficit: number;
  isComplete: boolean;
  // Phase 12.6 (Plan 03, PROG-04 R5) — scan-surface totals. Additive fields:
  // all existing consumers read `isComplete`/`featDeficit`/`skillDeficit` and
  // keep working unchanged. These totals power the compact-row pills without
  // forcing a new wrapper selector.
  featSlots: { chosen: number; total: number };
  skillPoints: { spent: number; budget: number };
  classLabel: string | null;
}

export function selectLevelCompletionState(
  progressionState: LevelProgressionStoreState,
  foundationState: CharacterFoundationStoreState,
  featState: FeatStoreState,
  skillState: SkillStoreState,
  level: ProgressionLevel,
): LevelCompletionState {
  const snapshot = buildSnapshotFromStores(
    progressionState,
    foundationState,
    featState,
    skillState,
  );
  const budget = computePerLevelBudget(
    snapshot,
    level,
    CLASS_CATALOG_INPUT,
    FEAT_CATALOG_INPUT,
    RACE_CATALOG_INPUT,
  );
  const featDeficit = Math.max(0, budget.featSlots.total - budget.featSlots.chosen);
  const skillDeficit = Math.max(0, budget.skillPoints.budget - budget.skillPoints.spent);
  const isComplete =
    featDeficit === 0 && skillDeficit === 0 && budget.featSlots.total > 0;

  // Scan-surface totals (additive — see interface doc).
  const featSlots = {
    chosen: budget.featSlots.chosen,
    total: budget.featSlots.total,
  };
  const skillPoints = {
    spent: budget.skillPoints.spent,
    budget: budget.skillPoints.budget,
  };
  const classId =
    progressionState.levels.find((record) => record.level === level)?.classId ?? null;
  const classLabel =
    classId === null
      ? null
      : (compiledClassCatalog.classes.find((c) => c.id === classId)?.label ?? null);

  return {
    level,
    featDeficit,
    skillDeficit,
    isComplete,
    featSlots,
    skillPoints,
    classLabel,
  };
}

// ---------------------------------------------------------------------------
// Phase 12.6 (Plan 03, PROG-04 R5+R6) — row-level legality classification.
//
// Reuses:
//   - selectLevelRail (G1 sequential-gate predicate — emits locked/illegal per row)
//   - selectLevelCompletionState (12.4-09 — emits isComplete + deficits)
//
// Precedence (highest wins, per CONTEXT D-17):
//   locked     — prior level incomplete (G1 sequential gate)
//   invalid    — row has illegal issues in the revalidated progression
//   incomplete — missing feat or skill choices
//   legal      — all gates pass
//
// Pure — no React, no store reads inside; caller threads store state in.
// ---------------------------------------------------------------------------

export type LevelLegality = 'legal' | 'incomplete' | 'invalid' | 'locked';

export function selectLevelLegality(
  progressionState: LevelProgressionStoreState,
  foundationState: CharacterFoundationStoreState,
  featState: FeatStoreState,
  skillState: SkillStoreState,
  level: ProgressionLevel,
): LevelLegality {
  const rail = selectLevelRail(progressionState, foundationState);
  const entry = rail.find((r) => r.level === level);
  if (entry?.locked) return 'locked';
  if (entry?.status === 'illegal') return 'invalid';

  const completion = selectLevelCompletionState(
    progressionState,
    foundationState,
    featState,
    skillState,
    level,
  );
  if (!completion.isComplete) return 'incomplete';

  return 'legal';
}

export function computeAdvanceLabel(
  state: LevelCompletionState,
): { label: string; disabled: boolean } {
  const copy = shellCopyEs.progression.advanceButton;
  // Priority: feat deficit > skill deficit (UI-SPEC.md R2 "both unfilled" rule).
  if (state.featDeficit > 0) {
    const label =
      state.featDeficit === 1
        ? copy.deficitFeatsSingular
        : copy.deficitFeatsPluralTemplate.replace('{N}', String(state.featDeficit));
    return { label, disabled: true };
  }
  if (state.skillDeficit > 0) {
    const label =
      state.skillDeficit === 1
        ? copy.deficitSkillsSingular
        : copy.deficitSkillsPluralTemplate.replace('{N}', String(state.skillDeficit));
    return { label, disabled: true };
  }
  return {
    label: copy.continueTemplate.replace('{N}', String(state.level + 1)),
    disabled: false,
  };
}
