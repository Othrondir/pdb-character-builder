import type { ChangeEvent } from 'react';
import { shellCopyEs } from '@planner/lib/copy/es';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import type { ProgressionLevel } from '@planner/features/level-progression/progression-fixture';

import { selectActiveSkillSheetView, type SkillSheetRowView } from './selectors';
import { useSkillStore } from './store';

function SkillRankRow({
  row,
  level,
}: {
  level: ProgressionLevel;
  row: SkillSheetRowView;
}) {
  const decrementSkillRank = useSkillStore((state) => state.decrementSkillRank);
  const incrementSkillRank = useSkillStore((state) => state.incrementSkillRank);
  const setSkillRank = useSkillStore((state) => state.setSkillRank);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = Number(event.target.value);

    if (Number.isNaN(nextValue)) {
      return;
    }

    setSkillRank(level, row.skillId, nextValue);
  };

  return (
    <article className={`skill-sheet__row is-${row.status}`}>
      <div className="skill-sheet__row-main">
        <div>
          <h4>{row.label}</h4>
          <div className="skill-sheet__meta">
            <span>{row.costTypeLabel}</span>
            <span>
              {shellCopyEs.skills.capLabel}: {row.cap}
            </span>
            {row.trainedOnly ? <span>{shellCopyEs.skills.trainedOnlyLabel}</span> : null}
          </div>
        </div>

        <div className="skill-sheet__value">
          <span>{row.currentTotal}</span>
          <small>
            {shellCopyEs.skills.rankLabel}: {row.currentRank}
          </small>
        </div>
      </div>

      <div className="skill-sheet__controls">
        <button
          aria-label={`${shellCopyEs.skills.decreaseRankLabel} ${row.label}`}
          className="skill-sheet__stepper"
          disabled={row.disabled || row.currentRank <= 0}
          onClick={() => decrementSkillRank(level, row.skillId, row.step)}
          type="button"
        >
          -
        </button>
        <label className="skill-sheet__input">
          <span className="sr-only">{row.label}</span>
          <input
            disabled={row.disabled}
            inputMode="decimal"
            max={row.maxAssignableRank}
            min={0}
            onChange={handleChange}
            step={row.step}
            type="number"
            value={row.currentRank}
          />
        </label>
        <button
          aria-label={`${shellCopyEs.skills.increaseRankLabel} ${row.label}`}
          className="skill-sheet__stepper"
          disabled={row.disabled || row.currentRank + row.step > row.maxAssignableRank}
          onClick={() => incrementSkillRank(level, row.skillId, row.step)}
          type="button"
        >
          +
        </button>
        <div className="skill-sheet__next-cost">
          <span>{shellCopyEs.skills.nextCostLabel}</span>
          <strong>{row.nextCostLabel}</strong>
        </div>
      </div>

      {row.issues.length > 0 ? (
        <div className="skill-sheet__issues">
          {row.issues.map((issue) => (
            <p className={`foundation-step__issue is-${row.status}`} key={issue.key}>
              {issue.text}
            </p>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export function SkillSheet() {
  const skillState = useSkillStore();
  const progressionState = useLevelProgressionStore();
  const foundationState = useCharacterFoundationStore();
  const activeSheet = selectActiveSkillSheetView(
    skillState,
    progressionState,
    foundationState,
  );

  return (
    <aside className="planner-panel planner-panel--inner level-sheet skill-sheet">
      <div>
        <h2>{activeSheet.title}</h2>
        <p className="detail-panel__body">
          {shellCopyEs.progression.levelLabel} {activeSheet.level}
          {activeSheet.classLabel ? ` · ${activeSheet.classLabel}` : ''}
        </p>
      </div>

      <dl className="planner-summary__grid skill-sheet__summary-grid">
        <div>
          <dt>{shellCopyEs.skills.availablePointsLabel}</dt>
          <dd>{activeSheet.availablePoints}</dd>
        </div>
        <div>
          <dt>{shellCopyEs.skills.spentPointsLabel}</dt>
          <dd>{activeSheet.spentPoints}</dd>
        </div>
        <div>
          <dt>{shellCopyEs.skills.remainingPointsLabel}</dt>
          <dd>{activeSheet.remainingPoints}</dd>
        </div>
      </dl>

      {activeSheet.repairMessage ? (
        <p className="level-sheet__repair-callout">{activeSheet.repairMessage}</p>
      ) : null}

      {activeSheet.issues.length > 0 ? (
        <div className="skill-sheet__issues">
          {activeSheet.issues.map((issue) => (
            <p className={`foundation-step__issue is-${activeSheet.status}`} key={issue}>
              {issue}
            </p>
          ))}
        </div>
      ) : null}

      {activeSheet.classId ? (
        <div className="skill-sheet__groups">
          {activeSheet.groups.map((group) => (
            <section className="skill-sheet__group" key={group.category}>
              <h3>{group.heading}</h3>
              <div className="skill-sheet__rows">
                {group.rows.map((row) => (
                  <SkillRankRow key={row.skillId} level={activeSheet.level} row={row} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="level-sheet__placeholder">
          <p>{activeSheet.emptyMessage}</p>
        </div>
      )}
    </aside>
  );
}
