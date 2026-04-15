import { AlertTriangle, Check } from 'lucide-react';

export type StepperStepStatus = 'pending' | 'active' | 'complete' | 'blocked';

interface StepperStepProps {
  disabled?: boolean;
  label: string;
  onClick: () => void;
  status: StepperStepStatus;
  summary?: string;
}

export function StepperStep({
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
