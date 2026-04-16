import { levelSubSteps } from '@planner/lib/sections';
import type { ProgressionLevel } from '@planner/lib/sections';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import { StepperStep } from './stepper-step';

interface LevelSubStepsProps {
  level: ProgressionLevel;
}

export function LevelSubSteps({ level: _level }: LevelSubStepsProps) {
  const activeLevelSubStep = usePlannerShellStore((state) => state.activeLevelSubStep);
  const setActiveLevelSubStep = usePlannerShellStore((state) => state.setActiveLevelSubStep);

  return (
    <div className="level-sub-steps" role="group" aria-label={`Sub-pasos del nivel`}>
      {levelSubSteps.map((subStep) => {
        const isActive = activeLevelSubStep === subStep.id;

        return (
          <StepperStep
            key={subStep.id}
            disabled={false}
            label={subStep.label}
            onClick={() => setActiveLevelSubStep(subStep.id)}
            status={isActive ? 'active' : 'complete'}
          />
        );
      })}
    </div>
  );
}
