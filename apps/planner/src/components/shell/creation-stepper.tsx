import { shellCopyEs } from '@planner/lib/copy/es';
import { originSteps } from '@planner/lib/sections';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import {
  selectFoundationSummary,
  selectOriginReadyForAbilities,
} from '@planner/features/character-foundation/selectors';
import { selectAttributeBudgetSnapshot } from '@planner/features/character-foundation/selectors';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import { NwnFrame } from '@planner/components/ui/nwn-frame';
import { NwnButton } from '@planner/components/ui/nwn-button';
import { StepperStep } from './stepper-step';
import type { StepperStepStatus } from './stepper-step';
import { LevelRail } from './level-rail';
import { LevelSubSteps } from './level-sub-steps';
import type { OriginStep } from '@planner/lib/sections';

function useOriginStepStatus(
  stepId: OriginStep,
  activeOriginStep: OriginStep | null,
): { status: StepperStepStatus; summary: string | undefined } {
  const foundationState = useCharacterFoundationStore();
  const foundationSummary = selectFoundationSummary(foundationState);

  if (activeOriginStep === stepId) {
    return { status: 'active', summary: undefined };
  }

  switch (stepId) {
    case 'race': {
      if (foundationState.raceId !== null) {
        return { status: 'complete', summary: foundationSummary.selectedRaceLabel ?? undefined };
      }
      return { status: 'pending', summary: undefined };
    }
    case 'alignment': {
      if (foundationState.raceId === null) {
        return { status: 'pending', summary: undefined };
      }
      if (foundationState.alignmentId !== null) {
        return { status: 'complete', summary: foundationSummary.selectedAlignmentLabel ?? undefined };
      }
      return { status: 'pending', summary: undefined };
    }
    case 'attributes': {
      if (foundationState.alignmentId === null) {
        return { status: 'pending', summary: undefined };
      }
      const originReady = selectOriginReadyForAbilities(foundationState);
      const budgetSnapshot = selectAttributeBudgetSnapshot(foundationState);
      if (originReady && budgetSnapshot.status === 'legal') {
        return { status: 'complete', summary: shellCopyEs.stepper.originSteps.attributes };
      }
      return { status: 'pending', summary: undefined };
    }
  }
}

export function CreationStepper() {
  const activeOriginStep = usePlannerShellStore((state) => state.activeOriginStep);
  const setActiveOriginStep = usePlannerShellStore((state) => state.setActiveOriginStep);
  const expandedLevel = usePlannerShellStore((state) => state.expandedLevel);

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
        <LevelRail />
        {expandedLevel && <LevelSubSteps level={expandedLevel} />}
      </section>

      <div className="creation-stepper__bottom">
        <NwnButton variant="auxiliary">{shellCopyEs.stepper.resumenLabel}</NwnButton>
        <NwnButton variant="auxiliary">{shellCopyEs.stepper.utilidadesLabel}</NwnButton>
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
