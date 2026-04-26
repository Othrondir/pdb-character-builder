import { useRef } from 'react';
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
  // Phase 15-02 D-04 — board owns the scroller ref; we forward it to the
  // SelectionScreen content div (so it lands on the real overflow owner)
  // and to SkillSheet so its scroll-reset useLayoutEffect can mutate
  // scrollTop without a global document.querySelector.
  const scrollerRef = useRef<HTMLDivElement>(null);

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
    <SelectionScreen
      className="skill-board"
      contentRef={scrollerRef}
      title={shellCopyEs.stepper.stepTitles.skills}
    >
      <SkillSheet scrollerRef={scrollerRef} />
    </SelectionScreen>
  );
}
