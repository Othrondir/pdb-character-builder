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
import {
  getChosenFeatIds,
  getGeneralFeatIds,
  type FeatStoreState,
} from './store';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_ORDER: Record<FeatEvaluationStatus, number> = {
  illegal: 0,
  blocked: 1,
  legal: 2,
  pending: 3,
};

/**
 * UAT-2026-04-24 E3 — drop extractor artifacts that are not player-facing
 * feats. Covers three distinct classes of noise rows that appeared in the
 * picker against master 2026-04-24:
 *   - "(PB) …" entries (Puerta Baldur admin tools exposed via the feat table).
 *   - "Herramienta …" entries (DM / voice / player-tool admin feats).
 *   - "WeapFocSap" (untranslated stub from the NWN EE canon).
 */
const PUERTA_ADMIN_LABEL_PATTERN =
  /^(?:\(PB\)|Herramienta\b|WeapFocSap$)/i;

function isPuertaAdminLabel(label: string): boolean {
  return PUERTA_ADMIN_LABEL_PATTERN.test(label.trim());
}

/**
 * UAT-2026-04-24 E4 — synthetic family prefixes. The NWN EE feat table
 * expands these groups into one row per parameter (e.g. one row per weapon),
 * which floods the picker with 40+ near-duplicates. The compiled data lacks
 * `parameterizedFeatFamily` metadata for them, so we synthesize a family at
 * the selector layer: every singleton whose label starts with one of these
 * prefixes gets folded into a shared expander.
 */
const SYNTHETIC_FAMILY_PREFIXES: Array<{ prefix: string; groupKey: string }> = [
  { prefix: 'Competencia con arma exótica', groupKey: 'synthetic:competencia-arma-exotica' },
  { prefix: 'Competencia con arma marcial', groupKey: 'synthetic:competencia-arma-marcial' },
  { prefix: 'Crítico mejorado', groupKey: 'synthetic:critico-mejorado' },
];

function matchSyntheticFamilyPrefix(label: string): { prefix: string; groupKey: string } | null {
  const trimmed = label.trim();
  for (const entry of SYNTHETIC_FAMILY_PREFIXES) {
    if (trimmed.startsWith(`${entry.prefix} (`)) {
      return entry;
    }
  }
  return null;
}

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

export type FeatSlotKind = 'class-bonus' | 'general';

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

export interface FeatSlotStatusView {
  key: string;
  label: string;
  slot: FeatSlotKind;
  slotIndex: number;
  state: 'current' | 'pending' | 'chosen';
  stateLabel: string;
  valueLabel: string;
}

// ---------------------------------------------------------------------------
// Phase 12.4-08 (SPEC R7 / CONTEXT D-05) — parameterized feat family view
// ---------------------------------------------------------------------------

/**
 * Groups per-target feat variants (e.g. `Soltura con una habilidad (Trato...)`)
 * under a single folded row. The main Dotes list renders one `FeatFamilyView`
 * per family (groupKey) instead of ~N rows per variant; clicking opens an
 * inline `<fieldset class="feat-family-expander">` with the target radio list.
 *
 * The row state resolves to `selectable` when at least one target is
 * selectable; else the most-restrictive-but-not-blocking state wins (prereq
 * > budget > already-taken). A `selectedTarget` is non-null when the user
 * has picked any variant at the active level.
 */
export interface FeatFamilyView {
  /** Short canonical id of the family (e.g. `feat:skill-focus`). */
  canonicalId: string;
  /** Short groupKey — usually === canonicalId. Used by UI for `data-family-id`. */
  groupKey: string;
  /** User-facing family label (e.g. `Soltura con una habilidad`). */
  label: string;
  /** Parameter word fed into the expander legend (e.g. `habilidad`). */
  paramLabel: string;
  /** Family's resolved row state — SELECTABLE unless every target is blocked. */
  rowState: FeatRowState;
  /** Non-null when rowState !== 'selectable'. */
  blockedReason: FeatBlockedReason | null;
  /** Per-target variant rows (each carries its own rowState + blockedReason). */
  targets: FeatOptionView[];
  /** The target chosen at the active level, or null. */
  selectedTarget: FeatOptionView | null;
}

/**
 * Union the main Dotes list consumes: either a plain feat row, or a folded
 * family row. FeatSheet discriminates on the presence of `targets`.
 */
export type FeatListEntry =
  | { kind: 'feat'; option: FeatOptionView }
  | { kind: 'family'; family: FeatFamilyView };

/**
 * Phase 12.8-03 (D-06, UAT-2026-04-23 F4) — richer chip entry shape.
 * `slotKind` + `slotIndex` let <FeatSummaryCard> dispatch the correct
 * clear action per chip (clearClassFeat / clearGeneralFeat with index).
 * `slotIndex` semantics match the store:
 *   - slotKind='class-bonus', slotIndex=0 → classFeatId
 *   - slotKind='general',     slotIndex=0 → generalFeatId
 *   - slotKind='general',     slotIndex=1…N → bonusGeneralFeatIds[index-1]
 */
export interface FeatSummaryChosenEntry {
  featId: string;
  label: string;
  slotKind: 'class-bonus' | 'general';
  slotIndex: number;
}

export interface ActiveFeatSheetView {
  classId: CanonicalId | null;
  classLabel: string | null;
  eligibleClassFeats: FeatOptionView[];
  eligibleGeneralFeats: FeatOptionView[];
  emptyMessage: string;
  hasClassBonusSlot: boolean;
  hasGeneralSlot: boolean;
  generalSlotCount: number;
  level: ProgressionLevel;
  selectedClassFeatId: CanonicalId | null;
  selectedGeneralFeatIds: CanonicalId[];
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
  sequentialStep: FeatSlotKind | null;
  /** Phase 12.4-07 (SPEC R5 / D-04) — per-level feat-slot counters. */
  counters: FeatBoardCounters;
  /** Phase 12.4-07 (D-04) — chosen feats at the active level, for the summary card. */
  chosenFeats: FeatSummaryChosenEntry[];
  /** Phase 12.4-07 — counter copy `Dotes del nivel N: {chosen}/{slots}`. */
  counterLabel: string;
  /** UX aid: per-slot status strip shown above the picker. */
  slotStatuses: FeatSlotStatusView[];
  /**
   * Phase 12.4-08 (SPEC R7 / D-05) — class-bonus pool entries grouped by
   * family. Each entry is either a single feat (FeatListEntry.kind === 'feat')
   * or a folded family row (kind === 'family'). FeatSheet renders these
   * instead of iterating `activeSheet.eligibleClassFeats` directly.
   */
  classBonusEntries: FeatListEntry[];
  /**
   * Phase 12.4-08 — general pool entries grouped by family. Same shape as
   * classBonusEntries. Entries are ordered by label (families mixed with
   * non-family rows, alphabetically).
   */
  generalEntries: FeatListEntry[];
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
      for (const featId of getChosenFeatIds(featLevel)) {
        selectedFeatIds.add(featId);
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
    if (getChosenFeatIds(record).includes(featId as CanonicalId)) {
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
    return getChosenFeatIds(rec);
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
// Phase 12.4-08 (SPEC R7 / CONTEXT D-05) — family grouping helpers
// ---------------------------------------------------------------------------

/**
 * Strip the trailing `(X)` parameter from a family-variant label so the
 * folded family row shows the bare family label. Example:
 *   'Soltura con una habilidad (Trato con los animales)' → 'Soltura con una habilidad'
 */
function stripFamilyParameter(label: string): string {
  const idx = label.lastIndexOf('(');
  if (idx === -1) return label.trim();
  return label.slice(0, idx).trim();
}

/**
 * Format the pill badge count on a folded family row — `{N} objetivos`
 * (plural-aware). Counts targets that are NOT blocked-already-taken: those
 * are effectively "gone" for this family at future levels.
 */
function formatFamilyTargetsPill(targets: FeatOptionView[]): string {
  const available = targets.filter(
    (t) => t.rowState !== 'blocked-already-taken',
  ).length;
  return available === 1
    ? shellCopyEs.feats.familyPillSingular
    : shellCopyEs.feats.familyPillPluralTemplate.replace(
        '{N}',
        String(available),
      );
}

/**
 * Fold a pool of FeatOptionView rows into FeatListEntry[]. Variants that
 * share a `parameterizedFeatFamily.groupKey` collapse into a single
 * `FeatFamilyView`; non-family rows stay as `kind: 'feat'`. Final order
 * is alphabetical by primary label (family label or feat label).
 *
 * Family row state rollup:
 *   - SELECTABLE if at least one target is selectable
 *   - else blocked-prereq if any target is prereq-only-blocked
 *   - else blocked-budget / blocked-already-taken as last resorts
 */
function groupIntoFamilyEntries(options: FeatOptionView[]): FeatListEntry[] {
  const familyBuckets = new Map<string, FeatOptionView[]>();
  const singletons: FeatOptionView[] = [];

  // We need the CompiledFeat to read its parameterizedFeatFamily; rebuild
  // a map once for this call.
  const featById = new Map(compiledFeatCatalog.feats.map((f) => [f.id, f]));

  // UAT-2026-04-24 E4 — synthetic family groupKey chosen for each option.
  // `null` means the option is a true singleton; a string means it should
  // participate in either the real (metadata-driven) or synthetic family.
  const syntheticMeta = new Map<string, { prefix: string; groupKey: string }>();

  for (const opt of options) {
    const feat = featById.get(opt.featId);
    const family = feat?.parameterizedFeatFamily ?? null;
    if (family && family.groupKey) {
      const list = familyBuckets.get(family.groupKey) ?? [];
      list.push(opt);
      familyBuckets.set(family.groupKey, list);
      continue;
    }
    const synthetic = matchSyntheticFamilyPrefix(opt.label);
    if (synthetic) {
      const list = familyBuckets.get(synthetic.groupKey) ?? [];
      list.push(opt);
      familyBuckets.set(synthetic.groupKey, list);
      syntheticMeta.set(synthetic.groupKey, synthetic);
      continue;
    }
    singletons.push(opt);
  }

  const entries: FeatListEntry[] = [];

  for (const [groupKey, targets] of familyBuckets) {
    // Stable alphabetical order inside the expander radio list.
    targets.sort((a, b) => a.label.localeCompare(b.label));
    const firstTarget = targets[0];
    const firstFeat = featById.get(firstTarget.featId);
    const familyMeta = firstFeat?.parameterizedFeatFamily ?? null;
    const synthetic = familyMeta ? null : (syntheticMeta.get(groupKey) ?? null);
    if (!familyMeta && !synthetic) continue;

    const selectedTarget = targets.find((t) => t.isChosenAtLevel) ?? null;

    // Rollup the family row state.
    const anySelectable = targets.some((t) => t.rowState === 'selectable');
    let rowState: FeatRowState;
    let blockedReason: FeatBlockedReason | null;
    if (anySelectable) {
      rowState = 'selectable';
      blockedReason = null;
    } else {
      // No selectable target. Pick the most informative blocked flavor.
      const prereqTarget = targets.find(
        (t) => t.rowState === 'blocked-prereq',
      );
      const budgetTarget = targets.find(
        (t) => t.rowState === 'blocked-budget',
      );
      const takenTarget = targets.find(
        (t) => t.rowState === 'blocked-already-taken',
      );
      const picked = prereqTarget ?? budgetTarget ?? takenTarget ?? firstTarget;
      rowState = picked.rowState;
      blockedReason = picked.blockedReason;
    }

    const canonicalId = familyMeta?.canonicalId ?? (groupKey as CanonicalId);
    const paramLabel = familyMeta?.paramLabel ?? '';
    const label = familyMeta
      ? stripFamilyParameter(firstTarget.label)
      : (synthetic?.prefix ?? stripFamilyParameter(firstTarget.label));

    entries.push({
      kind: 'family',
      family: {
        canonicalId,
        groupKey,
        label,
        paramLabel,
        rowState,
        blockedReason,
        targets,
        selectedTarget,
      },
    });
  }

  for (const opt of singletons) {
    entries.push({ kind: 'feat', option: opt });
  }

  entries.sort((a, b) => {
    const labelA =
      a.kind === 'family' ? a.family.label : a.option.label;
    const labelB =
      b.kind === 'family' ? b.family.label : b.option.label;
    return labelA.localeCompare(labelB);
  });

  return entries;
}

/** Exported for unit-test introspection of the grouping contract. */
export function __internalGroupIntoFamilyEntriesForTest(
  options: FeatOptionView[],
): FeatListEntry[] {
  return groupIntoFamilyEntries(options);
}

export { formatFamilyTargetsPill as __internalFormatFamilyTargetsPillForTest };

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
  selectedGeneralFeatIds: CanonicalId[],
  generalSlotCount: number,
): string | null {
  const parts: string[] = [];

  if (featSlots.classBonusFeatSlot && selectedClassFeatId === null) {
    parts.push(shellCopyEs.feats.slotPromptClassAvailable);
  }

  const remainingGeneralSlots = Math.max(
    0,
    generalSlotCount - selectedGeneralFeatIds.length,
  );

  if (remainingGeneralSlots === 1) {
    parts.push(shellCopyEs.feats.slotPromptGeneralAvailable);
  } else if (remainingGeneralSlots > 1) {
    parts.push(
      shellCopyEs.feats.slotPromptGeneralAvailablePluralTemplate.replace(
        '{N}',
        String(remainingGeneralSlots),
      ),
    );
  }

  return parts.length > 0 ? parts.join(' ') : null;
}

function resolveFeatLabel(featId: CanonicalId | null): string | null {
  if (!featId) {
    return null;
  }

  return compiledFeatCatalog.feats.find((feat) => feat.id === featId)?.label ?? featId;
}

function buildSlotStatuses(params: {
  hasClassBonusSlot: boolean;
  generalSlotCount: number;
  selectedClassFeatId: CanonicalId | null;
  selectedGeneralFeatIds: CanonicalId[];
  sequentialStep: FeatSlotKind | null;
}): FeatSlotStatusView[] {
  const {
    hasClassBonusSlot,
    generalSlotCount,
    selectedClassFeatId,
    selectedGeneralFeatIds,
    sequentialStep,
  } = params;

  const statuses: FeatSlotStatusView[] = [];

  const pushStatus = (
    slot: FeatSlotKind,
    slotIndex: number,
    label: string,
    featId: CanonicalId | null,
  ) => {
    const selectedLabel = resolveFeatLabel(featId);
    const isCurrentSlot =
      slot === 'class-bonus'
        ? sequentialStep === 'class-bonus'
        : sequentialStep === 'general' &&
          slotIndex === selectedGeneralFeatIds.length;
    const state: FeatSlotStatusView['state'] = selectedLabel
      ? 'chosen'
      : isCurrentSlot
        ? 'current'
        : 'pending';

    const stateLabel =
      state === 'chosen'
        ? shellCopyEs.feats.slotStatusChosen
        : state === 'current'
          ? shellCopyEs.feats.slotStatusCurrent
          : shellCopyEs.feats.slotStatusPending;

    statuses.push({
      key: `${slot}-${slotIndex}`,
      label,
      slot,
      slotIndex,
      state,
      stateLabel,
      valueLabel: selectedLabel ?? shellCopyEs.feats.slotStatusEmpty,
    });
  };

  if (hasClassBonusSlot) {
    pushStatus(
      'class-bonus',
      0,
      shellCopyEs.feats.classFeatStepTitle,
      selectedClassFeatId,
    );
  }

  for (let slotIndex = 0; slotIndex < generalSlotCount; slotIndex += 1) {
    pushStatus(
      'general',
      slotIndex,
      slotIndex === 0
        ? shellCopyEs.feats.generalFeatStepTitle
        : shellCopyEs.feats.generalFeatBonusStepTitleTemplate.replace(
            '{N}',
            String(slotIndex + 1),
          ),
      selectedGeneralFeatIds[slotIndex] ?? null,
    );
  }

  return statuses;
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
      generalSlotCount: 0,
      level: activeLevel,
      selectedClassFeatId: null,
      selectedGeneralFeatIds: [],
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
      slotStatuses: [],
      classBonusEntries: [],
      generalEntries: [],
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
  const selectedGeneralFeatIds = getGeneralFeatIds(activeFeatRecord);
  const selectedGeneralFeatId = selectedGeneralFeatIds[0] ?? null;
  const generalSlotCount = budget.featSlots.general + budget.featSlots.raceBonus;

  // D-03: sequential step determination
  let sequentialStep: FeatSlotKind | null = null;

  if (featSlots.classBonusFeatSlot && selectedClassFeatId === null) {
    sequentialStep = 'class-bonus';
  } else if (generalSlotCount > selectedGeneralFeatIds.length) {
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
    classFeatIds: lvl.classFeatId ? [lvl.classFeatId] : [],
    generalFeatIds: getGeneralFeatIds(lvl),
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
    if (isPuertaAdminLabel(feat.label)) continue;

    const inClassBonusPool = classBonusFeatIds.has(feat.id);
    const inGeneralPool =
      feat.allClassesCanUse || generalListZeroFeatIds.has(feat.id);
    if (!inClassBonusPool && !inGeneralPool) continue;

    const isChosenAtLevel =
      selectedClassFeatId === feat.id || selectedGeneralFeatIds.includes(feat.id);
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
        feat.id === selectedClassFeatId || selectedGeneralFeatIds.includes(feat.id),
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
    hasGeneralSlot: generalSlotCount > 0,
    generalSlotCount,
    level: activeLevel,
    selectedClassFeatId,
    selectedGeneralFeatIds,
    selectedGeneralFeatId,
    slotPrompt: computeSlotPrompt(
      featSlots,
      selectedClassFeatId,
      selectedGeneralFeatIds,
      generalSlotCount,
    ),
    status: activeRevalidated?.status ?? 'pending',
    title: shellCopyEs.stepper.stepTitles.feats,
  };

  // Phase 12.4-07 (D-04) — chosen feats at the active level, for the
  // FeatSummaryCard collapse view.
  //
  // Phase 12.8-03 (D-06, UAT-2026-04-23 F4) — project per-slot so each chip
  // carries its own (slotKind, slotIndex) clear-target. Order: class-bonus
  // first, then general primary (slotIndex=0), then bonus-general slots
  // (1..N). Walks the store record directly (not the flattened chosenIds)
  // so each chip's clear-action dispatch is unambiguous.
  const chosenFeats: FeatSummaryChosenEntry[] = [];
  const findLabel = (id: string): string => {
    const feat = compiledFeatCatalog.feats.find((f) => f.id === id);
    return feat?.label ?? id;
  };
  if (activeFeatRecord?.classFeatId) {
    chosenFeats.push({
      featId: activeFeatRecord.classFeatId,
      label: findLabel(activeFeatRecord.classFeatId),
      slotKind: 'class-bonus',
      slotIndex: 0,
    });
  }
  if (activeFeatRecord?.generalFeatId) {
    chosenFeats.push({
      featId: activeFeatRecord.generalFeatId,
      label: findLabel(activeFeatRecord.generalFeatId),
      slotKind: 'general',
      slotIndex: 0,
    });
  }
  (activeFeatRecord?.bonusGeneralFeatIds ?? []).forEach((id, idx) => {
    chosenFeats.push({
      featId: id,
      label: findLabel(id),
      slotKind: 'general',
      slotIndex: idx + 1,
    });
  });

  // Slot counter reads budget.featSlots (authoritative; includes raceBonus).
  // `chosen` matches what the store actually holds (class + general at this
  // level) so collapse-on-complete triggers correctly for non-Humano and
  // for Humano when all store-addressable slots are filled.
  const counters: FeatBoardCounters = {
    chosen: chosenFeats.length,
    slots: budget.featSlots.total,
  };

  // Phase 12.4-08 — family fold for each pool. The main Dotes list renders
  // entries instead of flat FeatOptionView arrays. See FeatSheet consumer.
  const classBonusEntries = groupIntoFamilyEntries(classBonusOptions);
  const generalEntries = groupIntoFamilyEntries(generalOptions);

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
    slotStatuses: buildSlotStatuses({
      hasClassBonusSlot: featSlots.classBonusFeatSlot,
      generalSlotCount,
      selectedClassFeatId,
      selectedGeneralFeatIds,
      sequentialStep,
    }),
    classBonusEntries,
    generalEntries,
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
    for (const [index, generalFeatId] of getGeneralFeatIds(levelRecord).entries()) {
      const feat = compiledFeatCatalog.feats.find(
        (f) => f.id === generalFeatId,
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
        featId: generalFeatId,
        label: feat?.label ?? generalFeatId,
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
      getChosenFeatIds(record).length > 0
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
    classFeatIds: lvl.classFeatId ? [lvl.classFeatId] : [],
    generalFeatIds: getGeneralFeatIds(lvl),
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
