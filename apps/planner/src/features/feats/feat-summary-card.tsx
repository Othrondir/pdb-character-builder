import { NwnFrame } from '@planner/components/ui/nwn-frame';
import { NwnButton } from '@planner/components/ui/nwn-button';
import { shellCopyEs } from '@planner/lib/copy/es';

/**
 * Phase 12.4-07 (SPEC R5 / CONTEXT D-04) — collapsed feat-picker state.
 *
 * When the per-level `chosen === slots` predicate flips true, <FeatBoard />
 * renders this summary card instead of the full picker. Card enumerates the
 * user's chosen feats + a right-aligned `Modificar selección` button that
 * re-expands the list. No animated collapse — instant swap matches NWN1
 * static UI feel (CONTEXT D-04 rationale).
 */
export interface FeatSummaryChosenEntry {
  featId: string;
  label: string;
}

export interface FeatSummaryCardProps {
  chosenFeats: FeatSummaryChosenEntry[];
  onModify: () => void;
}

export function FeatSummaryCard({ chosenFeats, onModify }: FeatSummaryCardProps) {
  return (
    <NwnFrame as="section" className="feat-summary-card">
      <ul className="feat-summary-card__list">
        {chosenFeats.map((feat) => (
          <li className="feat-summary-card__item" key={feat.featId}>
            {feat.label}
          </li>
        ))}
      </ul>
      <NwnButton
        className="feat-summary-card__modify"
        onClick={onModify}
        variant="auxiliary"
      >
        {shellCopyEs.feats.modifySelectionLabel}
      </NwnButton>
    </NwnFrame>
  );
}
