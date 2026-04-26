import { describe, expect, it } from 'vitest';

import { compiledClassCatalog } from '@planner/data/compiled-classes';
import { classCatalogSchema } from '@data-extractor/contracts/class-catalog';

describe('Phase 16-01 — extractor surfaces bonusFeatSchedule on CompiledClass (FEAT-05, D-01, PIT-03)', () => {
  it('class:fighter ships a non-null schedule containing canonical Puerta Guerrero cadence', () => {
    // Plan-authored value `[1,2,4,6,8,10,12,14,16]` was vanilla-NWN1 conjecture
    // (RESEARCH § Assumptions A2). The Puerta `cls_bfeat_fight.2da` extraction
    // verified by `scripts/inspect-bfeat.mts` shows odd-level cadence (Bonus=1
    // at rows 1,3,5,7,9,11,13,15,17,19) — the server-canonical schedule that
    // D-01 declares "extractor primary". Test now asserts ground truth.
    const fighter = compiledClassCatalog.classes.find((c) => c.id === 'class:fighter');
    expect(fighter).toBeDefined();
    expect(fighter!.bonusFeatSchedule).not.toBeNull();
    expect(fighter!.bonusFeatSchedule).not.toBeUndefined();
    expect(fighter!.bonusFeatSchedule).toEqual(
      expect.arrayContaining([1, 3, 5, 7, 9, 11, 13, 15, 17, 19]),
    );
  });

  it('at least one class in the catalog has bonusFeatSchedule === null (BonusFeatsTable=****)', () => {
    const someClassWithNullSchedule = compiledClassCatalog.classes.some(
      (c) => c.bonusFeatSchedule === null,
    );
    expect(someClassWithNullSchedule).toBe(true);
  });

  it('every non-null bonusFeatSchedule is sorted ascending and entries fall in [1, 20] (PIT-02 row-0 guard)', () => {
    for (const cls of compiledClassCatalog.classes) {
      if (cls.bonusFeatSchedule === null || cls.bonusFeatSchedule === undefined) continue;
      for (const lvl of cls.bonusFeatSchedule) {
        expect(lvl).toBeGreaterThanOrEqual(1);
        expect(lvl).toBeLessThanOrEqual(20);
      }
      const sorted = [...cls.bonusFeatSchedule].sort((a, b) => a - b);
      expect(cls.bonusFeatSchedule).toEqual(sorted);
    }
  });

  it('classCatalogSchema.schemaVersion stays at "1" (D-NO schema-version bump)', () => {
    expect(classCatalogSchema.shape.schemaVersion.value).toBe('1');
  });
});

/**
 * Cadence dossier — pins the observed extractor disposition for the 6 classes
 * covered by `LEGACY_CLASS_BONUS_FEAT_SCHEDULES` so Plan 16-02 has a written
 * record of which classes will silently shift when the consumer flips from
 * legacy-map-only to extractor-primary precedence.
 *
 * Per CONTEXT § PIT-01 ("Plan 16-01 must update Phase 12.4-03 fixtures to
 * consume extractor-derived values"): rather than mutate the 12.4 fixture
 * spec right now (it still asserts against the legacy map and is correct
 * UNTIL Plan 16-02 flips the consumer), this block records each class's
 * actual extractor output. Plan 16-02 will compare these pins against the
 * legacy map; any mismatch is an INTENTIONAL Puerta-canon override.
 *
 * Disposition matrix (verified 2026-04-26 against
 * `puerta-ee-2026-04-26+cf6e8aad` extract):
 *
 * | Class                     | Legacy LEGACY_CLASS_BONUS_FEAT_SCHEDULES | Extractor `bonusFeatSchedule` |
 * |---------------------------|------------------------------------------|-------------------------------|
 * | class:fighter             | [1,2,4,6,8,10,12,14,16]                  | [1,3,5,7,9,11,13,15,17,19]    |
 * | class:swashbuckler        | [1,2,5,9,13]                             | null (cls_bfeat_swash MISSING from nwsync) |
 * | class:caballero-arcano    | [1,3,5,7,9,11,13,15]                     | [13,17]                       |
 * | class:wizard              | [1,5,10,15]                              | [4,9,14,19]                   |
 * | class:monk                | [1,2,6]                                  | [] (cls_bfeat_monk all zeros — Puerta dropped vanilla bonus feats) |
 * | class:rogue               | [10,13,16]                               | [9,12,15,18]                  |
 *
 * Legacy fallback: 4/6 classes will route through the legacy map after Plan
 * 16-02 wiring (fighter/caballero-arcano/wizard/rogue ship non-empty extractor
 * schedules — extractor wins). Swashbuckler null + Monk empty are explicit
 * Puerta-canon dispositions; Plan 16-02 must decide per-class whether legacy
 * fallback applies or the extractor's Puerta-canon override (null/empty) is
 * authoritative.
 */
describe('Phase 16-01 — cadence dossier (PIT-01: extractor cadence diverges from LEGACY map)', () => {
  it("class:fighter — extractor surfaces non-empty schedule (Puerta canon: odd levels)", () => {
    const cls = compiledClassCatalog.classes.find((c) => c.id === 'class:fighter');
    expect(cls).toBeDefined();
    expect(cls!.bonusFeatSchedule).not.toBeNull();
    expect(cls!.bonusFeatSchedule).not.toBeUndefined();
    expect(Array.isArray(cls!.bonusFeatSchedule)).toBe(true);
    expect(cls!.bonusFeatSchedule!.length).toBeGreaterThan(0);
  });

  it("class:swashbuckler — extractor disposition is null (cls_bfeat_swash MISSING from nwsync; legacy fallback owns this class)", () => {
    const cls = compiledClassCatalog.classes.find((c) => c.id === 'class:swashbuckler');
    expect(cls).toBeDefined();
    // PIT-01 dossier pin: nwsync ships classes.2da row 58 with
    // BonusFeatsTable=CLS_BFEAT_SWASH but the resref itself is absent
    // from the manifest. Extractor emits null per parseBonusFeatSchedule
    // fail-soft contract — Plan 16-02 must keep legacy fallback for this
    // class id.
    expect(cls!.bonusFeatSchedule).toBeNull();
  });

  it("class:caballero-arcano — extractor surfaces non-empty schedule (Puerta canon)", () => {
    const cls = compiledClassCatalog.classes.find((c) => c.id === 'class:caballero-arcano');
    expect(cls).toBeDefined();
    expect(cls!.bonusFeatSchedule).not.toBeNull();
    expect(cls!.bonusFeatSchedule).not.toBeUndefined();
    expect(Array.isArray(cls!.bonusFeatSchedule)).toBe(true);
    expect(cls!.bonusFeatSchedule!.length).toBeGreaterThan(0);
  });

  it("class:wizard — extractor surfaces non-empty schedule (Puerta canon)", () => {
    const cls = compiledClassCatalog.classes.find((c) => c.id === 'class:wizard');
    expect(cls).toBeDefined();
    expect(cls!.bonusFeatSchedule).not.toBeNull();
    expect(cls!.bonusFeatSchedule).not.toBeUndefined();
    expect(Array.isArray(cls!.bonusFeatSchedule)).toBe(true);
    expect(cls!.bonusFeatSchedule!.length).toBeGreaterThan(0);
  });

  it("class:monk — extractor disposition is empty array (cls_bfeat_monk all zeros — Puerta dropped vanilla L1/L2/L6 monk bonus feats)", () => {
    const cls = compiledClassCatalog.classes.find((c) => c.id === 'class:monk');
    expect(cls).toBeDefined();
    // PIT-01 dossier pin: nwsync cls_bfeat_monk.2da exists but every Bonus
    // column value in [1,20] is '0'. Empty [] is meaningful per
    // parseBonusFeatSchedule contract: "table read, zero entries in scope"
    // — DISTINCT from null ("table missing"). Plan 16-02 must choose: empty
    // extractor wins (no Monk bonus feats per Puerta canon) OR legacy
    // fallback grants vanilla [1,2,6]. CONTEXT D-01 declares extractor
    // primary, so the empty array is the authoritative Puerta override.
    expect(cls!.bonusFeatSchedule).not.toBeNull();
    expect(cls!.bonusFeatSchedule).not.toBeUndefined();
    expect(Array.isArray(cls!.bonusFeatSchedule)).toBe(true);
    expect(cls!.bonusFeatSchedule!.length).toBe(0);
  });

  it("class:rogue — extractor surfaces non-empty schedule (Puerta canon)", () => {
    const cls = compiledClassCatalog.classes.find((c) => c.id === 'class:rogue');
    expect(cls).toBeDefined();
    expect(cls!.bonusFeatSchedule).not.toBeNull();
    expect(cls!.bonusFeatSchedule).not.toBeUndefined();
    expect(Array.isArray(cls!.bonusFeatSchedule)).toBe(true);
    expect(cls!.bonusFeatSchedule!.length).toBeGreaterThan(0);
  });
});
