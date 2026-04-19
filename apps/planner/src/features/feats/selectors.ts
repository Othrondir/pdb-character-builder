import type { CanonicalId } from '@rules-engine/contracts/canonical-id';
import {
  computeTotalBab,
  computeFortSave,
} from '@rules-engine/feats/bab-calculator';
import {
  evaluateFeatPrerequisites,
  type BuildStateAtLevel,
  type PrerequisiteCheck,
} from '@rules-engine/feats/feat-prerequisite';
import { determineFeatSlots } from '@rules-engine/feats/feat-eligibility';
import {
  revalidateFeatSnapshotAfterChange,
  type FeatEvaluationStatus,
  type FeatLevelInput,
} from '@rules-engine/feats/feat-revalidation';
import { getClassLabel } from '@rules-engine/feats/get-class-label';
import {
  computePerLevelBudget,
  type BuildSnapshot,
  type PerLevelBudget,
} from '@rules-engine/progression/per-level-budget';
import { isSentinelLabel } from '@data-extractor/lib/sentinel-regex';
import type { CompiledFeat } from '@data-extractor/contracts/feat-catalog';

import { shellCopyEs } from '@planner/lib/copy/es';
import type { CharacterFoundationStoreState } from '@planner/features/character-foundation/store';
import type { ProgressionLevel } from '@planner/features/level-progression/progression-fixture';
import type { LevelProgressionStoreState } from '@planner/features/level-progression/store';
import type { SkillStoreState } from '@planner/features/skills/store';

import { compiledFeatCatalog, compiledClassCatalog } from './compiled-feat-catalog';
import type { FeatStoreState } from './store';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_ORDER: Record<FeatEvaluationStatus, number> = {
  illegal: 0,
  blocked: 1,
  legal: 2,
  pending: 3,
};

// ---------------------------------------------------------------------------
// View model interfaces
// ---------------------------------------------------------------------------

/**
 * Phase 12.4-07 (SPEC R5, CONTEXT D-03) — four mutually-exclusive row states
 * the feat-board selector resolves for every feat row. Priority (first match):
 *   already-taken > prereq > budget > selectable.
 */
export type FeatRowState =
  | 'selectable'
  | 'blocked-prereq'
  | 'blocked-already-taken'
  | 'blocked-budget';

export interface FeatBlockedReason {
  kind: 'prereq' | 'already-taken' | 'budget';
  /** Short pill badge copy — 'Bloqueada' | 'Tomada en N{level}' | 'Sin slots'. */
  pillLabel: string;
  /** Italic inline reason rendered beneath the label. Optional for `already-taken`. */
  reasonLabel?: string;
}

export interface FeatOptionView {
  category: string;
  description: string;
  featId: string;
  label: string;
  /** D-04: inline prereq text e.g. "[Fue 13, Poder]" */
  prereqSummary: string;
  selected: boolean;
  /** Phase 12.4-07 (SPEC R5 / D-03) — resolved per-row selectability state. */
  rowState: FeatRowState;
  /** Phase 12.4-07 — non-null when `rowState !== 'selectable'`. */
  blockedReason: FeatBlockedReason | null;
  /** Phase 12.4-07 (D-04) — true when this feat is already chosen at the active level. */
  isChosenAtLevel: boolean;
}

export interface FeatBoardCounters {
  /** Count of feats chosen at the active level (class + general + race bonuses). */
  chosen: number;
  /** Total feat slots available at the active level (per `computePerLevelBudget`). */
  slots: number;
}

export interface FeatSummaryChosenEntry {
  featId: string;
  label: string;
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
  /**
   * 12.3-03 (UAT B4): human-readable prompt listing the unfilled feat slots at
   * the active level. `null` when no slots exist for this class+level OR when
   * both slots are already filled.
   */
  slotPrompt: string | null;
  status: FeatEvaluationStatus;
  title: string;
}

export interface FeatBoardView {
  activeSheet: ActiveFeatSheetView;
  emptyStateBody: string | null;
  /** D-03: which step is active in the sequential flow */
  sequentialStep: 'class-bonus' | 'general' | null;
  /** Phase 12.4-07 (SPEC R5 / D-04) — per-level feat-slot counters. */
  counters: FeatBoardCounters;
  /** Phase 12.4-07 (D-04) — chosen feats at the active level, for the summary card. */
  chosenFeats: FeatSummaryChosenEntry[];
  /** Phase 12.4-07 — counter copy `Dotes del nivel N: {chosen}/{slots}`. */
  counterLabel: string;
}

export interface FeatSheetTabRowView {
  auto: boolean;
  featId: string;
  label: string;
  slot: 'class-bonus' | 'general' | 'auto';
  status: FeatEvaluationStatus;
  statusReason: string | null;
}

export interface FeatSheetTabGroupView {
  feats: FeatSheetTabRowView[];
  heading: string;
  level: number;
}

export interface FeatSheetTabView {
  groups: FeatSheetTabGroupView[];
  invalidCount: number;
  totalCount: number;
}

export interface FeatSummaryView {
  blockedLevels: number[];
  highestConfiguredLevel: number;
  planState: string;
  summaryStatus: FeatEvaluationStatus;
}

// ---------------------------------------------------------------------------
// Helper: compute build state at a given level
// ---------------------------------------------------------------------------

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
      abilityScores[rec.abilityIncrease] =
        (abilityScores[rec.abilityIncrease] ?? 0) + 1;
    }
  }

  // 2. Class levels: count levels per class up to current level
  const classLevels: Record<string, number> = {};

  for (const rec of progressionState.levels) {
    if (rec.level <= level && rec.classId) {
      classLevels[rec.classId] = (classLevels[rec.classId] ?? 0) + 1;
    }
  }

  // 3. BAB from class progression
  const bab = computeTotalBab(classLevels, compiledClassCatalog);

  // 4. Skill ranks: sum all allocations up to current level
  const skillRanks: Record<string, number> = {};

  for (const skillLevel of skillState.levels) {
    if (skillLevel.level <= level) {
      for (const alloc of skillLevel.allocations) {
        skillRanks[alloc.skillId] =
          (skillRanks[alloc.skillId] ?? 0) + alloc.rank;
      }
    }
  }

  // 5. Selected feats: all feats from levels strictly BEFORE current level (Pitfall 2)
  const selectedFeatIds = new Set<string>();

  for (const featLevel of featState.levels) {
    if (featLevel.level < level) {
      if (featLevel.classFeatId) {
        selectedFeatIds.add(featLevel.classFeatId);
      }

      if (featLevel.generalFeatId) {
        selectedFeatIds.add(featLevel.generalFeatId);
      }
    }
  }

  // Also add auto-granted feats from prior levels
  for (const rec of progressionState.levels) {
    if (rec.level < level && rec.classId) {
      const classLevelInClass = progressionState.levels
        .filter((r) => r.level <= rec.level && r.classId === rec.classId)
        .length;
      const slots = determineFeatSlots(
        rec.level,
        rec.classId,
        classLevelInClass,
        compiledFeatCatalog.classFeatLists,
      );

      for (const autoFeatId of slots.autoGrantedFeatIds) {
        selectedFeatIds.add(autoFeatId);
      }
    }
  }

  // 6. Fortitude save
  const fortitudeSave = computeFortSave(classLevels, compiledClassCatalog);

  return {
    abilityScores,
    bab,
    characterLevel: level,
    classLevels,
    fortitudeSave,
    selectedFeatIds,
    skillRanks,
  };
}

// ---------------------------------------------------------------------------
// Helper: build prereq summary text
// ---------------------------------------------------------------------------

function buildPrereqSummary(
  featId: string,
  buildState: BuildStateAtLevel,
): string {
  const feat = compiledFeatCatalog.feats.find((f) => f.id === featId);

  if (!feat) {
    return '';
  }

  const result = evaluateFeatPrerequisites(
    feat,
    buildState,
    compiledFeatCatalog,
    compiledClassCatalog,
  );

  if (result.checks.length === 0) {
    return '';
  }

  const parts = result.checks.map((check) => {
    if (check.type === 'ability') {
      return `${check.label} ${check.required}`;
    }

    if (check.type === 'bab') {
      return `BAB ${check.required}`;
    }

    if (check.type === 'feat' || check.type === 'or-feats') {
      return check.label;
    }

    if (check.type === 'skill') {
      return `${check.label} ${check.required}`;
    }

    return check.label;
  });

  return `[${parts.join(', ')}]`;
}

// ---------------------------------------------------------------------------
// Phase 12.4-07 helpers (SPEC R5 / CONTEXT D-03 + D-04)
// ---------------------------------------------------------------------------

/**
 * Format the first failing prerequisite check into a Spanish inline reason
 * string. Copy templates live in `shellCopyEs.feats.blockedReasons`. Falls
 * back to a generic label if the check shape is not recognised (keeps the
 * UI legible even if rules-engine adds a new check type later).
 */
function formatBlockedReason(check: PrerequisiteCheck): string {
  const tpl = shellCopyEs.feats.blockedReasons;

  if (check.type === 'ability') {
    // `check.label` is already the Spanish ability label (e.g. "Destreza").
    return tpl.prereqAbilityTemplate
      .replace('{abilityLabel}', check.label)
      .replace('{N}', check.required);
  }

  if (check.type === 'bab') {
    // `check.required` is of shape "+N" — strip the "+".
    const n = check.required.replace(/^\+/, '');
    return tpl.prereqBabTemplate.replace('{N}', n);
  }

  if (check.type === 'feat') {
    return tpl.prereqFeatTemplate.replace('{featName}', check.label);
  }

  if (check.type === 'or-feats') {
    return tpl.prereqOrFeatsTemplate.replace('{featNames}', check.label);
  }

  if (check.type === 'skill') {
    // `check.required` is of shape "N rangos"; extract the integer.
    const match = check.required.match(/\d+/);
    const n = match ? parseInt(match[0], 10) : 0;
    const template =
      n === 1
        ? tpl.prereqSkillRankSingularTemplate
        : tpl.prereqSkillRankPluralTemplate;
    return template.replace('{N}', String(n)).replace(
      '{skillName}',
      check.label,
    );
  }

  if (check.type === 'class-level') {
    // `check.label` is "Nivel de {className}"; `check.required` is the integer.
    const n = parseInt(check.required, 10) || 0;
    const className = check.label.replace(/^Nivel de\s+/, '');
    const template =
      n === 1
        ? tpl.prereqClassLevelSingularTemplate
        : tpl.prereqClassLevelPluralTemplate;
    return template.replace('{N}', String(n)).replace(
      '{className}',
      className,
    );
  }

  if (check.type === 'fort-save') {
    const n = check.required.replace(/^\+/, '');
    return tpl.prereqFortSaveTemplate.replace('{N}', n);
  }

  if (check.type === 'level') {
    return tpl.prereqCharacterLevelTemplate.replace('{N}', check.required);
  }

  return tpl.prereqGeneric;
}

/**
 * Scan the feat store for the earliest level at which `featId` was already
 * chosen (class-bonus or general slot). Returns the level number or `null`.
 * Excludes `activeLevel` itself so the user can see their own current pick
 * as `selectable` rather than `blocked-already-taken`.
 */
function findAlreadyTakenAtLevel(
  featState: FeatStoreState,
  featId: string,
  activeLevel: ProgressionLevel,
): number | null {
  for (const record of featState.levels) {
    if (record.level === activeLevel) continue;
    if (record.classFeatId === featId || record.generalFeatId === featId) {
      return record.level;
    }
  }
  return null;
}

/**
 * Build a `BuildSnapshot` adapter that pipes the planner's zustand stores
 * into the pure `computePerLevelBudget` selector. Closes over the store
 * states; no side effects.
 */
function buildSnapshotForBudget(
  foundationState: CharacterFoundationStoreState,
  progressionState: LevelProgressionStoreState,
  skillState: SkillStoreState,
  featState: FeatStoreState,
): BuildSnapshot {
  const classByLevel: Record<number, string | null> = {};
  for (const rec of progressionState.levels) {
    classByLevel[rec.level] = rec.classId;
  }

  const intAbilityIncreasesBeforeLevel = (level: number): number => {
    let count = 0;
    for (const rec of progressionState.levels) {
      if (rec.level < level && rec.abilityIncrease === 'int') count += 1;
    }
    return count;
  };

  const chosenFeatIdsAtLevel = (level: number): string[] => {
    const rec = featState.levels.find((r) => r.level === level);
    if (!rec) return [];
    const out: string[] = [];
    if (rec.classFeatId) out.push(rec.classFeatId);
    if (rec.generalFeatId) out.push(rec.generalFeatId);
    return out;
  };

  const spentSkillPointsAtLevel = (level: number): number => {
    const rec = skillState.levels.find((r) => r.level === level);
    if (!rec) return 0;
    return rec.allocations.reduce((sum, a) => sum + a.rank, 0);
  };

  return {
    raceId: foundationState.raceId,
    classByLevel,
    abilityScores: {
      int:
        foundationState.baseAttributes.int +
        (foundationState.racialModifiers?.int ?? 0),
    },
    intAbilityIncreasesBeforeLevel,
    chosenFeatIdsAtLevel,
    spentSkillPointsAtLevel,
  };
}

/**
 * Resolve the per-row state + blocked reason for a single feat at the
 * active level. Priority (first-match):
 *   already-taken > prereq > budget > selectable.
 */
function resolveFeatRowState(params: {
  feat: CompiledFeat;
  buildState: BuildStateAtLevel;
  featState: FeatStoreState;
  activeLevel: ProgressionLevel;
  isChosenAtLevel: boolean;
  budget: PerLevelBudget;
}): { rowState: FeatRowState; blockedReason: FeatBlockedReason | null } {
  const { feat, buildState, featState, activeLevel, isChosenAtLevel, budget } =
    params;

  // 1) already-taken at a DIFFERENT level (never block the user's own pick
  //    at the active level — that row stays selectable so they can toggle).
  const takenAtLevel = findAlreadyTakenAtLevel(
    featState,
    feat.id,
    activeLevel,
  );
  if (takenAtLevel !== null) {
    return {
      rowState: 'blocked-already-taken',
      blockedReason: {
        kind: 'already-taken',
        pillLabel: shellCopyEs.feats.blockedPills.alreadyTakenTemplate.replace(
          '{level}',
          String(takenAtLevel),
        ),
      },
    };
  }

  // 2) prereq — evaluate against the build-state snapshot AT the active level
  //    (so an ability bump or earlier feat selection lets later feats unlock).
  const prereqResult = evaluateFeatPrerequisites(
    feat,
    buildState,
    compiledFeatCatalog,
    compiledClassCatalog,
  );
  if (!prereqResult.met) {
    const firstFailing = prereqResult.checks.find((c) => !c.met);
    const reasonLabel = firstFailing
      ? formatBlockedReason(firstFailing)
      : shellCopyEs.feats.blockedReasons.prereqGeneric;
    return {
      rowState: 'blocked-prereq',
      blockedReason: {
        kind: 'prereq',
        pillLabel: shellCopyEs.feats.blockedPills.prereq,
        reasonLabel,
      },
    };
  }

  // 3) budget — all slots used up at the active level AND this feat is not
  //    the user's current pick (i.e. they can still toggle their own choice
  //    off; toggling others is blocked).
  if (
    budget.featSlots.total > 0 &&
    budget.featSlots.chosen >= budget.featSlots.total &&
    !isChosenAtLevel
  ) {
    return {
      rowState: 'blocked-budget',
      blockedReason: {
        kind: 'budget',
        pillLabel: shellCopyEs.feats.blockedPills.budget,
        reasonLabel: shellCopyEs.feats.blockedReasons.budgetExhausted,
      },
    };
  }

  return { rowState: 'selectable', blockedReason: null };
}

/**
 * Format the panel header counter — `Dotes del nivel {N}: {chosen}/{slots}`.
 * Kept as a named helper so tests can grep the template without ambiguity.
 */
function formatCounterLabel(
  level: number,
  chosen: number,
  slots: number,
): string {
  return shellCopyEs.feats.slotCounterTemplate
    .replace('{N}', String(level))
    .replace('{chosen}', String(chosen))
    .replace('{slots}', String(slots));
}

// ---------------------------------------------------------------------------
// Helper: compute class level in class
// ---------------------------------------------------------------------------

function getClassLevelInClass(
  progressionState: LevelProgressionStoreState,
  level: ProgressionLevel,
  classId: CanonicalId | null,
): number {
  if (!classId) {
    return 0;
  }

  return progressionState.levels.filter(
    (r) => r.level <= level && r.classId === classId,
  ).length;
}

// ---------------------------------------------------------------------------
// Selector: selectFeatBoardView
// ---------------------------------------------------------------------------

/**
 * 12.3-03 (UAT B4): compose a Spanish prompt listing unfilled feat slots at
 * the active level. Returns null when both booleans are false OR both slots
 * are already filled — nothing to prompt about.
 */
function computeSlotPrompt(
  featSlots: { classBonusFeatSlot: boolean; generalFeatSlot: boolean },
  selectedClassFeatId: CanonicalId | null,
  selectedGeneralFeatId: CanonicalId | null,
): string | null {
  const parts: string[] = [];

  if (featSlots.classBonusFeatSlot && selectedClassFeatId === null) {
    parts.push(shellCopyEs.feats.slotPromptClassAvailable);
  }

  if (featSlots.generalFeatSlot && selectedGeneralFeatId === null) {
    parts.push(shellCopyEs.feats.slotPromptGeneralAvailable);
  }

  return parts.length > 0 ? parts.join(' ') : null;
}

export function selectFeatBoardView(
  featState: FeatStoreState,
  progressionState: LevelProgressionStoreState,
  foundationState: CharacterFoundationStoreState,
  skillState: SkillStoreState,
): FeatBoardView {
  const activeLevel = featState.activeLevel;
  const activeProgression =
    progressionState.levels.find((r) => r.level === activeLevel) ?? null;
  const classId = activeProgression?.classId ?? null;

  // 12.3-03 (UAT B3): gate the empty-state on the ACTIVE level's classId
  // rather than the global `some(l => l.classId !== null)` check. The global
  // check surfaced "Completa una progresion valida" even when the user was
  // sitting on a level with a valid class, and hid the per-level empty-state
  // when only some levels had classes set.
  if (classId === null) {
    const emptySheet: ActiveFeatSheetView = {
      classId: null,
      classLabel: null,
      eligibleClassFeats: [],
      eligibleGeneralFeats: [],
      emptyMessage: shellCopyEs.feats.emptyStateBodyPerLevel,
      hasClassBonusSlot: false,
      hasGeneralSlot: false,
      level: activeLevel,
      selectedClassFeatId: null,
      selectedGeneralFeatId: null,
      slotPrompt: null,
      status: 'pending',
      title: shellCopyEs.stepper.stepTitles.feats,
    };

    return {
      activeSheet: emptySheet,
      emptyStateBody: shellCopyEs.feats.emptyStateBodyPerLevel,
      sequentialStep: null,
      counters: { chosen: 0, slots: 0 },
      chosenFeats: [],
      counterLabel: formatCounterLabel(activeLevel, 0, 0),
    };
  }
  const classLevelInClass = getClassLevelInClass(
    progressionState,
    activeLevel,
    classId,
  );
  const activeFeatRecord =
    featState.levels.find((r) => r.level === activeLevel) ?? null;
  const buildState = computeBuildStateAtLevel(
    activeLevel,
    foundationState,
    progressionState,
    skillState,
    featState,
  );
  const featSlots = determineFeatSlots(
    activeLevel,
    classId,
    classLevelInClass,
    compiledFeatCatalog.classFeatLists,
  );

  // Phase 12.4-07 — per-level budget supplies authoritative slot counter
  // (general + classBonus + raceBonus). See computePerLevelBudget (12.4-03).
  const buildSnapshot = buildSnapshotForBudget(
    foundationState,
    progressionState,
    skillState,
    featState,
  );
  const budget: PerLevelBudget = computePerLevelBudget(
    buildSnapshot,
    activeLevel,
    {
      classes: compiledClassCatalog.classes.map((c) => ({
        id: c.id,
        skillPointsPerLevel: c.skillPointsPerLevel,
      })),
    },
    { classFeatLists: compiledFeatCatalog.classFeatLists },
    { races: [] },
  );

  // Bucket membership: whether a feat belongs to the class-bonus pool or
  // the general pool for the active class. Used for section-assignment
  // below.  Feats can belong to both (e.g. Esquiva — allClassesCanUse
  // AND listed as class-bonus for Guerrero); they get rendered in both
  // sections but the row state + chosen flag are shared.
  const classBonusFeatIds = new Set<string>();
  const generalListZeroFeatIds = new Set<string>();
  if (compiledFeatCatalog.classFeatLists[classId]) {
    for (const entry of compiledFeatCatalog.classFeatLists[classId]) {
      if (entry.list === 1 || entry.list === 2) {
        classBonusFeatIds.add(entry.featId);
      }
      if (entry.list === 0) {
        generalListZeroFeatIds.add(entry.featId);
      }
    }
  }

  const selectedClassFeatId = activeFeatRecord?.classFeatId ?? null;
  const selectedGeneralFeatId = activeFeatRecord?.generalFeatId ?? null;

  // D-03: sequential step determination
  let sequentialStep: 'class-bonus' | 'general' | null = null;

  if (featSlots.classBonusFeatSlot && selectedClassFeatId === null) {
    sequentialStep = 'class-bonus';
  } else if (featSlots.generalFeatSlot && selectedGeneralFeatId === null) {
    sequentialStep = 'general';
  }

  // Run revalidation for status
  const revalidationInput: FeatLevelInput[] = featState.levels.map((lvl) => ({
    buildState: computeBuildStateAtLevel(
      lvl.level as ProgressionLevel,
      foundationState,
      progressionState,
      skillState,
      featState,
    ),
    classFeatId: lvl.classFeatId,
    generalFeatId: lvl.generalFeatId,
    level: lvl.level,
  }));
  const revalidated = revalidateFeatSnapshotAfterChange({
    levels: revalidationInput,
    featCatalog: compiledFeatCatalog,
    classCatalog: compiledClassCatalog,
  });
  const activeRevalidated =
    revalidated.find((r) => r.level === activeLevel) ?? null;

  // Phase 12.4-07 (SPEC R5 / D-03) — map the full feat catalog into option
  // views preserving ALL rows (visibility lock: blocked rows remain in the
  // DOM). Epic + sentinel rows stay filtered (belt-and-braces for 12.4-01).
  const classBonusOptions: FeatOptionView[] = [];
  const generalOptions: FeatOptionView[] = [];

  for (const feat of compiledFeatCatalog.feats) {
    if (feat.prerequisites.preReqEpic === true) continue;
    if (isSentinelLabel(feat.label)) continue;

    const inClassBonusPool = classBonusFeatIds.has(feat.id);
    const inGeneralPool =
      feat.allClassesCanUse || generalListZeroFeatIds.has(feat.id);
    if (!inClassBonusPool && !inGeneralPool) continue;

    const isChosenAtLevel =
      selectedClassFeatId === feat.id || selectedGeneralFeatId === feat.id;
    const { rowState, blockedReason } = resolveFeatRowState({
      feat,
      buildState,
      featState,
      activeLevel,
      isChosenAtLevel,
      budget,
    });
    const optionView: FeatOptionView = {
      category: feat.category,
      description: feat.description,
      featId: feat.id,
      label: feat.label,
      prereqSummary: buildPrereqSummary(feat.id, buildState),
      selected:
        feat.id === selectedClassFeatId || feat.id === selectedGeneralFeatId,
      rowState,
      blockedReason,
      isChosenAtLevel,
    };

    if (inClassBonusPool) classBonusOptions.push(optionView);
    if (inGeneralPool) generalOptions.push(optionView);
  }

  const activeSheet: ActiveFeatSheetView = {
    classId,
    classLabel: getClassLabel(classId, compiledClassCatalog),
    eligibleClassFeats: classBonusOptions,
    eligibleGeneralFeats: generalOptions,
    emptyMessage: classId
      ? shellCopyEs.feats.emptyStateBody
      : shellCopyEs.stepper.levelEmptyHint,
    hasClassBonusSlot: featSlots.classBonusFeatSlot,
    hasGeneralSlot: featSlots.generalFeatSlot,
    level: activeLevel,
    selectedClassFeatId,
    selectedGeneralFeatId,
    slotPrompt: computeSlotPrompt(
      featSlots,
      selectedClassFeatId,
      selectedGeneralFeatId,
    ),
    status: activeRevalidated?.status ?? 'pending',
    title: shellCopyEs.stepper.stepTitles.feats,
  };

  // Phase 12.4-07 (D-04) — chosen feats at the active level, for the
  // FeatSummaryCard collapse view. Dedupe in case the same feat id lands
  // in both store slots (defensive — store should prevent this).
  const chosenIds: string[] = [];
  if (selectedClassFeatId) chosenIds.push(selectedClassFeatId);
  if (selectedGeneralFeatId && !chosenIds.includes(selectedGeneralFeatId)) {
    chosenIds.push(selectedGeneralFeatId);
  }
  const chosenFeats: FeatSummaryChosenEntry[] = chosenIds.map((id) => {
    const feat = compiledFeatCatalog.feats.find((f) => f.id === id);
    return { featId: id, label: feat?.label ?? id };
  });

  // Slot counter reads budget.featSlots (authoritative; includes raceBonus).
  // `chosen` matches what the store actually holds (class + general at this
  // level) so collapse-on-complete triggers correctly for non-Humano and
  // for Humano when all store-addressable slots are filled.
  const counters: FeatBoardCounters = {
    chosen: chosenIds.length,
    slots: budget.featSlots.total,
  };

  return {
    activeSheet,
    emptyStateBody: null,
    sequentialStep,
    counters,
    chosenFeats,
    counterLabel: formatCounterLabel(
      activeLevel,
      counters.chosen,
      counters.slots,
    ),
  };
}

// ---------------------------------------------------------------------------
// Selector: selectFeatSheetTabView
// ---------------------------------------------------------------------------

export function selectFeatSheetTabView(
  featState: FeatStoreState,
  progressionState: LevelProgressionStoreState,
  foundationState: CharacterFoundationStoreState,
  skillState: SkillStoreState,
): FeatSheetTabView {
  const groups: FeatSheetTabGroupView[] = [];
  let totalCount = 0;
  let invalidCount = 0;

  for (const levelRecord of featState.levels) {
    const progressionRecord =
      progressionState.levels.find((r) => r.level === levelRecord.level) ??
      null;
    const classId = progressionRecord?.classId ?? null;
    const classLevelInClass = getClassLevelInClass(
      progressionState,
      levelRecord.level,
      classId,
    );
    const buildState = computeBuildStateAtLevel(
      levelRecord.level,
      foundationState,
      progressionState,
      skillState,
      featState,
    );

    // Auto-granted feats
    const autoGranted = determineFeatSlots(
      levelRecord.level,
      classId,
      classLevelInClass,
      compiledFeatCatalog.classFeatLists,
    ).autoGrantedFeatIds;

    const feats: FeatSheetTabRowView[] = [];

    // Add auto-granted feats
    for (const autoFeatId of autoGranted) {
      const feat = compiledFeatCatalog.feats.find((f) => f.id === autoFeatId);

      feats.push({
        auto: true,
        featId: autoFeatId,
        label: feat?.label ?? autoFeatId,
        slot: 'auto',
        status: 'legal',
        statusReason: null,
      });
      totalCount++;
    }

    // Add selected class feat
    if (levelRecord.classFeatId) {
      const feat = compiledFeatCatalog.feats.find(
        (f) => f.id === levelRecord.classFeatId,
      );
      let status: FeatEvaluationStatus = 'legal';
      let statusReason: string | null = null;

      if (feat) {
        const result = evaluateFeatPrerequisites(
          feat,
          buildState,
          compiledFeatCatalog,
          compiledClassCatalog,
        );

        if (!result.met) {
          status = 'illegal';
          statusReason = result.checks
            .filter((c) => !c.met)
            .map((c) => `${c.label}: ${c.current}`)
            .join(', ');
          invalidCount++;
        }
      }

      feats.push({
        auto: false,
        featId: levelRecord.classFeatId,
        label: feat?.label ?? levelRecord.classFeatId,
        slot: 'class-bonus',
        status,
        statusReason,
      });
      totalCount++;
    }

    // Add selected general feat
    if (levelRecord.generalFeatId) {
      const feat = compiledFeatCatalog.feats.find(
        (f) => f.id === levelRecord.generalFeatId,
      );
      let status: FeatEvaluationStatus = 'legal';
      let statusReason: string | null = null;

      if (feat) {
        const result = evaluateFeatPrerequisites(
          feat,
          buildState,
          compiledFeatCatalog,
          compiledClassCatalog,
        );

        if (!result.met) {
          status = 'illegal';
          statusReason = result.checks
            .filter((c) => !c.met)
            .map((c) => `${c.label}: ${c.current}`)
            .join(', ');
          invalidCount++;
        }
      }

      feats.push({
        auto: false,
        featId: levelRecord.generalFeatId,
        label: feat?.label ?? levelRecord.generalFeatId,
        slot: 'general',
        status,
        statusReason,
      });
      totalCount++;
    }

    if (feats.length > 0) {
      groups.push({
        feats,
        heading: `Nivel ${levelRecord.level}`,
        level: levelRecord.level,
      });
    }
  }

  return { groups, invalidCount, totalCount };
}

// ---------------------------------------------------------------------------
// Selector: selectFeatSummary
// ---------------------------------------------------------------------------

export function selectFeatSummary(
  featState: FeatStoreState,
  progressionState: LevelProgressionStoreState,
  foundationState: CharacterFoundationStoreState,
  skillState: SkillStoreState,
): FeatSummaryView {
  const highestConfiguredLevel = featState.levels.reduce(
    (highest, record) =>
      record.classFeatId || record.generalFeatId
        ? Math.max(highest, record.level)
        : highest,
    0,
  );

  if (highestConfiguredLevel === 0) {
    return {
      blockedLevels: [],
      highestConfiguredLevel: 0,
      planState: shellCopyEs.feats.planStates.empty,
      summaryStatus: 'pending',
    };
  }

  // Build revalidation inputs for all levels
  const revalidationInput: FeatLevelInput[] = featState.levels.map((lvl) => ({
    buildState: computeBuildStateAtLevel(
      lvl.level as ProgressionLevel,
      foundationState,
      progressionState,
      skillState,
      featState,
    ),
    classFeatId: lvl.classFeatId,
    generalFeatId: lvl.generalFeatId,
    level: lvl.level,
  }));
  const revalidated = revalidateFeatSnapshotAfterChange({
    levels: revalidationInput,
    featCatalog: compiledFeatCatalog,
    classCatalog: compiledClassCatalog,
  });

  const relevantLevels = featState.levels
    .filter((r) => r.level <= highestConfiguredLevel)
    .map((r) => r.level);
  const blockedLevels = relevantLevels.filter((level) => {
    const revalidatedLevel = revalidated.find((r) => r.level === level);
    const status = revalidatedLevel?.status ?? 'pending';

    return status === 'blocked' || status === 'illegal';
  });

  const hasIllegal = relevantLevels.some(
    (level) => revalidated.find((r) => r.level === level)?.status === 'illegal',
  );
  const hasBlocked = relevantLevels.some(
    (level) => revalidated.find((r) => r.level === level)?.status === 'blocked',
  );

  const summaryStatus: FeatEvaluationStatus = hasIllegal
    ? 'illegal'
    : hasBlocked
      ? 'blocked'
      : 'legal';

  const highestProgressionLevel = progressionState.levels.reduce(
    (highest, record) =>
      record.classId ? Math.max(highest, record.level) : highest,
    0,
  );

  const planState =
    summaryStatus === 'illegal' || summaryStatus === 'blocked'
      ? shellCopyEs.feats.planStates.repair
      : highestConfiguredLevel < highestProgressionLevel
        ? shellCopyEs.feats.planStates.inProgress
        : shellCopyEs.feats.planStates.ready;

  return {
    blockedLevels,
    highestConfiguredLevel,
    planState,
    summaryStatus,
  };
}
