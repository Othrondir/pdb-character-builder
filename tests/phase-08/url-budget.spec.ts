import { describe, it, expect } from 'vitest';
import {
  MAX_ENCODED_PAYLOAD_LENGTH,
  SHARE_URL_HASH_PREFIX,
  buildShareUrl,
  exceedsBudget,
} from '@planner/features/persistence';

describe('url-budget', () => {
  it('MAX_ENCODED_PAYLOAD_LENGTH is 1900', () => {
    expect(MAX_ENCODED_PAYLOAD_LENGTH).toBe(1900);
  });

  it("SHARE_URL_HASH_PREFIX is literal '#/share?b='", () => {
    expect(SHARE_URL_HASH_PREFIX).toBe('#/share?b=');
  });

  it('exceedsBudget is tight at the 1900 char boundary', () => {
    expect(exceedsBudget('a'.repeat(1900))).toBe(false);
    expect(exceedsBudget('a'.repeat(1901))).toBe(true);
  });

  it('exceedsBudget is false for empty payload', () => {
    expect(exceedsBudget('')).toBe(false);
  });

  it('buildShareUrl composes bare origin + hash prefix + payload', () => {
    expect(buildShareUrl('xyz', 'https://user.github.io')).toBe(
      'https://user.github.io/#/share?b=xyz',
    );
  });

  it('buildShareUrl preserves a sub-path origin (GitHub Pages project site)', () => {
    const url = buildShareUrl('xyz', 'https://user.github.io/pdb-character-builder');
    expect(url).toContain('/pdb-character-builder/');
    expect(url).toContain(SHARE_URL_HASH_PREFIX);
    expect(url).toBe('https://user.github.io/pdb-character-builder/#/share?b=xyz');
  });

  it('buildShareUrl collapses trailing slash on origin', () => {
    expect(buildShareUrl('xyz', 'https://user.github.io/')).toBe(
      'https://user.github.io/#/share?b=xyz',
    );
  });
});
