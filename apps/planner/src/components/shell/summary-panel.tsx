import { shellCopyEs } from '@planner/lib/copy/es';
import { selectFoundationSummary } from '@planner/features/character-foundation/selectors';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { selectProgressionSummary } from '@planner/features/level-progression/selectors';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { selectSkillRail } from '@planner/features/skills/selectors';
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

const skillPlanStateLabels = {
  illegal: 'Habilidades inválidas',
  repair: 'Habilidades en reparación',
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
  const skillRail = selectSkillRail(skillState, progressionState, foundationState);
  const datasetId = foundationSummary.datasetId || fallbackDatasetId;
  const progressionHasSelections = progressionSummary.highestConfiguredLevel > 0;
  const skillHasSelections = skillState.levels.some((level) => level.allocations.length > 0);
  const skillHasIllegal = skillRail.some((entry) => entry.status === 'illegal');
  const skillHasBlocked = skillRail.some((entry) => entry.status === 'blocked');
  const skillSummaryStatus =
    skillHasIllegal ? 'illegal' : skillHasBlocked ? 'blocked' : 'legal';
  const validationStatus =
    foundationSummary.summaryStatus !== 'legal'
      ? foundationSummary.summaryStatus
      : skillHasSelections
        ? skillSummaryStatus
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
      ? skillHasSelections
        ? validationStatus === 'illegal'
          ? skillPlanStateLabels.illegal
          : validationStatus === 'blocked'
            ? skillPlanStateLabels.repair
            : progressionSummary.planState === progressionPlanStateLabels.ready
              ? progressionPlanStateLabels.ready
              : progressionSummary.planState
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
      </dl>
    </aside>
  );
}
