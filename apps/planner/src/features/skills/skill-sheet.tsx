import { useLayoutEffect, useRef, type ChangeEvent } from 'react';
import {
  canIncrementSkill,
  type SkillBudgetSnapshot,
} from '@rules-engine/skills/skill-budget';
import { shellCopyEs } from '@planner/lib/copy/es';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import type { ProgressionLevel } from '@planner/features/level-progression/progression-fixture';

import {
  buildSkillBudgetSnapshotFromSheet,
  selectActiveSkillSheetView,
  type SkillSheetRowView,
} from './selectors';
import { useSkillStore } from './store';

function SkillRankRow({
  row,
  level,
  snapshot,
}: {
  level: ProgressionLevel;
  row: SkillSheetRowView;
  snapshot: SkillBudgetSnapshot;
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
      <div className="skill-sheet__row-label">
        <h4>{row.label}</h4>
        <span className="skill-sheet__meta-inline">
          {/*
            Phase 12.7-03 (F3 R4) — removed the per-row cost-type-label
            span that duplicated category text (Clase / Transclase)
            already surfaced by the section headings (`Habilidades de
            clase` / `Habilidades transclase`) at
            .skill-board__section-heading. `Solo entrenada` badge below
            is orthogonal (per 12.4-05) and stays. The costTypeLabel
            field on SkillSheetRowView is NOT deleted — out of 12.7-03
            scope; dead-field cleanup tracked separately.
          */}
          {row.trainedOnly ? (
            // Phase 12.4-05 — R4: `Solo entrenada` badge stays per-row (orthogonal
            // to class/transclase section grouping). `data-trained-only` exposes
            // a queryable attribute for regression specs + future UI treatments.
            <span data-trained-only="true">
              {shellCopyEs.skills.trainedOnlyLabel}
            </span>
          ) : null}
        </span>
      </div>

      <div
        className="skill-sheet__controls"
        title={`${shellCopyEs.skills.nextCostLabel}: ${row.nextCostLabel}`}
      >
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
          disabled={
            row.disabled
            || row.currentRank + row.step > row.maxAssignableRank
            || !canIncrementSkill(row.skillId, level, snapshot)
          }
          onClick={() => incrementSkillRank(level, row.skillId, row.step)}
          type="button"
        >
          +
        </button>
      </div>

      <div className="skill-sheet__totals-inline">
        <span className="skill-sheet__total-value">{row.currentTotal}</span>
        <span className="skill-sheet__cap-value">
          {shellCopyEs.skills.capLabel}: {row.cap}
        </span>
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
  // Phase 12.7-02 (D-07, UAT F4 R2) — compose the overspend-gate snapshot
  // once per render and thread it into every <SkillRankRow />. Pure data,
  // no store reads; the rules-engine helper (`canIncrementSkill`) stays
  // framework-agnostic (12.4-03 invariant).
  const snapshot = buildSkillBudgetSnapshotFromSheet(activeSheet);

  // Phase 12.7-03 (F2 R3, D-08/D-09) — Habilidades sub-step scroll reset.
  // UAT-2026-04-20 showed the sub-step opens mid-list (scrollHeight 2069 /
  // clientHeight 748) because a browser-native focus side-effect scrolls
  // the first interactive button into view. useLayoutEffect fires
  // synchronously after DOM mutation but BEFORE the browser paints, so
  // the user never sees the mid-list flash even on slow hardware. The
  // effect also runs on `[activeSheet.level]` dependency change so the
  // scroller resets when the user navigates L1 → L2 via the level rail.
  const scrollerRef = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    if (scrollerRef.current !== null) {
      scrollerRef.current.scrollTop = 0;
    }
  }, [activeSheet.level]);

  return (
    <aside
      ref={scrollerRef}
      className="planner-panel planner-panel--inner level-sheet skill-sheet"
    >
      <div>
        <h2>{activeSheet.title}</h2>
        <p className="detail-panel__body">
          {shellCopyEs.progression.levelLabel} {activeSheet.level}
          {activeSheet.classLabel ? ` · ${activeSheet.classLabel}` : ''}
        </p>
      </div>

      <dl className="planner-summary__grid skill-sheet__summary-grid skill-sheet__summary-inline">
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
        // Phase 12.4-05 — R4 two-section render. Class section (1 pt/rango) above
        // transclase section (2 pts/rango) per UI-SPEC.md §"R4 — Skill board split".
        // Scoped namespace `.skill-board__*` mirrors `.feat-board__section-heading`.
        <div className="skill-sheet__groups">
          {activeSheet.groups.map((group) => {
            const headingId = `skill-board__${group.sectionId}`;
            return (
              <section
                aria-labelledby={headingId}
                className={`skill-sheet__group skill-board__section skill-board__section--${group.sectionId}`}
                key={group.sectionId}
              >
                <h3
                  className="skill-board__section-heading"
                  id={headingId}
                >
                  {group.heading}
                  <span
                    className="skill-board__cost-hint"
                    style={{ fontSize: '12px' }}
                  >
                    {' '}
                    {group.costHint}
                  </span>
                </h3>
                <div className="skill-sheet__rows skill-board__rows">
                  {group.rows.map((row) => (
                    <SkillRankRow
                      key={row.skillId}
                      level={activeSheet.level}
                      row={row}
                      snapshot={snapshot}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="level-sheet__placeholder">
          <p>{activeSheet.emptyMessage}</p>
        </div>
      )}
    </aside>
  );
}
