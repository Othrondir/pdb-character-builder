import { useState, useEffect, useRef } from 'react';
import { shellCopyEs } from '@planner/lib/copy/es';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';
import { useFeatStore } from './store';
import { FeatSearch } from './feat-search';
import { FeatFamilyExpander } from './feat-family-expander';
import type {
  FeatBoardView,
  FeatOptionView,
  FeatListEntry,
  FeatFamilyView,
  FeatSlotKind,
} from './selectors';

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

/**
 * Phase 12.4-08 (SPEC R7 / CONTEXT D-05) — folded family row.
 * Carries `data-family-id` + `{N} objetivos` pill + blocked-state classes.
 * Click toggles the inline expander (handled by FeatEntryList).
 */
function FeatFamilyRow({
  family,
  expanded,
  onToggle,
}: {
  family: FeatFamilyView;
  expanded: boolean;
  onToggle: (groupKey: string) => void;
}) {
  const blocked = family.rowState !== 'selectable';
  const hasSelection = family.selectedTarget !== null;
  const className = [
    'feat-picker__row',
    'feat-picker__row--family',
    blocked ? 'feat-picker__row--blocked' : '',
    hasSelection ? 'feat-picker__row--chosen' : '',
    expanded ? 'feat-picker__row--expanded' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const available = family.targets.filter(
    (t) => t.rowState !== 'blocked-already-taken',
  ).length;
  const pillLabel =
    available === 1
      ? shellCopyEs.feats.familyPillSingular
      : shellCopyEs.feats.familyPillPluralTemplate.replace(
          '{N}',
          String(available),
        );

  return (
    <button
      aria-disabled={blocked ? 'true' : 'false'}
      aria-expanded={expanded ? 'true' : 'false'}
      className={className}
      data-family-id={family.groupKey}
      onClick={() => onToggle(family.groupKey)}
      type="button"
    >
      <span className="feat-picker__label">{family.label}</span>
      {family.selectedTarget ? (
        <em className="feat-picker__reason">{family.selectedTarget.label}</em>
      ) : null}
      <span className="feat-picker__pill feat-picker__pill--family">
        {pillLabel}
      </span>
    </button>
  );
}

/**
 * Phase 12.4-08 — mixed entry list. Each FeatListEntry is either a plain
 * feat row or a folded family row with an inline <fieldset> expander
 * rendered below when expanded.
 */
function FeatEntryList({
  entries,
  focusedFeatId,
  expandedFamilyId,
  onToggleFamily,
  onSelectTarget,
  onSelect,
  onFocus,
}: {
  entries: FeatListEntry[];
  focusedFeatId: string | null;
  expandedFamilyId: string | null;
  onToggleFamily: (groupKey: string) => void;
  onSelectTarget: (featId: string) => void;
  onSelect: (featId: string) => void;
  onFocus: (featId: string) => void;
}) {
  return (
    <ul className="feat-picker__list" role="listbox">
      {entries.map((entry) => {
        if (entry.kind === 'feat') {
          return (
            <li key={entry.option.featId}>
              <FeatPickerRow
                focused={entry.option.featId === focusedFeatId}
                onFocus={onFocus}
                onSelect={onSelect}
                option={entry.option}
              />
            </li>
          );
        }
        const family = entry.family;
        const expanded = expandedFamilyId === family.groupKey;
        return (
          <li key={family.groupKey}>
            <FeatFamilyRow
              family={family}
              expanded={expanded}
              onToggle={onToggleFamily}
            />
            {expanded ? (
              <FeatFamilyExpander
                family={family}
                onSelectTarget={onSelectTarget}
                onClose={() => onToggleFamily(family.groupKey)}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export function FeatSheet({ boardView, focusedFeatId, onFocusFeat }: FeatSheetProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Phase 12.4-08 — which folded family row is currently expanded. Only one
  // expander open at a time; clicking an already-open family closes it.
  const [expandedFamilyId, setExpandedFamilyId] = useState<string | null>(null);

  const setClassFeat = useFeatStore((s) => s.setClassFeat);
  const setGeneralFeat = useFeatStore((s) => s.setGeneralFeat);
  const clearClassFeat = useFeatStore((s) => s.clearClassFeat);
  const clearGeneralFeat = useFeatStore((s) => s.clearGeneralFeat);
  const featLevels = useFeatStore((s) => s.levels);

  const handleToggleFamily = (groupKey: string) => {
    setExpandedFamilyId((curr) => (curr === groupKey ? null : groupKey));
  };

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

  // UAT-2026-04-20 P4 — toggle semantics. Clicking a feat that is already
  // the active-level's class-bonus (or general) pick RELEASES the slot
  // instead of re-setting the same id. Second click = un-select.
  const currentRecord = featLevels.find((r) => r.level === activeLevel);

  // Phase 12.8-03 (D-04, UAT-2026-04-23 F3) — auto-scroll to the general
  // section when the class-bonus slot fills. Without this the viewport
  // stays on the class section and the user's second click lands on
  // class rows again (UAT evidence: counter stuck at 1/2 with the first
  // pick overwritten). Uses `block: 'nearest'` so wider viewports where
  // the general section is already visible do not get a gratuitous
  // scroll.
  //
  // Guard: only trigger on an actual null → non-null transition.
  // `prevClassFeatIdRef.current` starts `undefined` so the initial-mount
  // case (revisited level with classFeatId already set) is rejected by
  // the `prev === null` check — we only scroll on a fresh pick.
  const prevClassFeatIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const prev = prevClassFeatIdRef.current;
    const next = currentRecord?.classFeatId ?? null;
    if (prev === null && next !== null) {
      // Defer one frame so React commit finishes first — the general
      // section swaps its `feat-sheet__group--current` class on the
      // same render, and we want to scroll AFTER that swap paints.
      requestAnimationFrame(() => {
        const generalSection = document.querySelector<HTMLElement>(
          '[data-slot-section="general"]',
        );
        if (generalSection === null) {
          return;
        }
        const firstRow =
          generalSection.querySelector<HTMLElement>('button.feat-picker__row') ??
          generalSection;
        firstRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
    }
    prevClassFeatIdRef.current = next;
  }, [currentRecord?.classFeatId]);

  const handleSelectClassFeat = (featId: string) => {
    onFocusFeat(featId);
    if (currentRecord?.classFeatId === featId) {
      clearClassFeat(activeLevel);
      return;
    }
    setClassFeat(activeLevel, featId as CanonicalId);
  };

  const handleSelectGeneralFeat = (featId: string) => {
    onFocusFeat(featId);
    const selectedGeneralIndex =
      boardView.activeSheet.selectedGeneralFeatIds.indexOf(featId as CanonicalId);

    if (selectedGeneralIndex >= 0) {
      clearGeneralFeat(activeLevel, selectedGeneralIndex);
      return;
    }

    const targetSlotIndex = boardView.activeSheet.selectedGeneralFeatIds.length;
    setGeneralFeat(activeLevel, featId as CanonicalId, targetSlotIndex);
  };

  const handleFocusFeat = (featId: string) => {
    onFocusFeat(featId);
  };

  const resolveSlotStatus = (slot: FeatSlotKind) =>
    boardView.slotStatuses.find((status) => status.slot === slot) ?? null;

  const showClassSection =
    boardView.activeSheet.hasClassBonusSlot &&
    boardView.classBonusEntries.length > 0;

  const showGeneralSection =
    boardView.activeSheet.hasGeneralSlot &&
    boardView.generalEntries.length > 0;

  const classSlotStatus = resolveSlotStatus('class-bonus');
  const generalSlotStatus = resolveSlotStatus('general');
  const generalSelectionCount = boardView.activeSheet.selectedGeneralFeatIds.length;
  const generalSectionNote =
    boardView.activeSheet.generalSlotCount > 1
      ? shellCopyEs.feats.generalSlotSummaryTemplate
          .replace('{chosen}', String(generalSelectionCount))
          .replace('{slots}', String(boardView.activeSheet.generalSlotCount))
      : generalSlotStatus?.valueLabel ?? null;

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
            <section
              className={`feat-sheet__group${
                classSlotStatus?.state === 'current'
                  ? ' feat-sheet__group--current'
                  : ''
              }`}
              data-slot-section="class-bonus"
            >
              <div className="feat-board__section-header">
                <h3 className="feat-board__section-heading">
                  {shellCopyEs.feats.sectionClassFeats}
                </h3>
                {classSlotStatus ? (
                  <span className="feat-board__section-pill">
                    {classSlotStatus.stateLabel}
                  </span>
                ) : null}
              </div>
              {classSlotStatus ? (
                <p className="feat-board__section-note">
                  {classSlotStatus.valueLabel}
                </p>
              ) : null}
              <FeatEntryList
                entries={boardView.classBonusEntries}
                expandedFamilyId={expandedFamilyId}
                focusedFeatId={focusedFeatId}
                onFocus={handleFocusFeat}
                onSelect={handleSelectClassFeat}
                onSelectTarget={handleSelectClassFeat}
                onToggleFamily={handleToggleFamily}
              />
            </section>
          ) : null}
          {showGeneralSection ? (
            <section
              className={`feat-sheet__group${
                generalSlotStatus?.state === 'current'
                  ? ' feat-sheet__group--current'
                  : ''
              }`}
              data-slot-section="general"
            >
              <div className="feat-board__section-header">
                <h3 className="feat-board__section-heading">
                  {shellCopyEs.feats.sectionGeneralFeats}
                </h3>
                {generalSlotStatus ? (
                  <span className="feat-board__section-pill">
                    {generalSlotStatus.stateLabel}
                  </span>
                ) : null}
              </div>
              {generalSlotStatus ? (
                <p className="feat-board__section-note">
                  {generalSectionNote}
                </p>
              ) : null}
              <FeatEntryList
                entries={boardView.generalEntries}
                expandedFamilyId={expandedFamilyId}
                focusedFeatId={focusedFeatId}
                onFocus={handleFocusFeat}
                onSelect={handleSelectGeneralFeat}
                onSelectTarget={handleSelectGeneralFeat}
                onToggleFamily={handleToggleFamily}
              />
            </section>
          ) : null}
        </>
      )}
    </aside>
  );
}
