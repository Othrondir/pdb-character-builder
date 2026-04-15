import { describe, it, expect, beforeAll } from 'vitest';

import { TlkResolver } from '@data-extractor/readers/tlk-resolver';
import type { TlkTable } from '@data-extractor/parsers/tlk-parser';
import { CUSTOM_TLK_OFFSET } from '@data-extractor/config';

// ---------------------------------------------------------------------------
// Helpers: synthetic TlkTable mocks
// ---------------------------------------------------------------------------

function mockTlkTable(entries: Record<number, string>): TlkTable {
  const maxIndex = Math.max(...Object.keys(entries).map(Number), -1);
  return {
    stringCount: maxIndex + 1,
    getString(index: number): string {
      return entries[index] ?? '';
    },
  };
}

// ---------------------------------------------------------------------------
// Unit tests for TlkResolver
// ---------------------------------------------------------------------------
describe('TlkResolver', () => {
  const baseTlk = mockTlkTable({
    0: 'Fighter',
    1: 'Rogue',
    5: 'Cleric',
    134: 'Guerrero',
  });

  const customTlk = mockTlkTable({
    100: 'Paladin Sagrado',
    200: 'Maestro Palido',
    0: 'Custom Entry Zero',
  });

  let resolver: TlkResolver;

  beforeAll(() => {
    resolver = new TlkResolver(baseTlk, customTlk);
  });

  it('resolves base TLK strrefs (< CUSTOM_TLK_OFFSET)', () => {
    expect(resolver.resolve(0)).toBe('Fighter');
    expect(resolver.resolve(1)).toBe('Rogue');
    expect(resolver.resolve(5)).toBe('Cleric');
    expect(resolver.resolve(134)).toBe('Guerrero');
  });

  it('resolves custom TLK strrefs (>= CUSTOM_TLK_OFFSET)', () => {
    // strref = CUSTOM_TLK_OFFSET + 100 = 16777316
    expect(resolver.resolve(CUSTOM_TLK_OFFSET + 100)).toBe('Paladin Sagrado');
    expect(resolver.resolve(CUSTOM_TLK_OFFSET + 200)).toBe('Maestro Palido');
  });

  it('resolves custom TLK strref at offset 0 correctly', () => {
    // strref = CUSTOM_TLK_OFFSET + 0 = 16777216
    expect(resolver.resolve(CUSTOM_TLK_OFFSET)).toBe('Custom Entry Zero');
  });

  it('returns empty string for negative strrefs', () => {
    expect(resolver.resolve(-1)).toBe('');
    expect(resolver.resolve(-100)).toBe('');
  });

  it('returns empty string for NaN/undefined strrefs', () => {
    expect(resolver.resolve(NaN)).toBe('');
    expect(resolver.resolve(undefined as unknown as number)).toBe('');
  });

  it('returns empty string for strrefs with no text in TLK', () => {
    // strref 999 is within stringCount range but has no entry in the mock
    expect(resolver.resolve(999)).toBe('');
  });

  it('returns empty string for custom strref with no text', () => {
    // A custom strref that has no entry in the custom TLK mock
    expect(resolver.resolve(CUSTOM_TLK_OFFSET + 99999)).toBe('');
  });
});
