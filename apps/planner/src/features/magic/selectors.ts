import type { CanonicalId } from '@rules-engine/contracts/canonical-id';
import type { ValidationOutcome } from '@rules-engine/contracts/validation-outcome';
import {
  computeFortSave,
  computeTotalBab,
} from '@rules-engine/feats/bab-calculator';
import type { BuildStateAtLevel } from '@rules-engine/feats/feat-prerequisite';
import {
  computeCasterLevelByClass,
  computeSpellSlots,
} from '@rules-engine/magic/caster-level';
import { getEligibleSpellsAtLevel } from '@rules-engine/magic/spell-eligibility';
import { evaluateSpellPrerequisites } from '@rules-engine/magic/spell-prerequisite';
import {
  MAX_DOMAINS_PER_CLERIC,
  evaluateDomainSelection,
} from '@rules-engine/magic/domain-rules';
import {
  detectMissingDomainData,
  detectMissingSpellData,
} from '@rules-engine/magic/catalog-fail-closed';
import {
  revalidateMagicSnapshotAfterChange,
  type MagicEvaluationStatus,
  type MagicLevelInput,
} from '@rules-engine/magic/magic-revalidation';

import type { CharacterFoundationStoreState } from '@planner/features/character-foundation/store';
import type { LevelProgressionStoreState } from '@planner/features/level-progression/store';
import type { ProgressionLevel } from '@planner/features/level-progression/progression-fixture';
import type { SkillStoreState } from '@planner/features/skills/store';
import type { FeatStoreState } from '@planner/features/feats/store';
import { compiledFeatCatalog } from '@planner/features/feats/compiled-feat-catalog';

import {
  compiledClassCatalog,
  compiledDomainCatalog,
  compiledSpellCatalog,
} from './compiled-magic-catalog';
import type { MagicLevelRecord, MagicStoreState } from './store';

// ---------------------------------------------------------------------------
// Re-exports (consumers can import MAX_DOMAINS_PER_CLERIC from this module)
// ---------------------------------------------------------------------------

export { MAX_DOMAINS_PER_CLERIC } from '@rules-engine/magic/domain-rules';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Spanish school labels for D&D 3.5 spell schools (NWN1 EE subset). Unknown schools
 * fall through to 'Desconocida' so UI never leaks the raw english label.
 */
export const SCHOOL_LABELS_ES: Record<string, string> = {
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

export type MagicParadigm =
  | 'domains'
  | 'spellbook'
  | 'known'
  | 'prepared-summary'
  | 'empty';

/** Sorcerer spell-swap cadence per D-15. */
const SORCERER_SWAP_LEVELS = new Set<number>([4, 8, 12, 16]);
/** Bard spell-swap cadence per D-15. */
const BARD_SWAP_LEVELS = new Set<number>([5, 8, 11, 14]);

const STATUS_ORDER: Record<MagicEvaluationStatus, number> = {
  illegal: 0,
  blocked: 1,
  pending: 2,
  legal: 3,
};

// ---------------------------------------------------------------------------
// View-model interfaces
// ---------------------------------------------------------------------------

export interface SpellOptionView {
  blocked: boolean;
  blockReason: string | null;
  description: string;
  label: string;
  missingData: boolean;
  schoolLabel: string;
  selected: boolean;
  spellId: CanonicalId;
}

export interface DomainOptionView {
  blocked: boolean;
  blockReason: string | null;
  bonusSpellLabels: Record<number, string[]>;
  description: string;
  domainId: CanonicalId;
  grantedFeatLabels: string[];
  label: string;
  missingData: boolean;
  selected: boolean;
}

export interface SlotStatus {
  current: number;
  max: number;
  status: 'legal' | 'repair_needed' | 'illegal';
}

export interface ActiveMagicSheetView {
  activeSpellLevel: number;
  classId: CanonicalId | null;
  classLabel: string | null;
  eligibleDomains: DomainOptionView[];
  eligibleSpells: SpellOptionView[];
  emptyMessage: string;
  level: ProgressionLevel;
  paradigm: MagicParadigm;
  selectedDomains: DomainOptionView[];
  selectedSpells: SpellOptionView[];
  slotsByLevel: Record<number, SlotStatus>;
  status: MagicEvaluationStatus;
  swapAvailable: boolean;
  title: string;
}

export interface MagicBoardView {
  activeSheet: ActiveMagicSheetView;
  emptyStateBody: string | null;
}

export interface MagicSummaryView {
  blockedLevels: number[];
  highestConfiguredLevel: number;
  planState: string;
  summaryStatus: MagicEvaluationStatus;
}

// ---------------------------------------------------------------------------
// Helper: compute BuildStateAtLevel for magic (pass 1 — derives caster levels)
// ---------------------------------------------------------------------------

/**
 * Compute a BuildStateAtLevel suitable for magic prerequisite evaluation at the
 * given level. Honors 07-RESEARCH Pitfall 4 fixed compute order: ability scores
 * -> class levels -> BAB/Fort -> skills -> feats (strictly < level, Pitfall 2)
 * -> casterLevelByClass (from classLevels).
 */
export function computeMagicBuildStateAtLevel(
  level: ProgressionLevel,
  foundationState: CharacterFoundationStoreState,
  progressionState: LevelProgressionStoreState,
  skillState: SkillStoreState,
  featState: FeatStoreState,
): BuildStateAtLevel {
  const abilityScores: Record<string, number> = {
    ...foundationState.baseAttributes,
  };
  const classLevels: Record<string, number> = {};

  for (const rec of progressionState.levels) {
    if (rec.level > level) continue;

    if (rec.abilityIncrease) {
      abilityScores[rec.abilityIncrease] =
        (abilityScores[rec.abilityIncrease] ?? 0) + 1;
    }

    if (rec.classId) {
      classLevels[rec.classId] = (classLevels[rec.classId] ?? 0) + 1;
    }
  }

  const bab = computeTotalBab(classLevels, compiledClassCatalog);
  const fortitudeSave = computeFortSave(classLevels, compiledClassCatalog);

  const skillRanks: Record<string, number> = {};
  for (const skillLevel of skillState.levels) {
    if (skillLevel.level <= level) {
      for (const alloc of skillLevel.allocations) {
        skillRanks[alloc.skillId] =
          (skillRanks[alloc.skillId] ?? 0) + alloc.rank;
      }
    }
  }

  const selectedFeatIds = new Set<string>();
  for (const featLevel of featState.levels) {
    // Pitfall 2: feats at current level are not yet "selected" when evaluating
    // this level's magic prereqs — they pass down to feat-eligibility pass only.
    if (featLevel.level < level) {
      if (featLevel.classFeatId) selectedFeatIds.add(featLevel.classFeatId);
      if (featLevel.generalFeatId) selectedFeatIds.add(featLevel.generalFeatId);
    }
  }

  const casterLevelByClass = computeCasterLevelByClass(
    classLevels,
    compiledClassCatalog,
  );

  return {
    abilityScores,
    bab,
    casterLevelByClass,
    characterLevel: level,
    classLevels,
    fortitudeSave,
    selectedFeatIds,
    skillRanks,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function getActiveClassAtLevel(
  level: ProgressionLevel,
  progressionState: LevelProgressionStoreState,
): CanonicalId | null {
  const rec = progressionState.levels.find((r) => r.level === level);
  return rec?.classId ?? null;
}

/**
 * D-02 filter helper. Returns `true` when the class assigned at `level` has
 * the `spellCaster` flag in the compiled class catalog (or has no class yet —
 * callers interpret missing class as "don't hide the step until a class is
 * selected"). Paladins and Rangers remain casters by catalog flag even though
 * they do not gain slots until class-level 4; the magia sub-step still shows
 * a summary for them per D-04.
 */
export function classHasCastingAtLevel(
  level: number,
  progressionState: LevelProgressionStoreState,
): boolean {
  const rec = progressionState.levels.find((r) => r.level === level);
  if (!rec || !rec.classId) return false;
  const classDef = compiledClassCatalog.classes.find(
    (c) => c.id === rec.classId,
  );
  return Boolean(classDef?.spellCaster);
}

function dispatchParadigm(
  classId: CanonicalId | null,
  characterLevel: ProgressionLevel,
): MagicParadigm {
  if (!classId) return 'empty';

  switch (classId) {
    case 'class:cleric':
      return characterLevel === 1 ? 'domains' : 'prepared-summary';
    case 'class:wizard':
      return 'spellbook';
    case 'class:sorcerer':
    case 'class:bard':
      return 'known';
    case 'class:druid':
    case 'class:paladin':
    case 'class:ranger':
      return 'prepared-summary';
    default:
      return 'empty';
  }
}

function isSwapLevel(
  classId: CanonicalId | null,
  level: ProgressionLevel,
): boolean {
  if (classId === 'class:sorcerer') return SORCERER_SWAP_LEVELS.has(level);
  if (classId === 'class:bard') return BARD_SWAP_LEVELS.has(level);
  return false;
}

function buildSlotsByLevel(
  classId: CanonicalId | null,
  casterLevelByClass: Record<string, number>,
  selectedCounts: Record<number, number>,
): Record<number, SlotStatus> {
  const out: Record<number, SlotStatus> = {};
  if (!classId) return out;

  const casterLevel = casterLevelByClass[classId] ?? 0;
  if (casterLevel < 1) return out;

  for (let spellLevel = 0; spellLevel <= 9; spellLevel++) {
    const max = computeSpellSlots(
      classId,
      casterLevel,
      spellLevel,
      compiledSpellCatalog,
    );
    const current = selectedCounts[spellLevel] ?? 0;
    const status: SlotStatus['status'] =
      current > max ? 'repair_needed' : 'legal';
    out[spellLevel] = { current, max, status };
  }

  return out;
}

function getSpellLabel(spellId: string): string {
  return (
    compiledSpellCatalog.spells.find((s) => s.id === spellId)?.label ?? spellId
  );
}

function getFeatLabel(featId: string): string {
  return (
    compiledFeatCatalog.feats.find((f) => f.id === featId)?.label ?? featId
  );
}

function mapSpellToOptionView(
  spellId: string,
  buildState: BuildStateAtLevel,
  selectedIds: ReadonlySet<string>,
  slotOverflow: boolean,
): SpellOptionView | null {
  const sp = compiledSpellCatalog.spells.find((s) => s.id === spellId);
  if (!sp) return null;

  const missing = detectMissingSpellData(sp.id, compiledSpellCatalog) !== null;
  const prereq = evaluateSpellPrerequisites(sp, buildState, compiledSpellCatalog);
  const isSelected = selectedIds.has(sp.id);

  const blockReason = !prereq.met
    ? prereq.checks
        .filter((c) => !c.met)
        .map((c) => `${c.label} ${c.required}`)
        .join(', ')
    : slotOverflow && !isSelected
      ? 'Ranura agotada'
      : null;

  return {
    blocked: !prereq.met || (!isSelected && slotOverflow),
    blockReason,
    description: sp.description,
    label: sp.label,
    missingData: missing,
    schoolLabel: SCHOOL_LABELS_ES[sp.school] ?? SCHOOL_LABELS_ES.unknown,
    selected: isSelected,
    spellId: sp.id as CanonicalId,
  };
}

// ---------------------------------------------------------------------------
// Selector: selectMagicBoardView
// ---------------------------------------------------------------------------

export function selectMagicBoardView(
  magicState: MagicStoreState,
  featState: FeatStoreState,
  skillState: SkillStoreState,
  progressionState: LevelProgressionStoreState,
  foundationState: CharacterFoundationStoreState,
): MagicBoardView {
  const activeLevel = magicState.activeLevel;

  // Empty-progression guard: no class yet -> magic is still locked.
  const progressionHasClass = progressionState.levels.some(
    (lvl) => lvl.classId !== null,
  );

  if (!progressionHasClass) {
    const emptySheet: ActiveMagicSheetView = {
      activeSpellLevel: 0,
      classId: null,
      classLabel: null,
      eligibleDomains: [],
      eligibleSpells: [],
      emptyMessage: '',
      level: activeLevel,
      paradigm: 'empty',
      selectedDomains: [],
      selectedSpells: [],
      slotsByLevel: {},
      status: 'pending',
      swapAvailable: false,
      title: '',
    };

    return {
      activeSheet: emptySheet,
      // Plan 07-03 replaces this sentinel with shellCopyEs.magic.emptyStateBody.
      emptyStateBody: 'La magia sigue bloqueada',
    };
  }

  const classId = getActiveClassAtLevel(activeLevel, progressionState);
  const paradigm = dispatchParadigm(classId, activeLevel);
  const buildState = computeMagicBuildStateAtLevel(
    activeLevel,
    foundationState,
    progressionState,
    skillState,
    featState,
  );

  // Run snapshot revalidation so `status` reflects the full cascade.
  const revalidationInput: MagicLevelInput[] = magicState.levels.map((lvl) => ({
    buildState: computeMagicBuildStateAtLevel(
      lvl.level as ProgressionLevel,
      foundationState,
      progressionState,
      skillState,
      featState,
    ),
    domainsSelected: lvl.domains,
    knownSpells: lvl.knownSpells,
    level: lvl.level,
    spellbookAdditions: lvl.spellbookAdditions,
    swapsApplied: lvl.swapsApplied,
  }));
  const revalidated = revalidateMagicSnapshotAfterChange({
    domainCatalog: compiledDomainCatalog,
    levels: revalidationInput,
    spellCatalog: compiledSpellCatalog,
  });
  const activeRev = revalidated.find((r) => r.level === activeLevel) ?? {
    inheritedFromLevel: null,
    issues: [] as ValidationOutcome[],
    level: activeLevel,
    status: 'pending' as MagicEvaluationStatus,
  };

  const activeRecord =
    magicState.levels.find((r) => r.level === activeLevel) ??
    ({
      domains: [],
      knownSpells: {},
      level: activeLevel,
      spellbookAdditions: {},
      swapsApplied: [],
    } as MagicLevelRecord);

  const classDef = classId
    ? compiledClassCatalog.classes.find((c) => c.id === classId)
    : null;
  const classLabel = classDef?.label ?? null;

  // Choose activeSpellLevel: lowest spell level with max > 0, else 0.
  let activeSpellLevel = 0;
  if ((paradigm === 'spellbook' || paradigm === 'known') && classId) {
    const casterLevel = buildState.casterLevelByClass[classId] ?? 0;
    for (let sl = 0; sl <= 9; sl++) {
      if (
        computeSpellSlots(classId, casterLevel, sl, compiledSpellCatalog) > 0
      ) {
        activeSpellLevel = sl;
        break;
      }
    }
  }

  // slotsByLevel with current counts per paradigm.
  const selectedCounts: Record<number, number> = {};
  if (paradigm === 'spellbook') {
    for (const [sl, list] of Object.entries(activeRecord.spellbookAdditions)) {
      selectedCounts[Number(sl)] = list.length;
    }
  } else if (paradigm === 'known') {
    for (const [sl, list] of Object.entries(activeRecord.knownSpells)) {
      selectedCounts[Number(sl)] = list.length;
    }
  }
  const slotsByLevel = buildSlotsByLevel(
    classId,
    buildState.casterLevelByClass,
    selectedCounts,
  );

  // Spells (spellbook / known paradigms)
  let eligibleSpells: SpellOptionView[] = [];
  let selectedSpells: SpellOptionView[] = [];

  if ((paradigm === 'spellbook' || paradigm === 'known') && classId) {
    const casterLevel = buildState.casterLevelByClass[classId] ?? 0;
    const alreadyKnownSet = new Set<string>();

    if (paradigm === 'spellbook') {
      for (const list of Object.values(activeRecord.spellbookAdditions)) {
        for (const id of list) alreadyKnownSet.add(id);
      }
    } else {
      for (const list of Object.values(activeRecord.knownSpells)) {
        for (const id of list) alreadyKnownSet.add(id);
      }
    }

    const elig = getEligibleSpellsAtLevel({
      alreadyKnown: alreadyKnownSet,
      casterLevel,
      catalog: compiledSpellCatalog,
      classId,
      spellLevel: activeSpellLevel,
    });

    const selectedIdsAtLevel = new Set<string>(
      paradigm === 'spellbook'
        ? (activeRecord.spellbookAdditions[activeSpellLevel] ?? [])
        : (activeRecord.knownSpells[activeSpellLevel] ?? []),
    );

    const slotOverflow =
      slotsByLevel[activeSpellLevel]?.status === 'repair_needed';

    eligibleSpells = elig.eligible
      .map((sp) =>
        mapSpellToOptionView(
          sp.id,
          buildState,
          selectedIdsAtLevel,
          slotOverflow,
        ),
      )
      .filter((x): x is SpellOptionView => x !== null);

    const allSelectedAtLevel =
      paradigm === 'spellbook'
        ? Object.values(activeRecord.spellbookAdditions).flat()
        : Object.values(activeRecord.knownSpells).flat();

    const allSelectedSet = new Set<string>(allSelectedAtLevel);
    selectedSpells = allSelectedAtLevel
      .map((id) => mapSpellToOptionView(id, buildState, allSelectedSet, false))
      .filter((x): x is SpellOptionView => x !== null);
  }

  // Domains (cleric L1 paradigm only)
  let eligibleDomains: DomainOptionView[] = [];
  let selectedDomains: DomainOptionView[] = [];

  if (paradigm === 'domains') {
    const selectedDomainIds = new Set<string>(activeRecord.domains);
    const capReached =
      activeRecord.domains.length >= MAX_DOMAINS_PER_CLERIC;

    eligibleDomains = compiledDomainCatalog.domains.map((d) => {
      const missing =
        detectMissingDomainData(d.id, compiledDomainCatalog) !== null;
      const siblings = activeRecord.domains.filter((x) => x !== d.id);
      const result = evaluateDomainSelection(
        d.id,
        siblings,
        buildState,
        compiledDomainCatalog,
      );
      const isSelected = selectedDomainIds.has(d.id);

      const grantedFeatLabels = d.grantedFeatIds.map((fid) => getFeatLabel(fid));

      const bonusSpellLabels: Record<number, string[]> = {};
      for (const [sl, spellIds] of Object.entries(d.spellIds)) {
        bonusSpellLabels[Number(sl)] = (spellIds ?? []).map((sid) =>
          getSpellLabel(sid),
        );
      }

      const blockReason =
        !result.met && !isSelected
          ? capReached
            ? `Máximo ${MAX_DOMAINS_PER_CLERIC} dominios`
            : result.checks
                .filter((c) => !c.met)
                .map((c) => c.label)
                .join(', ')
          : null;

      return {
        blocked: !result.met && !isSelected,
        blockReason,
        bonusSpellLabels,
        description: d.description,
        domainId: d.id as CanonicalId,
        grantedFeatLabels,
        label: d.label,
        missingData: missing,
        selected: isSelected,
      };
    });

    selectedDomains = eligibleDomains.filter((d) => d.selected);
  }

  const activeSheet: ActiveMagicSheetView = {
    activeSpellLevel,
    classId,
    classLabel,
    eligibleDomains,
    eligibleSpells,
    emptyMessage: '',
    level: activeLevel,
    paradigm,
    selectedDomains,
    selectedSpells,
    slotsByLevel,
    status: activeRev.status,
    swapAvailable: isSwapLevel(classId, activeLevel),
    title: '',
  };

  return {
    activeSheet,
    emptyStateBody: null,
  };
}

// ---------------------------------------------------------------------------
// Selector: selectMagicSheetTabView
// ---------------------------------------------------------------------------

export interface MagicSheetTabRow {
  label: string;
  slot: 'spellbook' | 'known' | 'del-dominio' | 'auto';
  spellId: string;
  status: MagicEvaluationStatus;
  statusReason: string | null;
}

export interface MagicSheetTabGroup {
  heading: string;
  level: number;
  spells: MagicSheetTabRow[];
}

export interface MagicSheetTabView {
  groups: MagicSheetTabGroup[];
  invalidCount: number;
  totalCount: number;
}

export function selectMagicSheetTabView(
  magicState: MagicStoreState,
  featState: FeatStoreState,
  skillState: SkillStoreState,
  progressionState: LevelProgressionStoreState,
  foundationState: CharacterFoundationStoreState,
): MagicSheetTabView {
  const groups: MagicSheetTabGroup[] = [];
  let totalCount = 0;
  let invalidCount = 0;

  for (const lvl of magicState.levels) {
    const classId = getActiveClassAtLevel(
      lvl.level as ProgressionLevel,
      progressionState,
    );
    if (!classId) continue;

    const classDef = compiledClassCatalog.classes.find((c) => c.id === classId);
    if (!classDef?.spellCaster) continue;

    const buildState = computeMagicBuildStateAtLevel(
      lvl.level as ProgressionLevel,
      foundationState,
      progressionState,
      skillState,
      featState,
    );
    const casterLevel = buildState.casterLevelByClass[classId] ?? 0;
    if (casterLevel < 1) continue;

    const spells: MagicSheetTabRow[] = [];

    for (const list of Object.values(lvl.spellbookAdditions)) {
      for (const spellId of list) {
        spells.push({
          label: getSpellLabel(spellId),
          slot: 'spellbook',
          spellId,
          status: 'legal',
          statusReason: null,
        });
        totalCount++;
      }
    }

    for (const list of Object.values(lvl.knownSpells)) {
      for (const spellId of list) {
        spells.push({
          label: getSpellLabel(spellId),
          slot: 'known',
          spellId,
          status: 'legal',
          statusReason: null,
        });
        totalCount++;
      }
    }

    if (spells.length > 0) {
      groups.push({
        heading: `${classDef.label} - Nivel de lanzador ${casterLevel}`,
        level: lvl.level,
        spells,
      });
    }
  }

  return { groups, invalidCount, totalCount };
}

// ---------------------------------------------------------------------------
// Selector: selectMagicSummary
// ---------------------------------------------------------------------------

export function selectMagicSummary(
  magicState: MagicStoreState,
  featState: FeatStoreState,
  skillState: SkillStoreState,
  progressionState: LevelProgressionStoreState,
  foundationState: CharacterFoundationStoreState,
): MagicSummaryView {
  const revalInput: MagicLevelInput[] = magicState.levels.map((lvl) => ({
    buildState: computeMagicBuildStateAtLevel(
      lvl.level as ProgressionLevel,
      foundationState,
      progressionState,
      skillState,
      featState,
    ),
    domainsSelected: lvl.domains,
    knownSpells: lvl.knownSpells,
    level: lvl.level,
    spellbookAdditions: lvl.spellbookAdditions,
    swapsApplied: lvl.swapsApplied,
  }));

  const rev = revalidateMagicSnapshotAfterChange({
    domainCatalog: compiledDomainCatalog,
    levels: revalInput,
    spellCatalog: compiledSpellCatalog,
  });

  const blockedLevels = rev
    .filter((r) => r.status === 'blocked' || r.status === 'illegal')
    .map((r) => r.level);

  const highestConfiguredLevel = magicState.levels
    .filter(
      (lvl) =>
        lvl.domains.length > 0 ||
        Object.values(lvl.spellbookAdditions).some((l) => l.length > 0) ||
        Object.values(lvl.knownSpells).some((l) => l.length > 0),
    )
    .reduce((max, lvl) => Math.max(max, lvl.level), 0);

  // Worst status wins (illegal < blocked < pending < legal).
  const summaryStatus: MagicEvaluationStatus = rev.reduce<MagicEvaluationStatus>(
    (worst, r) =>
      STATUS_ORDER[r.status] < STATUS_ORDER[worst] ? r.status : worst,
    'legal',
  );

  const planState =
    highestConfiguredLevel === 0
      ? 'empty'
      : summaryStatus === 'illegal' || summaryStatus === 'blocked'
        ? 'repair'
        : summaryStatus === 'pending'
          ? 'inProgress'
          : 'ready';

  return {
    blockedLevels,
    highestConfiguredLevel,
    planState,
    summaryStatus,
  };
}
