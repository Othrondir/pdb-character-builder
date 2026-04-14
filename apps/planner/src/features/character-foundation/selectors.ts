import type { ValidationOutcome } from '@rules-engine/contracts/validation-outcome';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';
import { calculateAbilityBudgetSnapshot } from '@rules-engine/foundation/ability-budget';
import {
  evaluateOriginSelection,
  getAllowedSubraces,
} from '@rules-engine/foundation/origin-rules';
import { shellCopyEs } from '@planner/lib/copy/es';

import {
  phase03FoundationFixture,
  type FoundationStatus,
} from './foundation-fixture';
import type { CharacterFoundationStoreState } from './store';

type FoundationControlKey =
  | 'alignment'
  | 'attributes'
  | 'deity'
  | 'race'
  | 'subrace';

export interface FoundationOptionView {
  blocked: boolean;
  disabled: boolean;
  id: CanonicalId;
  label: string;
  selected: boolean;
}

export interface FoundationValidationView {
  controlMessages: Record<FoundationControlKey, string | null>;
  controlStatuses: Record<FoundationControlKey, FoundationStatus | null>;
  summaryStatus: FoundationStatus;
}

export interface FoundationSummaryView {
  characterLabel: string;
  datasetId: string;
  planState: string;
  selectedAlignmentLabel: string | null;
  selectedDeityLabel: string | null;
  selectedRaceLabel: string | null;
  selectedSubraceLabel: string | null;
  summaryStatus: FoundationStatus;
}

function findAlignment(alignmentId: CanonicalId | null) {
  if (!alignmentId) {
    return null;
  }

  return (
    phase03FoundationFixture.alignments.find(
      (alignment) => alignment.id === alignmentId,
    ) ?? null
  );
}

function findDeity(deityId: CanonicalId | null) {
  if (!deityId) {
    return null;
  }

  return (
    phase03FoundationFixture.deities.find((deity) => deity.id === deityId) ?? null
  );
}

function findRace(raceId: CanonicalId | null) {
  if (!raceId) {
    return null;
  }

  return phase03FoundationFixture.races.find((race) => race.id === raceId) ?? null;
}

function findSubrace(subraceId: CanonicalId | null) {
  if (!subraceId) {
    return null;
  }

  return (
    phase03FoundationFixture.subraces.find(
      (subrace) => subrace.id === subraceId,
    ) ?? null
  );
}

function pickMostSevereStatus(
  ...statuses: Array<FoundationStatus | null | undefined>
): FoundationStatus {
  if (statuses.includes('illegal')) {
    return 'illegal';
  }

  if (statuses.includes('blocked')) {
    return 'blocked';
  }

  return 'legal';
}

function getControlStatus(
  selectedId: CanonicalId | null,
  issues: ValidationOutcome[],
): FoundationStatus | null {
  if (!selectedId) {
    return null;
  }

  const matchingStatuses = issues
    .filter((issue) => issue.affectedIds.includes(selectedId))
    .map((issue) => issue.status as FoundationStatus);

  if (matchingStatuses.length === 0) {
    return null;
  }

  return pickMostSevereStatus(...matchingStatuses);
}

function getLabelById(id: string | null): string | null {
  if (!id) {
    return null;
  }

  const option =
    phase03FoundationFixture.races.find((race) => race.id === id) ??
    phase03FoundationFixture.subraces.find((subrace) => subrace.id === id) ??
    phase03FoundationFixture.alignments.find((alignment) => alignment.id === id) ??
    phase03FoundationFixture.deities.find((deity) => deity.id === id);

  return option?.label ?? null;
}

function createOriginEvaluation(state: CharacterFoundationStoreState) {
  return evaluateOriginSelection({
    alignmentId: state.alignmentId,
    alignments: phase03FoundationFixture.alignments,
    deityId: state.deityId,
    deities: phase03FoundationFixture.deities,
    raceId: state.raceId,
    races: phase03FoundationFixture.races,
    subraceId: state.subraceId,
    subraces: phase03FoundationFixture.subraces,
  });
}

export function selectOriginOptions(state: CharacterFoundationStoreState) {
  const selectedAlignment = findAlignment(state.alignmentId);
  const selectedDeity = findDeity(state.deityId);
  const selectedRace = findRace(state.raceId);
  const selectedSubrace = findSubrace(state.subraceId);
  const subraceLocked = state.raceId === null;
  const alignmentLocked = state.raceId === null;
  const deityLocked = state.alignmentId === null;
  const visibleSubraceIds = new Set(
    getAllowedSubraces({
      alignmentId: state.alignmentId,
      alignments: phase03FoundationFixture.alignments,
      deityId: state.deityId,
      deities: phase03FoundationFixture.deities,
      raceId: state.raceId,
      races: phase03FoundationFixture.races,
      subraceId: state.subraceId,
      subraces: phase03FoundationFixture.subraces,
    }).map((subrace) => subrace.id),
  );
  const visibleSubraces = phase03FoundationFixture.subraces.filter((subrace) =>
    visibleSubraceIds.has(subrace.id),
  );

  return {
    alignments: phase03FoundationFixture.alignments.map((alignment) => ({
      blocked:
        !alignmentLocked &&
        ((selectedRace !== null &&
          !selectedRace.allowedAlignmentIds.includes(alignment.id)) ||
          (selectedSubrace !== null &&
            !selectedSubrace.allowedAlignmentIds.includes(alignment.id)) ||
          (selectedDeity !== null &&
            selectedDeity.id !== 'deity:none' &&
            !selectedDeity.allowedAlignmentIds.includes(alignment.id))),
      disabled: alignmentLocked,
      id: alignment.id,
      label: alignment.label,
      selected: alignment.id === state.alignmentId,
    })),
    deities: phase03FoundationFixture.deities.map((deity) => ({
      blocked:
        !deityLocked &&
        ((deity.id === 'deity:none' &&
          selectedRace?.deityPolicy === 'required') ||
          (selectedAlignment !== null &&
            deity.id !== 'deity:none' &&
            !deity.allowedAlignmentIds.includes(selectedAlignment.id))),
      disabled: deityLocked,
      id: deity.id,
      label: deity.label,
      selected: deity.id === state.deityId,
    })),
    locks: {
      alignment: alignmentLocked,
      deity: deityLocked,
      subrace: subraceLocked,
    },
    races: phase03FoundationFixture.races.map((race) => ({
      blocked:
        (selectedSubrace !== null && selectedSubrace.parentRaceId !== race.id) ||
        (selectedAlignment !== null &&
          !race.allowedAlignmentIds.includes(selectedAlignment.id)) ||
        (selectedDeity?.id === 'deity:none' && race.deityPolicy === 'required'),
      disabled: false,
      id: race.id,
      label: race.label,
      selected: race.id === state.raceId,
    })),
    subraces: visibleSubraces.map((subrace) => ({
      blocked:
        !subraceLocked &&
        selectedAlignment !== null &&
        !subrace.allowedAlignmentIds.includes(selectedAlignment.id),
      disabled: subraceLocked,
      id: subrace.id,
      label: subrace.label,
      selected: subrace.id === state.subraceId,
    })),
  } satisfies {
    alignments: FoundationOptionView[];
    deities: FoundationOptionView[];
    locks: Record<'alignment' | 'deity' | 'subrace', boolean>;
    races: FoundationOptionView[];
    subraces: FoundationOptionView[];
  };
}

export function selectOriginReadyForAbilities(
  state: CharacterFoundationStoreState,
): boolean {
  return createOriginEvaluation(state).summaryStatus === 'legal';
}

export function selectAttributeBudgetSnapshot(
  state: CharacterFoundationStoreState,
) {
  return calculateAbilityBudgetSnapshot({
    attributeRules: phase03FoundationFixture.attributeRules,
    baseAttributes: state.baseAttributes,
    originReady: selectOriginReadyForAbilities(state),
  });
}

export function selectFoundationValidation(
  state: CharacterFoundationStoreState,
): FoundationValidationView {
  const originEvaluation = createOriginEvaluation(state);
  const attributeSnapshot = selectAttributeBudgetSnapshot(state);
  const raceStatus = getControlStatus(state.raceId, originEvaluation.issues);
  const subraceStatus = getControlStatus(state.subraceId, originEvaluation.issues);
  const alignmentStatus = getControlStatus(
    state.alignmentId,
    originEvaluation.issues,
  );
  const deityStatus = getControlStatus(state.deityId, originEvaluation.issues);
  const attributesStatus =
    attributeSnapshot.status === 'legal'
      ? null
      : (attributeSnapshot.status as FoundationStatus);
  const controlStatuses = {
    alignment: alignmentStatus,
    attributes: attributesStatus,
    deity: deityStatus,
    race: raceStatus,
    subrace: subraceStatus,
  } satisfies Record<FoundationControlKey, FoundationStatus | null>;

  return {
    controlMessages: {
      alignment: alignmentStatus ? shellCopyEs.foundation.blockedChoice : null,
      attributes: attributesStatus ? shellCopyEs.foundation.blockedChoice : null,
      deity: deityStatus ? shellCopyEs.foundation.blockedChoice : null,
      race: raceStatus ? shellCopyEs.foundation.blockedChoice : null,
      subrace: subraceStatus ? shellCopyEs.foundation.blockedChoice : null,
    },
    controlStatuses,
    summaryStatus: pickMostSevereStatus(
      originEvaluation.summaryStatus,
      attributeSnapshot.status as FoundationStatus,
    ),
  };
}

export function selectFoundationSummary(
  state: CharacterFoundationStoreState,
): FoundationSummaryView {
  const selectedRaceLabel = getLabelById(state.raceId);
  const selectedSubraceLabel = getLabelById(state.subraceId);
  const selectedAlignmentLabel = getLabelById(state.alignmentId);
  const selectedDeityLabel = getLabelById(state.deityId);
  const validation = selectFoundationValidation(state);
  const characterParts = [
    selectedRaceLabel,
    selectedSubraceLabel,
    selectedAlignmentLabel,
    selectedDeityLabel,
  ].filter((part): part is string => Boolean(part));

  return {
    characterLabel:
      characterParts.join(' · ') || shellCopyEs.summaryValues.character,
    datasetId: state.datasetId,
    planState:
      validation.summaryStatus === 'legal'
        ? shellCopyEs.foundation.planStates.ready
        : validation.summaryStatus === 'illegal'
          ? shellCopyEs.foundation.planStates.invalid
          : shellCopyEs.foundation.planStates.blocked,
    selectedAlignmentLabel,
    selectedDeityLabel,
    selectedRaceLabel,
    selectedSubraceLabel,
    summaryStatus: validation.summaryStatus,
  };
}
