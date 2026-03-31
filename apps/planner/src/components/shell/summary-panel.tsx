import { shellCopyEs } from '@planner/lib/copy/es';
import { selectFoundationSummary } from '@planner/features/character-foundation/selectors';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { selectProgressionSummary } from '@planner/features/level-progression/selectors';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { selectSkillSummary } from '@planner/features/skills/selectors';
import { useSkillStore } from '@planner/features/skills/store';
import { usePlannerShellStore } from '@planner/state/planner-shell';

const validationLabels = {
  blocked: 'Bloqueada',
  illegal: 'Inválida',
  legal: 'Válida',
  pending: shellCopyEs.summaryValues.validation,
} as const;

const progressionPlanStateLabels = {
  invalid: 'Ruta inválida',
  ready: 'Lista para habilidades',
  repair: 'Progresión en reparación',
} as const;

interface SummaryPanelProps {
  isOpen: boolean;
}

export function SummaryPanel({ isOpen }: SummaryPanelProps) {
  const fallbackDatasetId = usePlannerShellStore((state) => state.datasetId);
  const fallbackValidationStatus = usePlannerShellStore(
    (state) => state.validationStatus,
  );
  const foundationState = useCharacterFoundationStore();
  const progressionState = useLevelProgressionStore();
  const skillState = useSkillStore();
  const foundationSummary = selectFoundationSummary(foundationState);
  const progressionSummary = selectProgressionSummary(
    progressionState,
    foundationState,
  );
  const skillSummary = selectSkillSummary(skillState, progressionState, foundationState);
  const datasetId = foundationSummary.datasetId || fallbackDatasetId;
  const progressionHasSelections = progressionSummary.highestConfiguredLevel > 0;
  const progressionIsBlocking =
    progressionSummary.summaryStatus === 'blocked' ||
    progressionSummary.summaryStatus === 'illegal';
  const validationStatus =
    foundationSummary.summaryStatus !== 'legal'
      ? foundationSummary.summaryStatus
      : progressionIsBlocking
        ? progressionSummary.summaryStatus
        : skillSummary.highestConfiguredLevel > 0
          ? skillSummary.summaryStatus
          : progressionHasSelections
            ? progressionSummary.summaryStatus
            : foundationSummary.summaryStatus ?? fallbackValidationStatus;
  const validationStatusClass =
    validationStatus === 'blocked'
      ? 'summary-status summary-status--blocked'
      : validationStatus === 'illegal'
        ? 'summary-status summary-status--illegal'
        : 'summary-status';
  const planState =
    foundationSummary.summaryStatus === 'legal'
      ? progressionIsBlocking
        ? progressionSummary.planState
        : skillSummary.highestConfiguredLevel > 0
          ? skillSummary.planState
          : progressionSummary.planState === progressionPlanStateLabels.ready
          ? progressionPlanStateLabels.ready
          : progressionSummary.planState === progressionPlanStateLabels.repair
            ? progressionPlanStateLabels.repair
            : progressionSummary.planState === progressionPlanStateLabels.invalid
              ? progressionPlanStateLabels.invalid
              : progressionSummary.planState
      : foundationSummary.planState;

  return (
    <aside
      aria-label="Resumen del personaje"
      className={`planner-summary planner-panel shell-reveal${
        isOpen ? ' is-open' : ''
      }`}
    >
      <div className="planner-summary__header">
        <p className="planner-nav__eyebrow">{shellCopyEs.subtitle}</p>
        <h2>{shellCopyEs.summaryHeading}</h2>
      </div>

      <dl className="planner-summary__grid">
        <div>
          <dt>{shellCopyEs.summaryFields.character}</dt>
          <dd>{foundationSummary.characterLabel}</dd>
        </div>
        <div>
          <dt>{shellCopyEs.summaryFields.targetLevel}</dt>
          <dd>
            {progressionSummary.highestConfiguredLevel > 0
              ? `${progressionSummary.highestConfiguredLevel}/16`
              : shellCopyEs.summaryValues.targetLevel}
          </dd>
        </div>
        <div>
          <dt>{shellCopyEs.summaryFields.dataset}</dt>
          <dd>{datasetId}</dd>
        </div>
        <div>
          <dt>{shellCopyEs.summaryFields.validation}</dt>
          <dd className={validationStatusClass}>
            {validationLabels[validationStatus]}
          </dd>
        </div>
        <div>
          <dt>{shellCopyEs.summaryFields.planState}</dt>
          <dd>{planState}</dd>
        </div>
        <div>
          <dt>{shellCopyEs.summaryFields.skillConfiguredLevel}</dt>
          <dd>
            {skillSummary.highestConfiguredLevel > 0
              ? `${skillSummary.highestConfiguredLevel}/16`
              : shellCopyEs.skills.planStates.empty}
          </dd>
        </div>
        <div>
          <dt>{shellCopyEs.summaryFields.skillSpentPoints}</dt>
          <dd>{skillSummary.spentPoints}</dd>
        </div>
        <div>
          <dt>{shellCopyEs.summaryFields.skillRemainingPoints}</dt>
          <dd>{skillSummary.remainingPoints}</dd>
        </div>
        <div>
          <dt>{shellCopyEs.summaryFields.skillBlockedLevels}</dt>
          <dd>
            {skillSummary.blockedLevels.length > 0
              ? skillSummary.blockedLevels.join(', ')
              : '—'}
          </dd>
        </div>
      </dl>
    </aside>
  );
}
