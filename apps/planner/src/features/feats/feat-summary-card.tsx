import { NwnFrame } from '@planner/components/ui/nwn-frame';
import { NwnButton } from '@planner/components/ui/nwn-button';
import { shellCopyEs } from '@planner/lib/copy/es';
import type { FeatSummaryChosenEntry } from './selectors';

/**
 * Phase 12.4-07 (SPEC R5 / CONTEXT D-04) — collapsed feat-picker state.
 * Phase 12.8-03 (D-05 + D-06, UAT-2026-04-23 F4) — per-chip × deselect.
 *
 * When the per-level `chosen === slots` predicate flips true, <FeatBoard />
 * renders this summary card instead of the full picker. Each chip carries
 * an inline × button that clears its own slot; the "Modificar selección"
 * button still re-expands the full sheet (Phase 12.4-07 contract).
 * No animation — Phase 12.4-07 D-04 locked "instant swap matches NWN1
 * static UI feel" and 12.8 preserves that.
 */

export type { FeatSummaryChosenEntry };

export interface FeatSummaryCardProps {
  chosenFeats: FeatSummaryChosenEntry[];
  onModify: () => void;
  /**
   * Phase 12.8-03 (D-06) — per-chip deselect callback. Parent resolves
   * (slotKind, slotIndex) to the correct store action. Passing as a single
   * callback (not two separate props) keeps the component agnostic.
   */
  onDeselect: (entry: FeatSummaryChosenEntry) => void;
}

export function FeatSummaryCard({
  chosenFeats,
  onModify,
  onDeselect,
}: FeatSummaryCardProps) {
  return (
    <NwnFrame as="section" className="feat-summary-card">
      <ul className="feat-summary-card__list">
        {chosenFeats.map((feat) => (
          <li
            className="feat-summary-card__item"
            data-slot-kind={feat.slotKind}
            data-slot-index={feat.slotIndex}
            key={`${feat.slotKind}:${feat.slotIndex}:${feat.featId}`}
          >
            <span className="feat-summary-card__label">{feat.label}</span>
            <button
              aria-label={`${shellCopyEs.feats.deselectChipAriaLabel}: ${feat.label}`}
              className="feat-summary-card__deselect"
              data-testid={`deselect-chip-${feat.slotKind}-${feat.slotIndex}`}
              onClick={() => onDeselect(feat)}
              type="button"
            >
              ×
            </button>
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
