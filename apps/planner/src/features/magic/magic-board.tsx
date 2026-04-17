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
 * use `(shellCopyEs as unknown as { magic?: ... }).magic ?? fallback` so the
 * feature compiles today and picks up the typed copy automatically.
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

  const magicCopy =
    (shellCopyEs as unknown as { magic?: Record<string, string> }).magic ?? {};

  if (boardView.emptyStateBody) {
    return (
      <SelectionScreen
        title={shellCopyEs.stepper.stepTitles.spells}
      >
        <DetailPanel
          title={magicCopy.emptyStateHeading ?? 'La magia sigue bloqueada'}
          body={boardView.emptyStateBody}
        />
        <div />
      </SelectionScreen>
    );
  }

  const paradigmTitle: Record<string, string> = {
    domains: magicCopy.domainsStepTitle ?? 'Selecciona los dominios del nivel',
    spellbook: magicCopy.spellbookStepTitle ?? 'Amplía el grimorio',
    known: magicCopy.knownSpellsStepTitle ?? 'Selecciona los conjuros conocidos',
    'prepared-summary':
      magicCopy.preparedStepTitle ?? 'Magia preparada por descanso',
    empty: magicCopy.noCastingStepTitle ?? 'Este nivel no concede magia',
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
