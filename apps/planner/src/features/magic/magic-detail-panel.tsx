import { DetailPanel } from '@planner/components/ui/detail-panel';
import { shellCopyEs } from '@planner/lib/copy/es';

import type { MagicBoardView } from './selectors';

interface MagicDetailPanelProps {
  boardView: MagicBoardView;
  focusedId: string | null;
}

/**
 * Right-pane detail panel for spells and domains. Mirrors feat-detail-panel
 * layout and reuses the `feat-board__prereq-list` BEM selector per UI-SPEC
 * (no new CSS). Falls back to `'Descripción no disponible'` when the catalog
 * has an empty description (fail-closed contract, VALI-02).
 */
export function MagicDetailPanel({
  boardView,
  focusedId,
}: MagicDetailPanelProps) {
  const magicCopy = shellCopyEs.magic;
  const missingDescription = magicCopy.missingDescription;

  if (!focusedId) {
    return (
      <DetailPanel
        body={magicCopy.emptyStateBodyNotReady}
        title={shellCopyEs.stepper.stepTitles.spells}
      />
    );
  }

  const spellOption = [
    ...boardView.activeSheet.eligibleSpells,
    ...boardView.activeSheet.selectedSpells,
  ].find((s) => s.spellId === focusedId);

  if (spellOption) {
    return (
      <DetailPanel className="magic-detail-panel" title={spellOption.label}>
        <div className="detail-panel__body">
          {spellOption.description || missingDescription}
        </div>
        <div className="magic-detail-panel__eyebrow">
          {spellOption.schoolLabel}
        </div>
        {spellOption.blockReason && (
          <ul className="feat-board__prereq-list" role="list">
            <li
              aria-label={`Requisito no cumplido: ${spellOption.blockReason}`}
              className="feat-board__prereq-item is-failed"
              role="listitem"
            >
              <span>
                {magicCopy.rejectionPrefixHard}:{' '}
                {spellOption.blockReason}
              </span>
            </li>
          </ul>
        )}
      </DetailPanel>
    );
  }

  const domainOption = [
    ...boardView.activeSheet.eligibleDomains,
    ...boardView.activeSheet.selectedDomains,
  ].find((d) => d.domainId === focusedId);

  if (domainOption) {
    const bonusEntries = Object.entries(domainOption.bonusSpellLabels).filter(
      ([, labels]) => labels.length > 0,
    );

    return (
      <DetailPanel className="magic-detail-panel" title={domainOption.label}>
        <div className="detail-panel__body">
          {domainOption.description || missingDescription}
        </div>
        {domainOption.grantedFeatLabels.length > 0 ? (
          <section>
            <h4 className="magic-detail-panel__eyebrow">
              {magicCopy.domainGrantHeading}
            </h4>
            <ul>
              {domainOption.grantedFeatLabels.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </section>
        ) : (
          <p className="magic-detail-panel__placeholder">
            {magicCopy.missingGrants}
          </p>
        )}
        {bonusEntries.length > 0 && (
          <section>
            <h4 className="magic-detail-panel__eyebrow">
              {magicCopy.domainBonusSpellsHeading}
            </h4>
            {bonusEntries.map(([lvl, labels]) => (
              <div key={lvl}>
                <strong>{`Nivel ${lvl}:`}</strong> {labels.join(', ')}
              </div>
            ))}
          </section>
        )}
        {domainOption.blockReason && (
          <ul className="feat-board__prereq-list" role="list">
            <li
              className="feat-board__prereq-item is-failed"
              role="listitem"
            >
              <span>{domainOption.blockReason}</span>
            </li>
          </ul>
        )}
      </DetailPanel>
    );
  }

  return <DetailPanel body={missingDescription} title={focusedId} />;
}
