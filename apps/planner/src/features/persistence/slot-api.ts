import { getPlannerDb, type BuildSlotRow } from './dexie-db';
import { buildDocumentSchema, type BuildDocument } from './build-document-schema';

/**
 * Save a slot. Preserves `createdAt` on overwrite; always updates `updatedAt`.
 * Caller is responsible for opening the overwrite-confirm dialog before calling.
 */
export async function saveSlot(name: string, doc: BuildDocument): Promise<void> {
  if (!name.trim()) throw new Error('Slot name requerido');
  const now = Date.now();
  const db = getPlannerDb();
  const existing = await db.builds.get(name);
  await db.builds.put({
    name,
    payload: doc,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  });
}

/**
 * Load a slot. Re-validates with Zod on read (Pitfall 6 mitigation: a tampered Dexie row
 * must not hydrate stores with unknown-shape data).
 */
export async function loadSlot(name: string): Promise<BuildDocument | null> {
  const row = await getPlannerDb().builds.get(name);
  if (!row) return null;
  return buildDocumentSchema.parse(row.payload);
}

/**
 * List slots, newest-first (D-09 — most-recent-first load list).
 */
export async function listSlots(): Promise<BuildSlotRow[]> {
  const rows = await getPlannerDb().builds.toArray();
  return rows.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function deleteSlot(name: string): Promise<void> {
  await getPlannerDb().builds.delete(name);
}

export async function slotExists(name: string): Promise<boolean> {
  return (await getPlannerDb().builds.get(name)) !== undefined;
}
