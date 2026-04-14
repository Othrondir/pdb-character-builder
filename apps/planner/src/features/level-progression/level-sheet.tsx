import { shellCopyEs } from '@planner/lib/copy/es';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';

import {
  selectActiveLevelSheetView,
} from './selectors';
import type { ProgressionLevel } from './progression-fixture';
import { useLevelProgressionStore } from './store';
import { AbilityIncreaseControl } from './ability-increase-control';

const STATUS_LABELS = {
  blocked: shellCopyEs.progression.statuses.blocked,
  illegal: shellCopyEs.progression.statuses.illegal,
  legal: shellCopyEs.progression.statuses.legal,
  pending: shellCopyEs.progression.statuses.pending,
} as const;

export function LevelSheet() {
  const foundationState = useCharacterFoundationStore();
  const progressionState = useLevelProgressionStore();
  const setLevelClassId = useLevelProgressionStore((state) => state.setLevelClassId);
  const activeSheet = selectActiveLevelSheetView(progressionState, foundationState);
  const selectedAbility = activeSheet.abilityIncrease;

  return (
    <aside className="planner-panel planner-panel--inner level-sheet">
      <div>
        <h2>{activeSheet.title}</h2>
        <p className="planner-section-view__description">
          {shellCopyEs.progression.levelLabel} {activeSheet.level}
        </p>
      </div>

      <section className="level-sheet__requirements">
        <h3>{shellCopyEs.progression.classSectionHeading}</h3>
        <div className="planner-section-view__highlights">
          {activeSheet.classOptions.map((option) => (
            <button
              aria-label={`${option.label} ${STATUS_LABELS[option.status]}`}
              aria-pressed={option.selected}
              className={`planner-chip class-option is-${option.status}${
                option.selected ? ' is-selected' : ''
              }`}
              key={option.id}
              onClick={() =>
                setLevelClassId(activeSheet.level as ProgressionLevel, option.id)
              }
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      {activeSheet.repairMessage ? (
        <p className="level-sheet__repair-callout">{activeSheet.repairMessage}</p>
      ) : null}

      {activeSheet.classId ? (
        <>
          <section className="level-sheet__requirements">
            <h3>{shellCopyEs.progression.requirementsHeading}</h3>
            <div className="level-sheet__rows">
              {activeSheet.requirementRows.length > 0 ? (
                activeSheet.requirementRows.map((row) => (
                  <p className={`foundation-step__issue is-${row.status}`} key={row.label}>
                    {row.label}
                  </p>
                ))
              ) : (
                <p className="planner-section-view__description">
                  {shellCopyEs.progression.statuses.legal}
                </p>
              )}
            </div>
          </section>

          <section className="level-sheet__gains">
            <h3>{shellCopyEs.progression.gainsHeading}</h3>
            <div className="level-sheet__rows">
              {[...activeSheet.gains, ...activeSheet.choicePrompts].length > 0 ? (
                [...activeSheet.gains, ...activeSheet.choicePrompts].map((item) => (
                  <p className="planner-section-view__description" key={item}>
                    {item}
                  </p>
                ))
              ) : (
                <p className="planner-section-view__description">
                  {activeSheet.placeholderBody}
                </p>
              )}
            </div>
          </section>
        </>
      ) : (
        <div className="level-sheet__placeholder">
          <p>{activeSheet.placeholderBody}</p>
        </div>
      )}

      {activeSheet.abilityIncreaseAvailable ? (
        <section className="level-sheet__ability">
          <h3>{shellCopyEs.progression.abilityHeading}</h3>
          <p className="planner-section-view__description">
            {shellCopyEs.progression.abilityHelper}
          </p>
          <AbilityIncreaseControl
            level={activeSheet.level as ProgressionLevel}
            value={selectedAbility}
          />
        </section>
      ) : null}
    </aside>
  );
}
