import { AlertTriangle, Check } from 'lucide-react';

/**
 * StepperStep visual states.
 *
 * - `pending` — prerequisite not met; button is DISABLED. Used by origin
 *   steps (Alineamiento not reachable until Raza picked, etc.).
 * - `ready` — prerequisite met but user has not affirmed the step yet;
 *   button is ENABLED + neutral (no icon). Added in Phase 12.4-04 for the
 *   L1 sub-steps contract (SPEC R6): Clase/Habilidades/Dotes chips are
 *   clickable and neutral before the user earns the ✓.
 * - `active` — currently-selected step; highlighted.
 * - `complete` — user has satisfied the step; ✓ icon + `is-complete`.
 * - `blocked` — user made a selection that violates rules; warning icon.
 */
export type StepperStepStatus =
  | 'pending'
  | 'ready'
  | 'active'
  | 'complete'
  | 'blocked';

interface StepperStepProps {
  /**
   * Optional `data-substep` hook (Phase 12.4-04 R6/X1 lock).
   * When set (by `LevelSubSteps` with values `'class' | 'skills' | 'feats'`),
   * lands on the rendered `<button>` so RTL specs can query the sub-step
   * by its semantic role and assert `is-complete` state deterministically.
   */
  dataSubStep?: string;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  status: StepperStepStatus;
  summary?: string;
}

export function StepperStep({
  dataSubStep,
  disabled = false,
  label,
  onClick,
  status,
  summary,
}: StepperStepProps) {
  const isActive = status === 'active';
  const isComplete = status === 'complete';
  const isBlocked = status === 'blocked';
  const isPending = status === 'pending';

  return (
    <button
      aria-current={isActive ? 'step' : undefined}
      aria-disabled={isPending || disabled ? 'true' : undefined}
      className={`stepper-step is-${status}`}
      data-substep={dataSubStep}
      disabled={isPending || disabled}
      onClick={onClick}
      type="button"
    >
      {isComplete && (
        <Check aria-hidden="true" className="stepper-step__icon" size={16} />
      )}
      {isBlocked && (
        <AlertTriangle aria-hidden="true" className="stepper-step__icon" size={16} />
      )}
      <span className="stepper-step__label">
        {label}
        {isComplete && summary ? (
          <>: <span className="stepper-step__summary">{summary}</span></>
        ) : null}
      </span>
    </button>
  );
}
