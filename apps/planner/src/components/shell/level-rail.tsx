import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { selectLevelRail } from '@planner/features/level-progression/selectors';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import type { ProgressionLevel } from '@planner/lib/sections';

export function LevelRail() {
  const progressionState = useLevelProgressionStore();
  const foundationState = useCharacterFoundationStore();
  const entries = selectLevelRail(progressionState, foundationState);
  const setActiveLevel = useLevelProgressionStore((state) => state.setActiveLevel);
  const expandedLevel = usePlannerShellStore((state) => state.expandedLevel);
  const setExpandedLevel = usePlannerShellStore((state) => state.setExpandedLevel);

  return (
    <div
      aria-label="Nivel de progresion"
      className="level-rail"
      role="radiogroup"
    >
      {entries.map((entry) => {
        const isExpanded = expandedLevel === entry.level;

        return (
          <button
            aria-checked={isExpanded}
            aria-disabled={entry.locked ? 'true' : undefined}
            className={`level-rail__button is-${entry.status}${isExpanded ? ' is-expanded' : ''}${entry.locked ? ' is-locked' : ''}`}
            disabled={entry.locked}
            key={entry.level}
            onClick={() => {
              setActiveLevel(entry.level as ProgressionLevel);
              setExpandedLevel(entry.level as ProgressionLevel);
            }}
            role="radio"
            type="button"
          >
            <span>{entry.level}</span>
            {entry.classLabel ? (
              <span className="level-rail__abbrev">{entry.classLabel}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
