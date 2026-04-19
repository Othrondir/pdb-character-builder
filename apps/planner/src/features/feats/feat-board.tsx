import { useEffect, useState } from 'react';
import { shellCopyEs } from '@planner/lib/copy/es';
import { SelectionScreen } from '@planner/components/ui/selection-screen';
import { DetailPanel } from '@planner/components/ui/detail-panel';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useSkillStore } from '@planner/features/skills/store';
import { selectFeatBoardView } from './selectors';
import { FeatSheet } from './feat-sheet';
import { FeatDetailPanel } from './feat-detail-panel';
import { FeatSummaryCard } from './feat-summary-card';
import { useFeatStore } from './store';

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

  // D-03: title reflects current sequential step
  const title =
    boardView.sequentialStep === 'class-bonus'
      ? shellCopyEs.feats.classFeatStepTitle
      : boardView.sequentialStep === 'general'
        ? shellCopyEs.feats.generalFeatStepTitle
        : shellCopyEs.stepper.stepTitles.feats;

  // Phase 12.4-07 (D-04) — collapse when all slots filled AND user has not
  // explicitly asked to edit. counters.slots === 0 guard prevents the
  // summary-card misfire at levels with zero budget (would trivially match
  // chosen === slots === 0).
  const shouldCollapse =
    boardView.counters.slots > 0 &&
    boardView.counters.chosen >= boardView.counters.slots &&
    !isEditingCompleted;

  return (
    <SelectionScreen title={title} className="feat-board">
      <header className="feat-picker__header">
        <h3 className="feat-picker__counter">{boardView.counterLabel}</h3>
      </header>
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
      <FeatDetailPanel boardView={boardView} focusedFeatId={focusedFeatId} />
    </SelectionScreen>
  );
}
