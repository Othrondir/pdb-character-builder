import { shellCopyEs } from '@planner/lib/copy/es';
import { SelectionScreen } from '@planner/components/ui/selection-screen';
import { DetailPanel } from '@planner/components/ui/detail-panel';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { selectSkillBoardView } from './selectors';
import { SkillSheet } from './skill-sheet';
import { useSkillStore } from './store';

export function SkillBoard() {
  const skillState = useSkillStore();
  const progressionState = useLevelProgressionStore();
  const foundationState = useCharacterFoundationStore();
  const boardView = selectSkillBoardView(skillState, progressionState, foundationState);

  if (boardView.emptyStateBody) {
    return (
      <SelectionScreen title={shellCopyEs.stepper.stepTitles.skills}>
        <DetailPanel
          title={shellCopyEs.skills.emptyStateHeading}
          body={boardView.emptyStateBody}
        />
        <div />
      </SelectionScreen>
    );
  }

  return (
    <SelectionScreen className="skill-board" title={shellCopyEs.stepper.stepTitles.skills}>
      <SkillSheet />
    </SelectionScreen>
  );
}
