import { shellCopyEs } from '@planner/lib/copy/es';
import {
  selectFoundationSummaryStrip,
  selectProgressionSummary,
} from '@planner/features/level-progression/selectors';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';

const STATUS_LABELS = {
  blocked: shellCopyEs.progression.statuses.blocked,
  illegal: shellCopyEs.progression.statuses.illegal,
  legal: shellCopyEs.progression.statuses.legal,
  pending: shellCopyEs.progression.statuses.pending,
} as const;

interface FoundationSummaryStripProps {
  onToggleOrigin: () => void;
}

export function FoundationSummaryStrip({
  onToggleOrigin,
}: FoundationSummaryStripProps) {
  const foundationState = useCharacterFoundationStore();
  const progressionState = useLevelProgressionStore();
  const summary = selectFoundationSummaryStrip(foundationState);
  const progressionSummary = selectProgressionSummary(
    progressionState,
    foundationState,
  );

  return (
    <section className="planner-panel planner-panel--inner progression-summary-strip">
      <div className="progression-summary-strip__header">
        <div>
          <p className="planner-section-view__eyebrow">{shellCopyEs.subtitle}</p>
          <h2>{shellCopyEs.progression.foundationStripHeading}</h2>
        </div>

        <button
          className="planner-shell__cta"
          onClick={onToggleOrigin}
          type="button"
        >
          {shellCopyEs.progression.editOrigin}
        </button>
      </div>

      <div
        className={`progression-summary-strip__status is-${progressionSummary.summaryStatus}`}
      >
        <strong>{progressionSummary.planState}</strong>
        <span>{STATUS_LABELS[progressionSummary.summaryStatus]}</span>
      </div>

      <dl className="planner-summary__grid progression-summary-strip__grid">
        <div>
          <dt>{shellCopyEs.foundation.steps.race}</dt>
          <dd>{summary.selectedRaceLabel ?? 'Sin elegir'}</dd>
        </div>
        <div>
          <dt>{shellCopyEs.foundation.steps.subrace}</dt>
          <dd>{summary.selectedSubraceLabel ?? 'Sin elegir'}</dd>
        </div>
        <div>
          <dt>{shellCopyEs.foundation.steps.alignment}</dt>
          <dd>{summary.selectedAlignmentLabel ?? 'Sin elegir'}</dd>
        </div>
        <div>
          <dt>{shellCopyEs.foundation.steps.deity}</dt>
          <dd>{summary.selectedDeityLabel ?? 'Sin elegir'}</dd>
        </div>
        <div>
          <dt>{shellCopyEs.summaryFields.dataset}</dt>
          <dd>{summary.datasetId}</dd>
        </div>
      </dl>

      <div className="planner-section-view__highlights progression-summary-strip__attributes">
        {summary.attributes.map((attribute) => (
          <span className="planner-chip" key={attribute.key}>
            {attribute.label} {attribute.value}
          </span>
        ))}
      </div>
    </section>
  );
}
