import { shellCopyEs } from '@planner/lib/copy/es';
import { originSteps } from '@planner/lib/sections';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import {
  selectOriginReadyForAbilities,
  selectAttributeBudgetSnapshot,
} from '@planner/features/character-foundation/selectors';
import { phase03FoundationFixture } from '@planner/features/character-foundation/foundation-fixture';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import { NwnFrame } from '@planner/components/ui/nwn-frame';
import { NwnButton } from '@planner/components/ui/nwn-button';
import { StepperStep } from './stepper-step';
import type { StepperStepStatus } from './stepper-step';
import { LevelSubSteps } from './level-sub-steps';
import { LevelEditorActionBar } from '@planner/features/level-progression/level-editor-action-bar';
import type { OriginStep } from '@planner/lib/sections';

/**
 * Phase 12.3-05 (UAT B7) — each origin-step branch reads ONLY the narrow
 * foundation-store fields it needs.
 *
 * Before: this hook subscribed to the entire foundation store and composed
 * `selectFoundationSummary(foundationState)` for labels, which pulled in
 * `selectFoundationValidation` and `selectAttributeBudgetSnapshot` on every
 * render. That created a wide dependency surface where any future
 * regression in the composed summary (e.g. nulling labels under non-legal
 * status) would have silently collapsed the Raza + Alineamiento rail
 * checkmarks and summary text under overspent point-buy.
 *
 * After: Raza and Alineamiento branches subscribe only to `raceId` and
 * `alignmentId` via narrow selectors and resolve their labels directly
 * from `phase03FoundationFixture`. The Atributos branch additionally
 * subscribes to `baseAttributes` (so its status reacts to point-buy
 * edits) and reads the wider helpers via `getState()` — the narrow
 * subscriptions keep the hook reactive without coupling Raza/Alineamiento
 * to attributes-level state.
 */
function useOriginStepStatus(
  stepId: OriginStep,
  activeOriginStep: OriginStep | null,
): { status: StepperStepStatus; summary: string | undefined } {
  const raceId = useCharacterFoundationStore((state) => state.raceId);
  const alignmentId = useCharacterFoundationStore((state) => state.alignmentId);
  const baseAttributes = useCharacterFoundationStore(
    (state) => state.baseAttributes,
  );
  // Reference `baseAttributes` so the narrow subscription is not elided by
  // bundlers. The Atributos branch reads the full snapshot below via
  // `getState()`, but the reactive hook must track this field to re-render
  // on every point-buy edit.
  void baseAttributes;

  if (activeOriginStep === stepId) {
    return { status: 'active', summary: undefined };
  }

  switch (stepId) {
    case 'race': {
      if (raceId !== null) {
        const race = phase03FoundationFixture.races.find((r) => r.id === raceId);
        return { status: 'complete', summary: race?.label ?? undefined };
      }
      // UAT-2026-04-20 G1 — Raza is the entry point; always clickable even
      // before the user commits a choice. `ready` keeps StepperStep enabled
      // and neutral (no ✓).
      return { status: 'ready', summary: undefined };
    }
    case 'alignment': {
      if (raceId === null) {
        return { status: 'pending', summary: undefined };
      }
      if (alignmentId !== null) {
        const alignment = phase03FoundationFixture.alignments.find(
          (a) => a.id === alignmentId,
        );
        return { status: 'complete', summary: alignment?.label ?? undefined };
      }
      // UAT-2026-04-20 G1 — raceId committed, user can move into alignment.
      return { status: 'ready', summary: undefined };
    }
    case 'attributes': {
      if (alignmentId === null) {
        return { status: 'pending', summary: undefined };
      }
      // Read the full foundation snapshot non-reactively; reactivity is
      // supplied by the narrow `raceId`, `alignmentId`, and `baseAttributes`
      // subscriptions above, which cover every field the helpers consume.
      const foundationState = useCharacterFoundationStore.getState();
      const originReady = selectOriginReadyForAbilities(foundationState);
      const budgetSnapshot = selectAttributeBudgetSnapshot(foundationState);
      if (originReady && budgetSnapshot.status === 'legal') {
        return { status: 'complete', summary: shellCopyEs.stepper.originSteps.attributes };
      }
      // UAT-2026-04-20 G1 — alignment committed, user can tune attributes.
      return { status: 'ready', summary: undefined };
    }
  }
}

function ProgressionUnlockCard() {
  const raceId = useCharacterFoundationStore((state) => state.raceId);
  const alignmentId = useCharacterFoundationStore((state) => state.alignmentId);
  const baseAttributes = useCharacterFoundationStore(
    (state) => state.baseAttributes,
  );
  const setActiveOriginStep = usePlannerShellStore((state) => state.setActiveOriginStep);
  // Keep the card reactive to point-buy edits without widening the selector
  // surface beyond the fields the helper text depends on.
  void baseAttributes;

  const foundationState = useCharacterFoundationStore.getState();
  const attributeBudget = selectAttributeBudgetSnapshot(foundationState);
  const progressionUnlockCopy = shellCopyEs.stepper.progressionUnlock;

  let targetStep: OriginStep = 'race';
  if (raceId !== null && alignmentId === null) {
    targetStep = 'alignment';
  } else if (raceId !== null && alignmentId !== null) {
    targetStep = 'attributes';
  }
  void attributeBudget;

  const targetLabel = shellCopyEs.stepper.originSteps[targetStep];

  return (
    <div className="creation-stepper__unlock-card" data-testid="progression-unlock-card">
      <p className="creation-stepper__unlock-kicker">{progressionUnlockCopy.heading}</p>
      <p className="creation-stepper__unlock-body">{progressionUnlockCopy.intro}</p>
      <NwnButton
        onClick={() => setActiveOriginStep(targetStep)}
        variant="secondary"
      >
        {progressionUnlockCopy.goToStep.replace('{step}', targetLabel)}
      </NwnButton>
    </div>
  );
}

export function CreationStepper() {
  const activeOriginStep = usePlannerShellStore((state) => state.activeOriginStep);
  const setActiveOriginStep = usePlannerShellStore((state) => state.setActiveOriginStep);
  const expandedLevel = usePlannerShellStore((state) => state.expandedLevel);
  const activeView = usePlannerShellStore((state) => state.activeView);
  const setActiveView = usePlannerShellStore((state) => state.setActiveView);
  const progressionStarted = useLevelProgressionStore((state) =>
    state.levels.some((level) => level.classId !== null),
  );
  const showProgression = expandedLevel !== null || progressionStarted;

  return (
    <NwnFrame as="nav" className="creation-stepper" aria-label={shellCopyEs.stepper.heading}>
      <div className="creation-stepper__title-bar">
        <h2>{shellCopyEs.stepper.heading}</h2>
      </div>

      <section className="creation-stepper__origin">
        <h3 className="creation-stepper__section-heading">
          {shellCopyEs.stepper.originHeading}
        </h3>
        <ol className="creation-stepper__steps">
          {originSteps.map((step) => (
            <OriginStepItem
              key={step.id}
              activeOriginStep={activeOriginStep}
              setActiveOriginStep={setActiveOriginStep}
              stepId={step.id}
              label={step.label}
            />
          ))}
        </ol>
      </section>

      <section className="creation-stepper__progression">
        <h3 className="creation-stepper__section-heading">
          {shellCopyEs.stepper.progressionHeading}
        </h3>
        {showProgression ? (
          expandedLevel ? <LevelSubSteps level={expandedLevel} /> : null
        ) : (
          <ProgressionUnlockCard />
        )}
      </section>

      {/*
        Phase 12.7-01 (F7 BLOCKER R1 / D-01) — hoisted mount.
        Previously rendered inside <LevelProgressionRow>'s expanded slot
        (Plan 12.6-04). Because BuildProgressionBoard only mounts under the
        'class' sub-step of center-content.tsx, the old mount disappeared
        whenever the user navigated to Habilidades or Dotes — the user lost
        the advance affordance and could not reach L2.

        D-02 stable key `expandedLevel` (NOT `activeLevelSubStep`): React
        preserves this subtree across Clase → Habilidades → Dotes
        transitions within the same level. A key of activeLevelSubStep
        would remount on every sub-step change and re-fire the initial-
        render selector snapshot, flashing the disabled copy.

        D-03 complement: the old mount at level-progression-row.tsx line 243
        is DELETED in the same commit — a single source of truth for the
        bar prevents double-render + colliding testids.

        D-04 testid contract: the component itself is unchanged, so
        [data-testid="advance-to-level-{N+1}"] survives verbatim for the
        Phase 12.4-09 E2E spec.
      */}
      {expandedLevel !== null ? (
        <LevelEditorActionBar key={expandedLevel} />
      ) : null}

      <div className="creation-stepper__bottom">
        <NwnButton
          variant={activeView === 'resumen' ? 'primary' : 'auxiliary'}
          onClick={() => setActiveView('resumen')}
        >
          {shellCopyEs.stepper.resumenLabel}
        </NwnButton>
      </div>
    </NwnFrame>
  );
}

interface OriginStepItemProps {
  activeOriginStep: OriginStep | null;
  label: string;
  setActiveOriginStep: (step: OriginStep | null) => void;
  stepId: OriginStep;
}

function OriginStepItem({
  activeOriginStep,
  label,
  setActiveOriginStep,
  stepId,
}: OriginStepItemProps) {
  const { status, summary } = useOriginStepStatus(stepId, activeOriginStep);

  return (
    <li>
      <StepperStep
        label={label}
        onClick={() => setActiveOriginStep(stepId)}
        status={status}
        summary={summary}
      />
    </li>
  );
}
