import { useState } from 'react';
import { shellCopyEs } from '@planner/lib/copy/es';
import { SelectionScreen } from '@planner/components/ui/selection-screen';
import { DetailPanel } from '@planner/components/ui/detail-panel';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useSkillStore } from '@planner/features/skills/store';
import { selectFeatBoardView } from './selectors';
import { FeatSheet } from './feat-sheet';
import { FeatDetailPanel } from './feat-detail-panel';
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

  return (
    <SelectionScreen title={title} className="feat-board">
      <FeatSheet
        boardView={boardView}
        focusedFeatId={focusedFeatId}
        onFocusFeat={setFocusedFeatId}
      />
      <FeatDetailPanel boardView={boardView} focusedFeatId={focusedFeatId} />
    </SelectionScreen>
  );
}
