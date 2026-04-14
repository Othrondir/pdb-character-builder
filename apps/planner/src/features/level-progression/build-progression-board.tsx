import { useState } from 'react';
import { shellCopyEs } from '@planner/lib/copy/es';
import { OriginBoard } from '@planner/features/character-foundation/origin-board';
import { selectOriginReadyForAbilities } from '@planner/features/character-foundation/selectors';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';

import { FoundationSummaryStrip } from './foundation-summary-strip';
import { LevelRail } from './level-rail';
import { LevelSheet } from './level-sheet';

export function BuildProgressionBoard() {
  const foundationReady = useCharacterFoundationStore(selectOriginReadyForAbilities);
  const [editingOrigin, setEditingOrigin] = useState(false);

  if (!foundationReady) {
    return <OriginBoard />;
  }

  return (
    <section className="planner-section-view progression-shell section-fade">
      <header className="planner-panel planner-panel--inner">
        <p className="planner-section-view__eyebrow">{shellCopyEs.subtitle}</p>
        <h1>{shellCopyEs.sections.build.heading}</h1>
        <p className="planner-section-view__description">
          {shellCopyEs.sections.build.description}
        </p>
      </header>

      <FoundationSummaryStrip
        onToggleOrigin={() => setEditingOrigin((current) => !current)}
      />

      {editingOrigin ? (
        <div className="progression-origin-editor">
          <OriginBoard embedded />
        </div>
      ) : null}

      <div className="progression-board">
        <LevelRail />
        <LevelSheet />
      </div>
    </section>
  );
}
