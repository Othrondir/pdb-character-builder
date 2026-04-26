import { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
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
  // Phase 15-03 D-06 — slice-as-input via useShallow (Zustand 5.x). The
  // destructured slice IS the selector input: no `getState()` snapshot,
  // no `void` discards, no subscription/selector drift. Action functions
  // are reference-stable across zustand renders, so including them in the
  // shallow comparison adds no re-render cost; it satisfies the selector's
  // FeatStoreState type expectation while letting useShallow narrow data
  // re-renders to identity changes on { levels, activeLevel, datasetId,
  // lastEditedLevel } only. Closes Phase 06 WR-01 for this consumer.
  const featState = useFeatStore(
    useShallow((s) => ({
      levels: s.levels,
      activeLevel: s.activeLevel,
      datasetId: s.datasetId,
      lastEditedLevel: s.lastEditedLevel,
      clearClassFeat: s.clearClassFeat,
      clearGeneralFeat: s.clearGeneralFeat,
      resetFeatSelections: s.resetFeatSelections,
      resetLevel: s.resetLevel,
      setActiveLevel: s.setActiveLevel,
      setClassFeat: s.setClassFeat,
      setGeneralFeat: s.setGeneralFeat,
    })),
  );
  const progressionState = useLevelProgressionStore();
  const foundationState = useCharacterFoundationStore();
  const skillState = useSkillStore();
  // Phase 12.8-03 (D-05 + D-06) — narrow subscriptions for per-chip deselect.
  // Mirrors the pattern at feat-sheet.tsx:239-240. KEPT as atomic selectors
  // alongside the useShallow slice above (per Phase 15-03 plan acceptance
  // criteria) — both subscriptions return reference-equal action handles so
  // there is no extra re-render cost. The atomic selectors are the
  // consumer-facing reference path used by JSX callbacks (Phase 12.8-03 D-06
  // invariant — chip deselect handlers consume them via the closure below).
  const clearClassFeat = useFeatStore((s) => s.clearClassFeat);
  const clearGeneralFeat = useFeatStore((s) => s.clearGeneralFeat);
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

  // Phase 15-02 D-04 — board owns the scroller ref; passed to <FeatSheet> so
  // its auto-scroll-to-general effect can scope the [data-slot-section]
  // querySelector under the FeatBoard subtree (no document-level lookup).
  const scrollerRef = useRef<HTMLDivElement>(null);

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
      <div className="feat-board__main" ref={scrollerRef}>
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
            onDeselect={(entry) => {
              // Phase 12.8-03 (D-05 + D-06, UAT-2026-04-23 F4) — per-chip ×
              // dispatch. `activeLevel` is the symbol declared higher up in
              // this component body (see the setIsEditingCompleted reset
              // effect introduced by Phase 12.4-07 D-04). Do NOT redeclare
              // here; reuse so the deselect dispatches to the same level
              // the sheet is currently viewing.
              //
              // Phase 16-02 (D-04, D-07; PATTERNS S3): race-bonus chip's
              // slotIndex=0 maps to store's bonusGeneralFeatIds[0], which
              // the clearGeneralFeat mutator addresses as slotIndex=1.
              if (entry.slotKind === 'class-bonus') {
                clearClassFeat(activeLevel, entry.slotIndex);
              } else if (entry.slotKind === 'race-bonus') {
                clearGeneralFeat(activeLevel, 1);
              } else {
                clearGeneralFeat(activeLevel, entry.slotIndex);
              }
              // Re-expand the sheet so the user can pick a replacement.
              // Without this, the card would keep rendering (with the
              // remaining chip + "Modificar selección") until the user
              // clicks Modificar — defeating the F4 acceptance.
              setIsEditingCompleted(true);
            }}
            onModify={() => setIsEditingCompleted(true)}
          />
        ) : (
          <FeatSheet
            boardView={boardView}
            focusedFeatId={focusedFeatId}
            onFocusFeat={setFocusedFeatId}
            scrollerRef={scrollerRef}
          />
        )}
      </div>
      <FeatDetailPanel boardView={boardView} focusedFeatId={focusedFeatId} />
    </SelectionScreen>
  );
}
