import { shellCopyEs } from '@planner/lib/copy/es';

import type { DomainOptionView } from './selectors';

interface DomainTileGridProps {
  eligibleDomains: DomainOptionView[];
  onSelect: (domainId: string) => void;
  selectedDomainIds: string[];
}

/**
 * Cleric-L1 domain grid. 2-column listbox of domain tiles. Each tile shows the
 * domain label, the granted-feat count eyebrow (APTITUDES) when present, and
 * the block reason when the tile is ineligible.
 */
export function DomainTileGrid({
  eligibleDomains,
  onSelect,
}: DomainTileGridProps) {
  const magicCopy = shellCopyEs.magic;

  return (
    <div
      aria-label={magicCopy.domainsStepTitle}
      className="magic-board__domain-grid"
      role="listbox"
    >
      {eligibleDomains.map((d) => {
        const stateClass = d.selected
          ? 'is-selected'
          : d.blocked
            ? 'is-ineligible-hard'
            : 'is-eligible';

        return (
          <button
            aria-disabled={d.blocked && !d.selected}
            aria-selected={d.selected}
            className={`magic-board__domain-tile ${stateClass}`}
            disabled={d.blocked && !d.selected}
            key={d.domainId}
            onClick={() => onSelect(d.domainId)}
            role="option"
            type="button"
          >
            <span className="magic-board__domain-tile-label">{d.label}</span>
            {d.grantedFeatLabels.length > 0 && (
              <span className="magic-board__domain-tile-eyebrow">
                {magicCopy.domainGrantHeading}:{' '}
                {d.grantedFeatLabels.length}
              </span>
            )}
            {d.missingData && (
              <span className="magic-board__domain-tile-eyebrow">
                {magicCopy.missingGrants}
              </span>
            )}
            {d.blockReason && !d.selected && (
              <span className="magic-board__domain-tile-reason">
                {d.blockReason}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
