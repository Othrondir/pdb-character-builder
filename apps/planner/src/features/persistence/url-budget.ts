/**
 * URL-length budget for shareable build payloads.
 *
 * Budget math (D-06 + RESEARCH.md Pitfall 4):
 *   - Browser URL bar practical limit: ~8000 chars
 *   - Discord message: ~2000 chars
 *   - Twitter tweet: ~280 chars
 *   - Email client rewrites: ~2000 chars
 *
 * We target Discord + email compatibility by budgeting 2048 chars total URL.
 * Subtract hash prefix (`#/share?b=` = 10 chars) + safe host/protocol overhead (~138 chars).
 *   => MAX_ENCODED_PAYLOAD_LENGTH = 1900.
 *
 * Worst-case 20-level build encodes to ~3200-4200 chars (extrapolated from
 * RESEARCH.md A2 16-level baseline × 20/16 — UAT-2026-04-20 P6). Fallback to
 * JSON export is likely for full-progression shares; tier-1..tier-3 still fit.
 *
 * This constant is the ONE knob to tune if real-world telemetry shows fallback is too
 * aggressive or too lax. Do not inline this number anywhere else.
 */
export const MAX_ENCODED_PAYLOAD_LENGTH = 1900;
export const SHARE_URL_HASH_PREFIX = '#/share?b=';

/**
 * Phase 14-04: defensive guard. Collapses any sequence of 2+ slashes into a single
 * slash EXCEPT immediately after a scheme (`://`). The regex requires a non-colon
 * character before the run, so `https://x.com` is preserved verbatim.
 *
 * This is belt-and-braces: the trim logic in `buildShareUrl` is the primary path;
 * this helper survives any future pathname / origin edge case (e.g., embed iframes,
 * `file://` shells, hand-constructed test origins).
 */
function collapseDoubleSlash(url: string): string {
  return url.replace(/([^:])\/{2,}/g, '$1/');
}

export function exceedsBudget(encoded: string): boolean {
  return encoded.length > MAX_ENCODED_PAYLOAD_LENGTH;
}

/**
 * Construct a full share URL from an encoded payload.
 *
 * Semantics:
 *   buildShareUrl('xyz', 'https://user.github.io')
 *     -> 'https://user.github.io/#/share?b=xyz'
 *   buildShareUrl('xyz', 'https://user.github.io/pdb-character-builder')
 *     -> 'https://user.github.io/pdb-character-builder/#/share?b=xyz'
 *
 * When no `origin` is supplied, we derive one from `window.location.origin` plus the
 * current pathname (so the URL still works when the planner is deployed to a GitHub Pages
 * sub-path such as `/pdb-character-builder/`).
 *
 * Phase 14-04: every return path passes through `collapseDoubleSlash` so a stray `//`
 * (from a doubly-trailing origin or a quirky `window.location.pathname`) cannot leak
 * into the share URL. The trim logic above remains the primary path; the regex is a
 * safety net for edge cases the trim does not cover (e.g., `pathname='//foo//'`).
 */
export function buildShareUrl(encoded: string, origin?: string): string {
  if (origin !== undefined) {
    const trimmed = origin.endsWith('/') ? origin.slice(0, -1) : origin;
    return collapseDoubleSlash(`${trimmed}/${SHARE_URL_HASH_PREFIX}${encoded}`);
  }
  if (typeof window === 'undefined') {
    return collapseDoubleSlash(`/${SHARE_URL_HASH_PREFIX}${encoded}`);
  }
  const base = window.location.origin;
  const pathname = window.location.pathname;
  const trimmedPath = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  return collapseDoubleSlash(
    `${base}${trimmedPath}/${SHARE_URL_HASH_PREFIX}${encoded}`,
  );
}
