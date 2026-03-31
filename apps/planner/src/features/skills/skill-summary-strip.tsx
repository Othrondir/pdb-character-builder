import { shellCopyEs } from '@planner/lib/copy/es';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';

import { selectSkillSummaryStrip } from './selectors';
import { useSkillStore } from './store';

const STATUS_LABELS = {
  blocked: shellCopyEs.progression.statuses.blocked,
  illegal: shellCopyEs.progression.statuses.illegal,
  legal: shellCopyEs.progression.statuses.legal,
  pending: shellCopyEs.progression.statuses.pending,
} as const;

export function SkillSummaryStrip() {
  const skillState = useSkillStore();
  const progressionState = useLevelProgressionStore();
  const foundationState = useCharacterFoundationStore();
  const summary = selectSkillSummaryStrip(
    skillState,
    progressionState,
    foundationState,
  );

  return (
    <section className="planner-panel planner-panel--inner progression-summary-strip skill-summary-strip">
      <div className="progression-summary-strip__header">
        <div>
          <p className="planner-section-view__eyebrow">{shellCopyEs.subtitle}</p>
          <h2>{shellCopyEs.skills.railHeading}</h2>
        </div>

        <div className={`progression-summary-strip__status is-${summary.status}`}>
          <strong>
            {shellCopyEs.progression.levelLabel} {summary.activeLevel}
          </strong>
          <span>{STATUS_LABELS[summary.status]}</span>
        </div>
      </div>

      <dl className="planner-summary__grid progression-summary-strip__grid">
        <div>
          <dt>{shellCopyEs.skills.classLabel}</dt>
          <dd>{summary.classLabel ?? 'Sin clase'}</dd>
        </div>
        <div>
          <dt>{shellCopyEs.skills.availablePointsLabel}</dt>
          <dd>{summary.availablePoints}</dd>
        </div>
        <div>
          <dt>{shellCopyEs.skills.spentPointsLabel}</dt>
          <dd>{summary.spentPoints}</dd>
        </div>
        <div>
          <dt>{shellCopyEs.skills.remainingPointsLabel}</dt>
          <dd>{summary.remainingPoints}</dd>
        </div>
        <div>
          <dt>{shellCopyEs.summaryFields.dataset}</dt>
          <dd>{summary.datasetId}</dd>
        </div>
      </dl>
    </section>
  );
}
