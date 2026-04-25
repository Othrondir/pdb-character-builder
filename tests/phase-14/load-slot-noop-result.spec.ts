/**
 * Phase 14-02 — loadSlot LoadSlotResult discriminated-union regression spec.
 *
 * Locks ROADMAP SC#2 + SC#7 (Phase 14): loadSlot(name) returns a typed
 * discriminated union {kind: 'ok' | 'not-found' | 'invalid'} instead of
 * either `BuildDocument | null` (which silently elides ZodError-throw on
 * .parse failure on tampered Dexie rows / cross-version drift).
 *
 * RED state proof (pre-fix):
 *   - B1 fails because loadSlot('does-not-exist') currently resolves `null`
 *     not `{kind: 'not-found'}`.
 *   - B2 fails because the OK branch resolves `BuildDocument` directly,
 *     not `{kind: 'ok', doc}`.
 *   - B3 fails because a tampered row throws `ZodError` instead of
 *     resolving `{kind: 'invalid', reason}`.
 *   - B4 sentinel fails because the resolved value is `null`, not the
 *     union shape.
 *   - B5 type sentinel fails to typecheck because `LoadSlotResult` is
 *     not yet exported from the persistence barrel.
 *
 * Pure-logic spec (no DOM) — `.spec.ts`, NOT `.spec.tsx`. Pure node env;
 * no `// @vitest-environment jsdom` directive.
 */
import { beforeEach, describe, it, expect } from 'vitest';
// Side-effect import for fake-indexeddb polyfill.
import '../phase-08/setup';
import { sampleBuildDocument } from '../phase-08/setup';
import {
  saveSlot,
  loadSlot,
} from '@planner/features/persistence/slot-api';
import type { LoadSlotResult } from '@planner/features/persistence';
import {
  __resetPlannerDbForTests,
  getPlannerDb,
} from '@planner/features/persistence/dexie-db';

describe('loadSlot LoadSlotResult discriminated union (Phase 14-02)', () => {
  beforeEach(async () => {
    // Mirror tests/phase-08/slot-api.spec.ts:14-25 exactly — close the
    // Dexie singleton + wipe IndexedDB between tests so prior fixtures
    // do not leak.
    __resetPlannerDbForTests();
    const fakeIDB = (globalThis as unknown as { indexedDB: IDBFactory })
      .indexedDB;
    await new Promise<void>((resolve) => {
      const req = fakeIDB.deleteDatabase('pdb-character-builder');
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    });
  });

  // B1: not-found arm — no row in Dexie.
  it('returns {kind: "not-found"} when the slot does not exist', async () => {
    const result = await loadSlot('does-not-exist');
    expect(result).toEqual({ kind: 'not-found' });
  });

  // B2: ok arm — round-trip identity preserved at result.doc.build.raceId.
  it('returns {kind: "ok", doc} after a successful saveSlot round-trip', async () => {
    const doc = sampleBuildDocument();
    await saveSlot('round-trip', doc);

    const result = await loadSlot('round-trip');
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.doc.build.raceId).toBe('race:human');
    }
  });

  // B3: invalid arm — bypass saveSlot and inject a tampered Dexie row whose
  // payload fails buildDocumentSchema.parse (schemaVersion is z.literal(2),
  // 99 violates the literal).
  it('returns {kind: "invalid", reason} when the underlying row fails schema validation', async () => {
    const valid = sampleBuildDocument();
    const tampered = { ...valid, schemaVersion: 99 };
    await getPlannerDb().builds.put({
      name: 'tampered',
      // Cast to bypass the BuildSlotRow.payload BuildDocument type — the
      // whole point of B3 is that a malformed payload survived past the
      // type system (extension tampering / cross-version drift).
      payload: tampered as unknown as ReturnType<typeof sampleBuildDocument>,
      createdAt: 0,
      updatedAt: 0,
    });

    const result = await loadSlot('tampered');
    expect(result.kind).toBe('invalid');
    if (result.kind === 'invalid') {
      expect(typeof result.reason).toBe('string');
      expect(result.reason.length).toBeGreaterThan(0);
    }
  });

  // B4: sentinel — pre-fix shape was `BuildDocument | null` (truthy null
  // possible). Lock the post-fix contract: the resolved value MUST carry
  // a `kind` field matching the discriminated union.
  it('never resolves null or undefined post-fix', async () => {
    const result = await loadSlot('does-not-exist');
    expect(result).not.toBeNull();
    expect(result).not.toBeUndefined();
    expect(result).toMatchObject({
      kind: expect.stringMatching(/^(ok|not-found|invalid)$/),
    });
  });

  // B5: compile-time sentinel — proves the barrel exports `LoadSlotResult`
  // and the function signature returns `Promise<LoadSlotResult>`. Fails
  // typecheck if the contract drifts.
  it('exposes the LoadSlotResult type via the persistence barrel', async () => {
    const _typeCheck: LoadSlotResult = await loadSlot('foo');
    expect(_typeCheck).toBeDefined();
  });
});
