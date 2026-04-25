import { afterEach, describe, it, expect, vi } from 'vitest';
import {
  buildShareUrl,
  SHARE_URL_HASH_PREFIX,
} from '@planner/features/persistence/url-budget';

/**
 * Phase 14-04 — permutation matrix for double-slash safety in `buildShareUrl`.
 *
 * Sentinel regex: matches a `//` run that is NOT preceded by a `:` (so the
 * scheme `://` is excluded). Any URL produced by `buildShareUrl` must NOT
 * match this pattern, regardless of caller-supplied origin shape or
 * `window.location.pathname` value.
 *
 * The 10 cases below exercise: doubly-trailing origin, sub-path doubly-trailing,
 * baseline no-trailing origin, mocked window with `//foo//` pathname, empty
 * pathname, single-trailing pathname, scheme preservation, SSR fallback,
 * empty payload, and a sentinel sweep across all earlier outputs.
 */
const NO_DOUBLE_SLASH = /(?<!:)\/\//;

describe('buildShareUrl — double-slash safety (Phase 14-04)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('M1: collapses a doubly-trailing slash on bare origin arg', () => {
    expect(buildShareUrl('xyz', 'https://x.com//')).toBe(
      'https://x.com/#/share?b=xyz',
    );
  });

  it('M2: collapses a doubly-trailing slash on sub-path origin arg', () => {
    expect(buildShareUrl('xyz', 'https://x.com/sub//')).toBe(
      'https://x.com/sub/#/share?b=xyz',
    );
  });

  it('M3: locks baseline no-trailing-slash origin arg', () => {
    expect(buildShareUrl('xyz', 'https://x.com')).toBe(
      'https://x.com/#/share?b=xyz',
    );
  });

  it('M4: window pathname `//foo//` collapses to single slashes', () => {
    vi.stubGlobal('window', {
      location: { origin: 'https://x.com', pathname: '//foo//' },
    });
    const url = buildShareUrl('xyz');
    expect(url).toBe('https://x.com/foo/#/share?b=xyz');
  });

  it('M5: window pathname empty string yields single slash before hash', () => {
    vi.stubGlobal('window', {
      location: { origin: 'https://x.com', pathname: '' },
    });
    expect(buildShareUrl('xyz')).toBe('https://x.com/#/share?b=xyz');
  });

  it('M6: window pathname `/foo//` collapses trailing run', () => {
    vi.stubGlobal('window', {
      location: { origin: 'https://x.com', pathname: '/foo//' },
    });
    expect(buildShareUrl('xyz')).toBe('https://x.com/foo/#/share?b=xyz');
  });

  it('M7: scheme `://` is preserved (not collapsed)', () => {
    const url = buildShareUrl('xyz', 'https://x.com//');
    expect(url.includes('://')).toBe(true);
    // The only `//` substring in any output should be the one inside `://`.
    const matches = url.match(/\/\//g);
    expect(matches?.length).toBe(1);
  });

  it('M8: SSR fallback (window undefined) emits no double slash', () => {
    vi.stubGlobal('window', undefined);
    const url = buildShareUrl('xyz');
    expect(url).not.toMatch(NO_DOUBLE_SLASH);
  });

  it('M9: empty encoded payload locks no extra slash', () => {
    expect(buildShareUrl('', 'https://x.com/')).toBe(
      'https://x.com/#/share?b=',
    );
  });

  it('M10: sentinel — none of M1..M9 outputs contain a non-scheme `//`', () => {
    // Re-run M1..M9 inputs and assert each output is sentinel-clean. Cases that
    // touch `window` are stubbed inline; cases that pass an explicit origin do
    // not need a stub (function short-circuits on the first branch).

    // M1
    expect(buildShareUrl('xyz', 'https://x.com//')).not.toMatch(
      NO_DOUBLE_SLASH,
    );
    // M2
    expect(buildShareUrl('xyz', 'https://x.com/sub//')).not.toMatch(
      NO_DOUBLE_SLASH,
    );
    // M3
    expect(buildShareUrl('xyz', 'https://x.com')).not.toMatch(NO_DOUBLE_SLASH);

    // M4
    vi.stubGlobal('window', {
      location: { origin: 'https://x.com', pathname: '//foo//' },
    });
    expect(buildShareUrl('xyz')).not.toMatch(NO_DOUBLE_SLASH);

    // M5
    vi.stubGlobal('window', {
      location: { origin: 'https://x.com', pathname: '' },
    });
    expect(buildShareUrl('xyz')).not.toMatch(NO_DOUBLE_SLASH);

    // M6
    vi.stubGlobal('window', {
      location: { origin: 'https://x.com', pathname: '/foo//' },
    });
    expect(buildShareUrl('xyz')).not.toMatch(NO_DOUBLE_SLASH);

    // M7 — same input as M1 already covered above; sentinel is the assertion.

    // M8
    vi.stubGlobal('window', undefined);
    expect(buildShareUrl('xyz')).not.toMatch(NO_DOUBLE_SLASH);

    // M9
    expect(buildShareUrl('', 'https://x.com/')).not.toMatch(NO_DOUBLE_SLASH);

    // Final assertion: the literal hash prefix is exactly one slash before `#`.
    expect(SHARE_URL_HASH_PREFIX).toBe('#/share?b=');
  });
});
