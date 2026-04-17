import { useState } from 'react';
import { shellCopyEs } from '@planner/lib/copy/es';
import { SelectionScreen } from '@planner/components/ui/selection-screen';
import { DetailPanel } from '@planner/components/ui/detail-panel';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useSkillStore } from '@planner/features/skills/store';
import { useFeatStore } from '@planner/features/feats/store';

import { MagicDetailPanel } from './magic-detail-panel';
import { MagicSheet } from './magic-sheet';
import { selectMagicBoardView } from './selectors';
import { useMagicStore } from './store';

/**
 * Top-level magic board. Mirrors apps/planner/src/features/feats/feat-board.tsx.
 *
 * Copy namespace `shellCopyEs.magic.*` is finalized in Plan 07-03; components
 * now consume the typed namespace directly (no runtime fallbacks).
 */
export function MagicBoard() {
  const magicState = useMagicStore();
  const featState = useFeatStore();
  const skillState = useSkillStore();
  const progressionState = useLevelProgressionStore();
  const foundationState = useCharacterFoundationStore();

  const boardView = selectMagicBoardView(
    magicState,
    featState,
    skillState,
    progressionState,
    foundationState,
  );

  const [focusedId, setFocusedId] = useState<string | null>(null);

  const magicCopy = shellCopyEs.magic;

  if (boardView.emptyStateBody) {
    return (
      <SelectionScreen
        title={shellCopyEs.stepper.stepTitles.spells}
      >
        <DetailPanel
          title={magicCopy.emptyStateHeadingNotReady}
          body={boardView.emptyStateBody}
        />
        <div />
      </SelectionScreen>
    );
  }

  const paradigmTitle: Record<string, string> = {
    domains: magicCopy.domainsStepTitle,
    spellbook: magicCopy.spellbookStepTitle,
    known: magicCopy.knownSpellsStepTitle,
    'prepared-summary': magicCopy.preparedStepTitle,
    empty: magicCopy.noCastingStepTitle,
  };
  const title = paradigmTitle[boardView.activeSheet.paradigm] ?? paradigmTitle.empty;

  return (
    <SelectionScreen title={title} className="magic-board">
      <MagicSheet
        boardView={boardView}
        focusedId={focusedId}
        onFocusId={setFocusedId}
      />
      <MagicDetailPanel boardView={boardView} focusedId={focusedId} />
    </SelectionScreen>
  );
}
