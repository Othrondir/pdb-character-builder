import { shellCopyEs } from '@planner/lib/copy/es';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';

import { selectSkillRail } from './selectors';
import { useSkillStore } from './store';

const STATUS_LABELS = {
  blocked: shellCopyEs.progression.statuses.blocked,
  illegal: shellCopyEs.progression.statuses.illegal,
  legal: shellCopyEs.progression.statuses.legal,
  pending: shellCopyEs.progression.statuses.pending,
} as const;

export function SkillRail() {
  const skillState = useSkillStore();
  const progressionState = useLevelProgressionStore();
  const foundationState = useCharacterFoundationStore();
  const setActiveLevel = useSkillStore((state) => state.setActiveLevel);
  const entries = selectSkillRail(skillState, progressionState, foundationState);

  return (
    <section className="planner-panel planner-panel--inner level-rail skill-rail">
      <div className="level-rail__header">
        <h2>{shellCopyEs.skills.railHeading}</h2>
      </div>

      <div className="level-rail__entries">
        {entries.map((entry) => (
          <button
            aria-label={`${shellCopyEs.progression.levelLabel} ${entry.level} ${STATUS_LABELS[entry.status]}`}
            aria-pressed={entry.active}
            className={`level-rail__entry is-${entry.status}${
              entry.active ? ' is-active' : ''
            }`}
            key={entry.level}
            onClick={() => setActiveLevel(entry.level)}
            type="button"
          >
            <strong>
              {shellCopyEs.progression.levelLabel} {entry.level}
            </strong>
            <span>{entry.classLabel ?? 'Sin clase'}</span>
            <span>{STATUS_LABELS[entry.status]}</span>
            {entry.inheritedFromLevel !== null ? (
              <span>
                {shellCopyEs.skills.repairRailLabel} {entry.inheritedFromLevel}
              </span>
            ) : null}
            {entry.issueCount > 0 ? (
              <span>
                {entry.issueCount} incidencia{entry.issueCount === 1 ? '' : 's'}
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </section>
  );
}
