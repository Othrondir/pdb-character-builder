import { useState, useEffect } from 'react';
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

/**
 * Phase 12.4-07 (SPEC R5 / D-03) — scoped `.feat-picker__row` rendering.
 * Preserves the two-section idiom (class-bonus + general) but replaces the
 * `OptionList` button with a state-aware custom button carrying:
 *   - `data-feat-id` (for RTL + DOM queries)
 *   - `aria-disabled` driven by `option.rowState !== 'selectable'`
 *   - `.feat-picker__row--blocked` + inline italic reason + pill badge on
 *     blocked-* rows (visibility-lock contract — never `display: none`)
 *   - `.feat-picker__row--chosen` on rows chosen at the active level (makes
 *     the re-expanded list legible after `Modificar selección`).
 */
function FeatPickerRow({
  option,
  focused,
  onSelect,
  onFocus,
}: {
  option: FeatOptionView;
  focused: boolean;
  onSelect: (featId: string) => void;
  onFocus: (featId: string) => void;
}) {
  const blocked = option.rowState !== 'selectable';
  const className = [
    'feat-picker__row',
    blocked ? 'feat-picker__row--blocked' : '',
    option.isChosenAtLevel ? 'feat-picker__row--chosen' : '',
    focused ? 'feat-picker__row--focused' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleClick = () => {
    onFocus(option.featId);
    // T-12.4-07-01: blocked rows have aria-disabled="true" AND we no-op
    // in the click handler — double guard in case the click lands somehow.
    if (!blocked) {
      onSelect(option.featId);
    }
  };

  return (
    <button
      aria-disabled={blocked ? 'true' : 'false'}
      className={className}
      data-feat-id={option.featId}
      onClick={handleClick}
      type="button"
    >
      <span className="feat-picker__label">{option.label}</span>
      {option.blockedReason?.reasonLabel ? (
        <em className="feat-picker__reason">
          {option.blockedReason.reasonLabel}
        </em>
      ) : null}
      {option.blockedReason?.pillLabel ? (
        <span className="feat-picker__pill">
          {option.blockedReason.pillLabel}
        </span>
      ) : null}
    </button>
  );
}

function FeatPickerList({
  options,
  focusedFeatId,
  onSelect,
  onFocus,
}: {
  options: FeatOptionView[];
  focusedFeatId: string | null;
  onSelect: (featId: string) => void;
  onFocus: (featId: string) => void;
}) {
  return (
    <ul className="feat-picker__list" role="listbox">
      {options.map((option) => (
        <li key={option.featId}>
          <FeatPickerRow
            focused={option.featId === focusedFeatId}
            onFocus={onFocus}
            onSelect={onSelect}
            option={option}
          />
        </li>
      ))}
    </ul>
  );
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
              <FeatPickerList
                focusedFeatId={focusedFeatId}
                onFocus={handleFocusFeat}
                onSelect={handleSelectClassFeat}
                options={boardView.activeSheet.eligibleClassFeats}
              />
            </section>
          ) : null}
          {showGeneralSection ? (
            <section className="feat-sheet__group">
              <h3 className="feat-board__section-heading">
                {shellCopyEs.feats.sectionGeneralFeats}
              </h3>
              <FeatPickerList
                focusedFeatId={focusedFeatId}
                onFocus={handleFocusFeat}
                onSelect={handleSelectGeneralFeat}
                options={boardView.activeSheet.eligibleGeneralFeats}
              />
            </section>
          ) : null}
        </>
      )}
    </aside>
  );
}
