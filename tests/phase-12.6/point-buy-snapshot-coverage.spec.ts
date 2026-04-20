import { describe, expect, it } from 'vitest';
import {
  pointBuySnapshotSchema,
  PUERTA_POINT_BUY_SNAPSHOT,
} from '@rules-engine/foundation/point-buy-snapshot';
import { compiledRaceCatalog } from '@planner/data/compiled-races';

/**
 * Phase 12.6 Plan 06 — snapshot coverage assertions GREEN (ATTR-01 R1 + R2).
 *
 * The loader at packages/rules-engine/src/foundation/point-buy-snapshot.ts
 * calls `pointBuySnapshotSchema.parse(snapshotJson)` at module-load time.
 * If the bundled `puerta-point-buy.json` is malformed, this import throws
 * before any test body runs.
 *
 * Plan 06 (A1b) populated the JSON with 45 per-race curves sourced from
 * `.planning/phases/05-skills-derived-statistics/server-extract/racialtypes.2da`
 * (uniform `AbilitiesPointBuyNumber=30`) plus the user-confirmed NWN1
 * hardcoded engine cost curve (0,1,2,3,4,5,6,8,10,13,16 for scores 8..18).
 *
 * Because the client-side extracted 2DA exposes zero per-race variance in
 * `AbilitiesPointBuyNumber`, and NWN1's cost step function is engine-level
 * (not 2DA-driven), ALL 45 entries share one curve signature. The original
 * Plan 06 Task 1 `sigs.size > 1` variance gate is replaced by a
 * sourced-uniformity assertion (see the provenance doc
 * `packages/rules-engine/src/foundation/data/puerta-point-buy.md` → "Plan 06
 * Source Resolution" for the evidence trail).
 */
describe('Phase 12.6 — point-buy snapshot coverage (SPEC R1+R2, Plan 06)', () => {
  it('PUERTA_POINT_BUY_SNAPSHOT passes pointBuySnapshotSchema (populated)', () => {
    expect(() => pointBuySnapshotSchema.parse(PUERTA_POINT_BUY_SNAPSHOT)).not.toThrow();
  });

  it('pointBuySnapshotSchema rejects malformed curve shapes (fail-closed guard)', () => {
    // budget must be positive int; this payload violates the refinement.
    expect(() =>
      pointBuySnapshotSchema.parse({
        'race:dwarf': {
          budget: -5,
          minimum: 8,
          maximum: 18,
          costByScore: { '8': 0 },
        },
      }),
    ).toThrow();
  });

  it('snapshot covers every race in dedupeByCanonicalId(compiledRaceCatalog.races) — extractor duplicates first-wins (Pitfall 5)', () => {
    const uniqueIds = [...new Set(compiledRaceCatalog.races.map((r) => r.id))];
    const snapshotIds = Object.keys(PUERTA_POINT_BUY_SNAPSHOT);
    expect(snapshotIds.length).toBe(uniqueIds.length);
    for (const id of uniqueIds) {
      expect(snapshotIds).toContain(id);
    }
  });

  it('coverage count uses unique canonical IDs (Pitfall 5 dedupe: race:drow double-emit at sourceRow 164 + 222) — deduped count matches snapshot size', () => {
    const rawCount = compiledRaceCatalog.races.length;
    const uniqueCount = new Set(compiledRaceCatalog.races.map((r) => r.id)).size;
    // Pitfall 5 dedupe contract: raw rows > unique IDs.
    expect(rawCount).toBeGreaterThan(uniqueCount);
    // Snapshot keys match UNIQUE count, not raw.
    expect(Object.keys(PUERTA_POINT_BUY_SNAPSHOT).length).toBe(uniqueCount);
  });

  it('every entry has valid schema constraints: budget>0, min<=max, costByScore keys in [min,max]', () => {
    for (const [, curve] of Object.entries(PUERTA_POINT_BUY_SNAPSHOT)) {
      expect(curve.budget).toBeGreaterThan(0);
      expect(curve.minimum).toBeLessThanOrEqual(curve.maximum);
      for (const key of Object.keys(curve.costByScore)) {
        const score = Number(key);
        expect(score).toBeGreaterThanOrEqual(curve.minimum);
        expect(score).toBeLessThanOrEqual(curve.maximum);
      }
    }
  });

  it('sourced uniformity: curve shape is consistent across all races because client racialtypes.2da exposes uniform AbilitiesPointBuyNumber=30 and NWN1 cost curve is engine-hardcoded', () => {
    // Plan 06 CRITICAL variance-gate override (Option 1): adapt the gate to
    // verify uniformity is truthfully sourced from client 2DA data, not a
    // silent scope reduction. Per the provenance doc's "Plan 06 Source
    // Resolution" section, racialtypes.2da column `AbilitiesPointBuyNumber`
    // is `30` for every playable and non-playable race row; the NWN1 cost
    // step function (0,1,2,3,4,5,6,8,10,13,16) is hardcoded in the client
    // executable, not 2DA-driven. Uniform snapshot therefore IS the
    // truthful state of available server data.
    const signatures = new Set(
      Object.values(PUERTA_POINT_BUY_SNAPSHOT).map((c) =>
        JSON.stringify({ b: c.budget, min: c.minimum, max: c.maximum, c: c.costByScore }),
      ),
    );
    // Exactly ONE signature — any >1 result would indicate hand-authoring
    // drift away from the 2DA-sourced truth; any 0 would mean the snapshot
    // is empty. ONE is the evidenced value.
    expect(signatures.size).toBe(1);
    // Anchor the single signature to the NWN1 baseline curve (0,1,2,3,4,5,6,8,10,13,16).
    const [anchor] = [...Object.values(PUERTA_POINT_BUY_SNAPSHOT)];
    expect(anchor.budget).toBe(30);
    expect(anchor.minimum).toBe(8);
    expect(anchor.maximum).toBe(18);
    expect(anchor.costByScore).toEqual({
      '8': 0,
      '9': 1,
      '10': 2,
      '11': 3,
      '12': 4,
      '13': 5,
      '14': 6,
      '15': 8,
      '16': 10,
      '17': 13,
      '18': 16,
    });
  });
});
