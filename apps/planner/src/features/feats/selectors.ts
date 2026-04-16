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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FEAT_CATEGORY_LABELS: Record<string, string> = {
  '0': 'General',
  '2': 'Combate',
  '3': 'Arcana',
  '7': 'Arma',
  '8': 'Armadura',
  '10': 'Escudo',
  '12': 'Habilidad',
  '15': 'Divina',
  '17': 'Epica',
  '22': 'Clase',
  'general': 'General',
};

const STATUS_ORDER: Record<FeatEvaluationStatus, number> = {
  illegal: 0,
  blocked: 1,
  legal: 2,
  pending: 3,
};

// ---------------------------------------------------------------------------
// View model interfaces
// ---------------------------------------------------------------------------

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
    spellcastingLevel: 0, // Phase 7 will compute this
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

  const result = evaluateFeatPrerequisites(feat, buildState, compiledFeatCatalog);

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
// Helper: get class label from compiled catalog
// ---------------------------------------------------------------------------

function getClassLabel(classId: CanonicalId | null): string | null {
  if (!classId) {
    return null;
  }

  return compiledClassCatalog.classes.find((c) => c.id === classId)?.label ?? null;
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
    const emptySheet: ActiveFeatSheetView = {
      classId: null,
      classLabel: null,
      eligibleClassFeats: [],
      eligibleGeneralFeats: [],
      emptyMessage: shellCopyEs.feats.emptyStateBody,
      hasClassBonusSlot: false,
      hasGeneralSlot: false,
      level: featState.activeLevel,
      selectedClassFeatId: null,
      selectedGeneralFeatId: null,
      status: 'pending',
      title: shellCopyEs.stepper.stepTitles.feats,
    };

    return {
      activeSheet: emptySheet,
      emptyStateBody: shellCopyEs.feats.emptyStateBody,
      sequentialStep: null,
    };
  }

  const activeLevel = featState.activeLevel;
  const activeProgression =
    progressionState.levels.find((r) => r.level === activeLevel) ?? null;
  const classId = activeProgression?.classId ?? null;
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
  const eligible = getEligibleFeats(
    buildState,
    classId,
    classLevelInClass,
    compiledFeatCatalog,
    compiledClassCatalog,
  );

  const mapToOptionView = (
    feat: { id: string; label: string; description: string; category: string },
    selectedId: string | null,
  ): FeatOptionView => ({
    category: feat.category,
    categoryLabel: FEAT_CATEGORY_LABELS[feat.category] ?? feat.category,
    description: feat.description,
    featId: feat.id,
    label: feat.label,
    prereqSummary: buildPrereqSummary(feat.id, buildState),
    selected: feat.id === selectedId,
  });

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
  });
  const activeRevalidated =
    revalidated.find((r) => r.level === activeLevel) ?? null;

  const activeSheet: ActiveFeatSheetView = {
    classId,
    classLabel: getClassLabel(classId),
    eligibleClassFeats: eligible.classBonusFeats.map((f) =>
      mapToOptionView(f, selectedClassFeatId),
    ),
    eligibleGeneralFeats: eligible.generalFeats.map((f) =>
      mapToOptionView(f, selectedGeneralFeatId),
    ),
    emptyMessage: classId
      ? shellCopyEs.feats.emptyStateBody
      : shellCopyEs.stepper.levelEmptyHint,
    hasClassBonusSlot: featSlots.classBonusFeatSlot,
    hasGeneralSlot: featSlots.generalFeatSlot,
    level: activeLevel,
    selectedClassFeatId,
    selectedGeneralFeatId,
    status: activeRevalidated?.status ?? 'pending',
    title: shellCopyEs.stepper.stepTitles.feats,
  };

  return {
    activeSheet,
    emptyStateBody: null,
    sequentialStep,
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
