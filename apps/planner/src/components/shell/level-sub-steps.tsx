import { levelSubSteps } from '@planner/lib/sections';
import type { ProgressionLevel } from '@planner/lib/sections';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useFeatStore } from '@planner/features/feats/store';
import {
  isClaseLevelComplete,
  isDotesLevelComplete,
  isHabilidadesLevelComplete,
} from '@planner/features/level-progression/selectors';
import { openPlannerLevel } from '@planner/features/level-progression/navigation';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useSkillStore } from '@planner/features/skills/store';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import { StepperStep, type StepperStepStatus } from './stepper-step';

interface LevelSubStepsProps {
  level: ProgressionLevel;
}

/**
 * Renders the ordered clase/habilidades/dotes sub-step chips for the
 * currently expanded progression level.
 *
 * Phase 12.4-04 (SPEC R6 + X1): status per chip is derived from the three
 * pure predicates in `level-progression/selectors.ts`. Prior to this fix,
 * every non-active chip was hardcoded to `'complete'` — which rendered a
 * pre-green ✓ on L1 Clase/Habilidades/Dotes before the user had done
 * anything (X1 regression). Now the chip renders:
 *   - `'active'`  if it is the currently-selected sub-step.
 *   - `'complete'` if the matching predicate resolves true.
 *   - `'ready'`   otherwise — neutral + clickable (no ✓, not disabled).
 */
export function LevelSubSteps({ level }: LevelSubStepsProps) {
  const activeLevelSubStep = usePlannerShellStore((state) => state.activeLevelSubStep);
  const progressionState = useLevelProgressionStore();
  const foundationState = useCharacterFoundationStore();
  const featState = useFeatStore();
  const skillState = useSkillStore();

  const claseComplete = isClaseLevelComplete(progressionState, level);
  const habilidadesComplete = isHabilidadesLevelComplete(
    progressionState,
    foundationState,
    featState,
    skillState,
    level,
  );
  const dotesComplete = isDotesLevelComplete(
    progressionState,
    foundationState,
    featState,
    skillState,
    level,
  );

  function resolveStatus(
    subStepId: (typeof levelSubSteps)[number]['id'],
  ): StepperStepStatus {
    if (activeLevelSubStep === subStepId) return 'active';
    switch (subStepId) {
      case 'class':
        return claseComplete ? 'complete' : 'ready';
      case 'skills':
        return habilidadesComplete ? 'complete' : 'ready';
      case 'feats':
        return dotesComplete ? 'complete' : 'ready';
    }
  }

  return (
    <div className="level-sub-steps" role="group" aria-label={`Sub-pasos del nivel ${level}`}>
      {levelSubSteps.map((subStep) => (
        <StepperStep
          dataSubStep={subStep.id}
          disabled={false}
          key={subStep.id}
          label={subStep.label}
          onClick={() => openPlannerLevel(level, subStep.id)}
          status={resolveStatus(subStep.id)}
        />
      ))}
    </div>
  );
}
