import { useEffect, useState } from 'react';

import { NwnButton } from '@planner/components/ui/nwn-button';
import { shellCopyEs } from '@planner/lib/copy/es';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';

import { DomainTileGrid } from './domain-tile-grid';
import type { MagicBoardView } from './selectors';
import { SpellLevelTabs } from './spell-level-tabs';
import { SpellRow } from './spell-row';
import { SwapSpellDialog } from './swap-spell-dialog';
import { useMagicStore } from './store';

interface MagicSheetProps {
  boardView: MagicBoardView;
  focusedId: string | null;
  onFocusId: (id: string | null) => void;
}

/**
 * Left-pane paradigm dispatcher. Based on the active sheet's paradigm, renders
 * the DomainTileGrid (cleric L1), SpellLevelTabs + SpellRow list
 * (spellbook/known), the prepared-summary listing, or an empty message.
 */
export function MagicSheet({ boardView, focusedId, onFocusId }: MagicSheetProps) {
  const sheet = boardView.activeSheet;

  const setDomains = useMagicStore((s) => s.setDomains);
  const addSpellbookEntry = useMagicStore((s) => s.addSpellbookEntry);
  const removeSpellbookEntry = useMagicStore((s) => s.removeSpellbookEntry);
  const addKnownSpell = useMagicStore((s) => s.addKnownSpell);
  const removeKnownSpell = useMagicStore((s) => s.removeKnownSpell);

  const [activeSpellLevel, setActiveSpellLevel] = useState<number>(
    sheet.activeSpellLevel,
  );
  const [swapOpen, setSwapOpen] = useState(false);

  // Re-sync local spell-level selection when the selector picks a new starting level
  // (e.g. user flips to a different progression level from the rail).
  useEffect(() => {
    setActiveSpellLevel(sheet.activeSpellLevel);
  }, [sheet.activeSpellLevel, sheet.level, sheet.classId, sheet.paradigm]);

  const magicCopy = shellCopyEs.magic;

  if (sheet.paradigm === 'empty') {
    return (
      <aside className="planner-panel planner-panel--inner magic-sheet">
        <p className="magic-sheet__empty">
          {magicCopy.noCastingStepTitle}
        </p>
      </aside>
    );
  }

  if (sheet.paradigm === 'prepared-summary') {
    return (
      <aside className="planner-panel planner-panel--inner magic-sheet">
        <section className="magic-sheet__group">
          <h3 className="magic-board__section-heading">
            {magicCopy.preparedStepTitle}
          </h3>
          <p>
            {magicCopy.preparedCasterInfo}
          </p>
          <ul>
            {Object.entries(sheet.slotsByLevel)
              .filter(([, slot]) => slot.max > 0)
              .map(([lvl, slot]) => (
                <li key={lvl}>{`Nivel ${lvl}: ${slot.max} ranuras`}</li>
              ))}
          </ul>
        </section>
      </aside>
    );
  }

  if (sheet.paradigm === 'domains') {
    return (
      <aside className="planner-panel planner-panel--inner magic-sheet">
        <DomainTileGrid
          eligibleDomains={sheet.eligibleDomains}
          onSelect={(domainId) => {
            onFocusId(domainId);
            const currentIds = sheet.selectedDomains.map((d) => d.domainId);

            if (currentIds.includes(domainId as CanonicalId)) {
              setDomains(
                sheet.level,
                currentIds.filter((id) => id !== domainId),
              );
            } else if (currentIds.length < 2) {
              setDomains(sheet.level, [
                ...currentIds,
                domainId as CanonicalId,
              ]);
            }
            // else: cap hit — tile already marked blocked by selector.
          }}
          selectedDomainIds={sheet.selectedDomains.map((d) => String(d.domainId))}
        />
      </aside>
    );
  }

  // spellbook or known paradigm
  const sectionHeading =
    sheet.paradigm === 'spellbook'
      ? magicCopy.spellbookStepTitle
      : magicCopy.knownSpellsStepTitle;

  return (
    <aside className="planner-panel planner-panel--inner magic-sheet">
      <SpellLevelTabs
        activeSpellLevel={activeSpellLevel}
        onSelect={setActiveSpellLevel}
        slotsByLevel={sheet.slotsByLevel}
      />
      <section className="magic-sheet__group">
        <h3 className="magic-board__section-heading">{sectionHeading}</h3>
        {sheet.eligibleSpells.map((sp) => (
          <SpellRow
            focused={focusedId === sp.spellId}
            key={sp.spellId}
            onAdd={() => {
              if (sheet.paradigm === 'spellbook') {
                addSpellbookEntry(sheet.level, activeSpellLevel, sp.spellId);
              } else {
                addKnownSpell(sheet.level, activeSpellLevel, sp.spellId);
              }
            }}
            onFocus={() => onFocusId(sp.spellId)}
            onRemove={() => {
              if (sheet.paradigm === 'spellbook') {
                removeSpellbookEntry(sheet.level, activeSpellLevel, sp.spellId);
              } else {
                removeKnownSpell(sheet.level, activeSpellLevel, sp.spellId);
              }
            }}
            option={sp}
          />
        ))}
      </section>
      {sheet.swapAvailable && sheet.paradigm === 'known' && (
        <NwnButton onClick={() => setSwapOpen(true)} variant="primary">
          {magicCopy.swapSpell}
        </NwnButton>
      )}
      {swapOpen && (
        <SwapSpellDialog
          activeSpellLevel={activeSpellLevel}
          classId={sheet.classId}
          eligibleSpells={sheet.eligibleSpells}
          knownSpells={sheet.selectedSpells}
          level={sheet.level}
          onClose={() => setSwapOpen(false)}
        />
      )}
    </aside>
  );
}
