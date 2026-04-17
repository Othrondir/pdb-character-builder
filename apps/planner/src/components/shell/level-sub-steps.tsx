import { levelSubSteps } from '@planner/lib/sections';
import type { ProgressionLevel } from '@planner/lib/sections';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { classHasCastingAtLevel } from '@planner/features/magic/selectors';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import { StepperStep } from './stepper-step';

interface LevelSubStepsProps {
  level: ProgressionLevel;
}

/**
 * Renders the ordered clase/habilidades/dotes/magia sub-step chips for the
 * currently expanded progression level. D-02: hides the `spells` sub-step
 * when the level's assigned class is not a spellcaster. The union identifier
 * `spells` stays intact so existing URL/stateful paths keep working; only the
 * visible chip is filtered out.
 */
export function LevelSubSteps({ level }: LevelSubStepsProps) {
  const activeLevelSubStep = usePlannerShellStore((state) => state.activeLevelSubStep);
  const setActiveLevelSubStep = usePlannerShellStore((state) => state.setActiveLevelSubStep);
  const progressionState = useLevelProgressionStore();

  const stepsToRender = levelSubSteps.filter((subStep) => {
    if (subStep.id !== 'spells') return true;
    return classHasCastingAtLevel(level, progressionState);
  });

  return (
    <div className="level-sub-steps" role="group" aria-label={`Sub-pasos del nivel`}>
      {stepsToRender.map((subStep) => {
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
