import { useState, useEffect, useMemo } from 'react';
import { OptionList, type OptionItem } from '@planner/components/ui/option-list';
import { shellCopyEs } from '@planner/lib/copy/es';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';
import { useFeatStore } from './store';
import { FeatSearch } from './feat-search';
import type { FeatBoardView, FeatOptionView } from './selectors';

interface FeatSheetProps {
  boardView: FeatBoardView;
  focusedFeatId: string | null;
  onFocusFeat: (featId: string | null) => void;
}

function renderFeatItem(item: OptionItem) {
  return (
    <>
      <span className="option-list__label">{item.label}</span>
      {item.secondary && (
        <span className="option-list__secondary">{item.secondary}</span>
      )}
    </>
  );
}

function mapFeatsToItems(
  feats: FeatOptionView[],
  focusedFeatId: string | null,
): OptionItem[] {
  return feats.map((feat) => ({
    id: feat.featId,
    label: feat.label,
    secondary: feat.prereqSummary || undefined,
    selected: feat.featId === focusedFeatId,
  }));
}

export function FeatSheet({ boardView, focusedFeatId, onFocusFeat }: FeatSheetProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const setClassFeat = useFeatStore((s) => s.setClassFeat);
  const setGeneralFeat = useFeatStore((s) => s.setGeneralFeat);

  // Debounce search query at 200ms (T-06-08 mitigation)
  useEffect(() => {
    if (searchQuery.length < 2) {
      setDebouncedQuery('');
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const activeLevel = boardView.activeSheet.level;

  const classItems = useMemo(
    () => mapFeatsToItems(boardView.activeSheet.eligibleClassFeats, focusedFeatId),
    [boardView.activeSheet.eligibleClassFeats, focusedFeatId],
  );

  const generalItems = useMemo(
    () => mapFeatsToItems(boardView.activeSheet.eligibleGeneralFeats, focusedFeatId),
    [boardView.activeSheet.eligibleGeneralFeats, focusedFeatId],
  );

  const handleSelectClassFeat = (featId: string) => {
    onFocusFeat(featId);
    setClassFeat(activeLevel, featId as CanonicalId);
  };

  const handleSelectGeneralFeat = (featId: string) => {
    onFocusFeat(featId);
    setGeneralFeat(activeLevel, featId as CanonicalId);
  };

  const handleFocusFeat = (featId: string) => {
    onFocusFeat(featId);
  };

  const showClassSection =
    boardView.sequentialStep === 'class-bonus' ||
    (boardView.activeSheet.hasClassBonusSlot &&
      boardView.activeSheet.eligibleClassFeats.length > 0);

  const showGeneralSection =
    boardView.sequentialStep === 'general' ||
    (!boardView.sequentialStep && boardView.activeSheet.hasGeneralSlot);

  return (
    <aside className="planner-panel planner-panel--inner feat-sheet">
      <div className="feat-board__search">
        <input
          type="search"
          role="searchbox"
          aria-label="Buscar dotes"
          placeholder={shellCopyEs.feats.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            className="feat-board__search-clear"
            onClick={() => setSearchQuery('')}
            type="button"
            aria-label="Limpiar busqueda"
          >
            X
          </button>
        )}
      </div>

      {debouncedQuery.length >= 2 ? (
        <FeatSearch
          query={debouncedQuery}
          boardView={boardView}
          onSelectFeat={handleFocusFeat}
        />
      ) : (
        <>
          {showClassSection ? (
            <section className="feat-sheet__group">
              <h3 className="feat-board__section-heading">
                {shellCopyEs.feats.sectionClassFeats}
              </h3>
              <OptionList
                className="feat-picker__list"
                items={classItems}
                onSelect={handleSelectClassFeat}
                renderItem={renderFeatItem}
              />
            </section>
          ) : null}
          {showGeneralSection ? (
            <section className="feat-sheet__group">
              <h3 className="feat-board__section-heading">
                {shellCopyEs.feats.sectionGeneralFeats}
              </h3>
              <OptionList
                className="feat-picker__list"
                items={generalItems}
                onSelect={handleSelectGeneralFeat}
                renderItem={renderFeatItem}
              />
            </section>
          ) : null}
        </>
      )}
    </aside>
  );
}
