import { shellCopyEs } from '@planner/lib/copy/es';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';

import { selectSkillBoardView } from './selectors';
import { SkillRail } from './skill-rail';
import { SkillSheet } from './skill-sheet';
import { SkillSummaryStrip } from './skill-summary-strip';
import { useSkillStore } from './store';

export function SkillBoard() {
  const skillState = useSkillStore();
  const progressionState = useLevelProgressionStore();
  const foundationState = useCharacterFoundationStore();
  const boardView = selectSkillBoardView(skillState, progressionState, foundationState);

  return (
    <section className="planner-section-view progression-shell skill-board section-fade">
      <header className="planner-panel planner-panel--inner">
        <p className="planner-section-view__eyebrow">{shellCopyEs.subtitle}</p>
        <h1>{shellCopyEs.sections.skills.heading}</h1>
        <p className="planner-section-view__description">
          {shellCopyEs.sections.skills.description}
        </p>
      </header>

      <SkillSummaryStrip />

      {boardView.emptyStateBody ? (
        <div className="planner-section-view__callout planner-panel planner-panel--inner">
          <h2>{shellCopyEs.skills.emptyStateHeading}</h2>
          <p>{boardView.emptyStateBody}</p>
        </div>
      ) : null}

      <div className="progression-board skill-board__layout">
        <SkillRail />
        <SkillSheet />
      </div>
    </section>
  );
}
