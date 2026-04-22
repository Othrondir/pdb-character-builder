import { useEffect, useState } from 'react';
import { shellCopyEs } from '@planner/lib/copy/es';
import { SelectionScreen } from '@planner/components/ui/selection-screen';
import { DetailPanel } from '@planner/components/ui/detail-panel';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useSkillStore } from '@planner/features/skills/store';
import { selectFeatBoardView, type FeatSlotStatusView } from './selectors';
import { FeatSheet } from './feat-sheet';
import { FeatDetailPanel } from './feat-detail-panel';
import { FeatSummaryCard } from './feat-summary-card';
import { useFeatStore } from './store';

function FeatSlotStrip({ slotStatuses }: { slotStatuses: FeatSlotStatusView[] }) {
  if (slotStatuses.length === 0) {
    return null;
  }

  return (
    <div className="feat-board__slot-strip" role="list">
      {slotStatuses.map((slotStatus) => (
        <article
          className={`feat-board__slot-card feat-board__slot-card--${slotStatus.state}`}
          data-slot-card={slotStatus.key}
          key={slotStatus.key}
          role="listitem"
        >
          <div className="feat-board__slot-card-header">
            <h3 className="feat-board__slot-card-title">{slotStatus.label}</h3>
            <span className="feat-board__slot-card-pill">
              {slotStatus.stateLabel}
            </span>
          </div>
          <p className="feat-board__slot-card-value">{slotStatus.valueLabel}</p>
        </article>
      ))}
    </div>
  );
}

export function FeatBoard() {
  const featState = useFeatStore();
  const progressionState = useLevelProgressionStore();
  const foundationState = useCharacterFoundationStore();
  const skillState = useSkillStore();
  const boardView = selectFeatBoardView(
    featState,
    progressionState,
    foundationState,
    skillState,
  );

  const [focusedFeatId, setFocusedFeatId] = useState<string | null>(null);

  // Phase 12.4-07 (D-04) — after collapse-on-complete, the user can click
  // `Modificar selección` to re-expand the full list. `isEditingCompleted`
  // tracks that local UI intent. Reset whenever the user navigates to a
  // different active level so the next level opens in its natural state.
  const [isEditingCompleted, setIsEditingCompleted] = useState(false);
  const activeLevel = boardView.activeSheet.level;
  useEffect(() => {
    setIsEditingCompleted(false);
  }, [activeLevel]);

  if (boardView.emptyStateBody) {
    return (
      <SelectionScreen title={shellCopyEs.stepper.stepTitles.feats}>
        <DetailPanel
          title={shellCopyEs.feats.emptyStateHeading}
          body={boardView.emptyStateBody}
        />
        <div />
      </SelectionScreen>
    );
  }

  // Phase 12.4-07 (D-04) — collapse when all slots filled AND user has not
  // explicitly asked to edit. counters.slots === 0 guard prevents the
  // summary-card misfire at levels with zero budget (would trivially match
  // chosen === slots === 0).
  const shouldCollapse =
    boardView.counters.slots > 0 &&
    boardView.counters.chosen >= boardView.counters.slots &&
    !isEditingCompleted;

  return (
    <SelectionScreen title={shellCopyEs.stepper.stepTitles.feats} className="feat-board">
      <div className="feat-board__main">
        <header className="feat-picker__header">
          <h3 className="feat-picker__counter">{boardView.counterLabel}</h3>
        </header>
        <FeatSlotStrip slotStatuses={boardView.slotStatuses} />
        {boardView.activeSheet.slotPrompt && !shouldCollapse ? (
          <p className="feat-board__slot-prompt">
            {boardView.activeSheet.slotPrompt}
          </p>
        ) : null}
        {shouldCollapse ? (
          <FeatSummaryCard
            chosenFeats={boardView.chosenFeats}
            onModify={() => setIsEditingCompleted(true)}
          />
        ) : (
          <FeatSheet
            boardView={boardView}
            focusedFeatId={focusedFeatId}
            onFocusFeat={setFocusedFeatId}
          />
        )}
      </div>
      <FeatDetailPanel boardView={boardView} focusedFeatId={focusedFeatId} />
    </SelectionScreen>
  );
}
