import { beforeEach, describe, it, expect } from 'vitest';
import './setup';
import { sampleBuildDocument } from './setup';
import {
  saveSlot,
  loadSlot,
  listSlots,
  deleteSlot,
  slotExists,
} from '@planner/features/persistence/slot-api';
import { __resetPlannerDbForTests, getPlannerDb } from '@planner/features/persistence/dexie-db';

describe('slot-api (Dexie via fake-indexeddb)', () => {
  beforeEach(async () => {
    // Close the existing Dexie singleton and wipe IndexedDB between tests.
    __resetPlannerDbForTests();
    // Clear any leftover DBs from prior tests.
    const fakeIDB = (globalThis as unknown as { indexedDB: IDBFactory }).indexedDB;
    await new Promise<void>((resolve) => {
      const req = fakeIDB.deleteDatabase('pdb-character-builder');
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    });
  });

  it('saves and loads a slot by name', async () => {
    const doc = sampleBuildDocument();
    await saveSlot('my-paladin', doc);

    const loaded = await loadSlot('my-paladin');
    expect(loaded).not.toBeNull();
    expect(loaded?.build.raceId).toBe('race:human');
  });

  it('returns null when loading a nonexistent slot', async () => {
    const loaded = await loadSlot('does-not-exist');
    expect(loaded).toBeNull();
  });

  it('slotExists reports true only when a row exists', async () => {
    expect(await slotExists('foo')).toBe(false);
    await saveSlot('foo', sampleBuildDocument());
    expect(await slotExists('foo')).toBe(true);
  });

  it('listSlots returns rows sorted by updatedAt descending', async () => {
    const first = sampleBuildDocument();
    await saveSlot('first-build', first);
    // Force a distinct updatedAt by sleeping briefly.
    await new Promise((r) => setTimeout(r, 5));
    await saveSlot('second-build', sampleBuildDocument());

    const slots = await listSlots();
    expect(slots).toHaveLength(2);
    expect(slots[0].name).toBe('second-build');
    expect(slots[1].name).toBe('first-build');
  });

  it('overwrite preserves createdAt and bumps updatedAt', async () => {
    await saveSlot('build-x', sampleBuildDocument());
    const before = (await getPlannerDb().builds.get('build-x'))!;
    await new Promise((r) => setTimeout(r, 5));
    await saveSlot('build-x', sampleBuildDocument());
    const after = (await getPlannerDb().builds.get('build-x'))!;

    expect(after.createdAt).toBe(before.createdAt);
    expect(after.updatedAt).toBeGreaterThanOrEqual(before.updatedAt);
  });

  it('deleteSlot removes a row', async () => {
    await saveSlot('temp', sampleBuildDocument());
    expect(await slotExists('temp')).toBe(true);
    await deleteSlot('temp');
    expect(await slotExists('temp')).toBe(false);
  });

  it('rejects empty slot names', async () => {
    await expect(saveSlot('   ', sampleBuildDocument())).rejects.toThrow();
  });
});
