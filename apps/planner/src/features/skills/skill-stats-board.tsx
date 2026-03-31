import { shellCopyEs } from '@planner/lib/copy/es';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';

import { selectSkillStatsView } from './selectors';
import { useSkillStore } from './store';

const STATUS_LABELS = {
  blocked: shellCopyEs.progression.statuses.blocked,
  illegal: shellCopyEs.progression.statuses.illegal,
  legal: shellCopyEs.progression.statuses.legal,
  pending: shellCopyEs.progression.statuses.pending,
} as const;

export function SkillStatsBoard() {
  const skillState = useSkillStore();
  const progressionState = useLevelProgressionStore();
  const foundationState = useCharacterFoundationStore();
  const statsView = selectSkillStatsView(skillState, progressionState, foundationState);

  return (
    <section className="planner-section-view progression-shell skill-stats-board section-fade">
      <header className="planner-panel planner-panel--inner">
        <p className="planner-section-view__eyebrow">{shellCopyEs.subtitle}</p>
        <h1>{statsView.title}</h1>
        <p className="planner-section-view__description">{statsView.technicalDescription}</p>
      </header>

      <section className="planner-panel planner-panel--inner progression-summary-strip skill-summary-strip">
        <div className="progression-summary-strip__header">
          <div>
            <p className="planner-section-view__eyebrow">{shellCopyEs.subtitle}</p>
            <h2>
              {shellCopyEs.progression.levelLabel} {statsView.activeLevel}
            </h2>
          </div>

          <div className={`progression-summary-strip__status is-${statsView.status}`}>
            <strong>{shellCopyEs.sections.stats.label}</strong>
            <span>{STATUS_LABELS[statsView.status]}</span>
          </div>
        </div>

        <dl className="planner-summary__grid progression-summary-strip__grid">
          <div>
            <dt>{shellCopyEs.skills.classLabel}</dt>
            <dd>{statsView.summary.classLabel ?? 'Sin clase'}</dd>
          </div>
          <div>
            <dt>{shellCopyEs.summaryFields.dataset}</dt>
            <dd>{statsView.summary.datasetId}</dd>
          </div>
          <div>
            <dt>{shellCopyEs.skills.remainingPointsLabel}</dt>
            <dd>{statsView.summary.remainingPoints}</dd>
          </div>
        </dl>
      </section>

      {statsView.emptyStateBody ? (
        <div className="planner-section-view__callout planner-panel planner-panel--inner">
          <h2>{shellCopyEs.skills.emptyStateHeading}</h2>
          <p>{statsView.emptyStateBody}</p>
        </div>
      ) : (
        <div className="skill-stats-board__layout">
          <section className="planner-panel planner-panel--inner skill-stats-board__panel">
            <h2>{statsView.totalsHeading}</h2>
            <dl className="planner-summary__grid skill-stats-board__totals">
              {statsView.totals.map((item) => (
                <div key={item.key}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="planner-panel planner-panel--inner skill-stats-board__panel">
            <h2>{statsView.capsAndCostsHeading}</h2>
            <div className="skill-stats-board__rows">
              {statsView.capsAndCosts.map((row) => (
                <article className={`skill-stats-board__row is-${row.status}`} key={row.key}>
                  <div>
                    <h3>{row.label}</h3>
                    <p>{row.costTypeLabel}</p>
                  </div>
                  <div className="skill-stats-board__facts">
                    <span>{row.currentTotalLabel}</span>
                    <span>{row.capLabel}</span>
                    <span>
                      {shellCopyEs.skills.nextCostLabel}: {row.nextCostLabel}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="planner-panel planner-panel--inner skill-stats-board__panel">
            <h2>{statsView.penaltiesHeading}</h2>
            {statsView.penalties.length > 0 ? (
              <div className="skill-stats-board__issues">
                {statsView.penalties.map((penalty) => (
                  <article
                    className={`skill-stats-board__issue is-${penalty.status}`}
                    key={penalty.key}
                  >
                    <h3>{penalty.label}</h3>
                    <p>{penalty.text}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="planner-section-view__description">
                Sin penalizaciones activas en el snapshot actual.
              </p>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
