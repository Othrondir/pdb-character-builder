/**
 * Shared sentinel-label predicate for catalog assemblers.
 *
 * BioWare + NWN EE sentinel conventions observed in 2DA LABEL column:
 *   - "DELETED" literal (Puerta snapshot: compiled-feats.ts sourceRow
 *     385 + 403 before 12.4-01 refresh).
 *   - "DELETED_*" family (NWN Cut Feats wiki:
 *     https://nwn.wiki/spaces/NWN1/pages/38175424/Cut+Feats).
 *   - "PADDING" (CEP reserved-range convention).
 *   - "****" — cell-level already null-converted by two-da-parser.ts,
 *     but a row-level LABEL cell containing 3+ stars is also sentinel.
 *   - "UNUSED" (SPEC R8 constraint).
 *
 * Implementation notes:
 *   - Case-insensitive (BioWare content often mixes casings across 2DAs).
 *   - Tolerant of surrounding whitespace.
 *   - Accepts surrounding `***…***` decoration around the core token.
 *   - Allows `DELETED_*` / `UNUSED_*` / `PADDING_*` (underscore-suffix
 *     family — reserves the extractor against future sentinel variants
 *     without widening to any-token-with-underscore).
 *
 * Contract (locked by tests/phase-12.4/extractor-deleted-sentinel.spec.ts):
 *   - isSentinelLabel(null | undefined | '')  === false
 *   - isSentinelLabel('DELETED')               === true
 *   - isSentinelLabel('***DELETED***')         === true
 *   - isSentinelLabel('*** DELETED ***')       === true
 *   - isSentinelLabel('DELETED_EPIC')          === true
 *   - isSentinelLabel('****')                  === true
 *   - isSentinelLabel('*****')                 === true
 *   - isSentinelLabel('Esquiva')               === false
 *
 * Callers: feat/skill/class/race assemblers drop matching rows before
 * emission; apps/planner/src/features/feats/selectors.ts applies a
 * belt-and-braces filter so any residual sentinel never reaches render.
 */
export const SENTINEL_REGEX =
  /^(\s*\*{3,}\s*(DELETED|UNUSED|PADDING)\s*\*{3,}\s*|\s*(DELETED|UNUSED|PADDING)(_.*)?\s*|\s*\*{3,}\s*)$/i;

export function isSentinelLabel(
  label: string | null | undefined,
): boolean {
  if (label === null || label === undefined) return false;
  const trimmed = label.trim();
  if (trimmed.length === 0) return false;
  return SENTINEL_REGEX.test(trimmed);
}
