import { describe, it, expect } from 'vitest';
import { phase03FoundationFixture } from '@planner/features/character-foundation/foundation-fixture';

// Phase 12.8-04 (D-11, UAT-2026-04-23 F6) — race roster dedupe lock.
// Live master at UAT date shipped 45 rows with `Semielfo` appearing twice.
// Root cause: extractor emits race:halfelf + race:halfelf2 with identical
// label. D-11 fix — delete race:halfelf2 at the data source.

describe('Phase 12.8-04 — race roster dedupe', () => {
  const races = phase03FoundationFixture.races;

  it('total race count is at most 44 (was 45 at UAT-2026-04-23)', () => {
    expect(races.length).toBeLessThanOrEqual(44);
  });

  it('label "Semielfo" appears exactly once', () => {
    const semielfoRows = races.filter((r) => r.label === 'Semielfo');
    expect(semielfoRows).toHaveLength(1);
  });

  it('canonical id "race:halfelf2" is not present', () => {
    expect(races.find((r) => r.id === 'race:halfelf2')).toBeUndefined();
  });

  it('canonical id "race:halfelf" is preserved (primary Semielfo row)', () => {
    const halfelf = races.find((r) => r.id === 'race:halfelf');
    expect(halfelf).toBeDefined();
    expect(halfelf?.label).toBe('Semielfo');
  });

  it('all race ids are unique', () => {
    const ids = races.map((r) => r.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
