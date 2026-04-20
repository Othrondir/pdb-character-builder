import { describe, expect, it } from 'vitest';
import {
  pointBuySnapshotSchema,
  PUERTA_POINT_BUY_SNAPSHOT,
} from '@rules-engine/foundation/point-buy-snapshot';

/**
 * Phase 12.6 Plan 02 — snapshot loader GREEN path.
 *
 * The loader at packages/rules-engine/src/foundation/point-buy-snapshot.ts
 * calls `pointBuySnapshotSchema.parse(snapshotJson)` at module-load time.
 * If the bundled `puerta-point-buy.json` is malformed, this import throws
 * before any test body runs — so the "covers every race" assertion is
 * deferred to Plan 06 (A1b), which delivers real per-race curves.
 *
 * Plan 02 asserts only:
 *   1. The empty snapshot `{}` loads without throwing (module-load parse).
 *   2. `pointBuySnapshotSchema.parse({})` is idempotently valid (the
 *      empty record shape satisfies `z.record(canonicalRaceIdSchema, ...)`).
 *   3. Malformed curve shapes are rejected (fail-closed gate).
 *
 * The "covers every race in dedupeByCanonicalId(compiledRaceCatalog.races)"
 * and "45-race coverage count" assertions remain `it.todo` — they are
 * Plan 06's acceptance criteria.
 */
describe('Phase 12.6 — point-buy snapshot loader (SPEC R1, Plan 02)', () => {
  it('PUERTA_POINT_BUY_SNAPSHOT passes pointBuySnapshotSchema (empty object is valid)', () => {
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

  it.todo(
    'coverage: snapshot covers every race in dedupeByCanonicalId(compiledRaceCatalog.races) — BLOCKED on Plan 06 A1b user-delivered data',
  );

  it.todo(
    'coverage count uses unique canonical IDs (Pitfall 5 dedupe: race:drow double-emit at sourceRow 196+676) — BLOCKED on Plan 06',
  );
});
