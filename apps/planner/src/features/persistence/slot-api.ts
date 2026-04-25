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
 * Discriminated union returned by {@link loadSlot}. Replaces the pre-Phase-14-02
 * `BuildDocument | null` shape so that callers explicitly handle three outcomes:
 *
 * - `{kind: 'ok', doc}` — row exists AND its payload re-validated against
 *   {@link buildDocumentSchema}.
 * - `{kind: 'not-found'}` — no row exists for that slot name.
 * - `{kind: 'invalid', reason}` — row exists but its payload failed Zod
 *   validation (tamper, cross-version drift). Caller MUST NOT hydrate.
 */
export type LoadSlotResult =
  | { kind: 'ok'; doc: BuildDocument }
  | { kind: 'not-found' }
  | { kind: 'invalid'; reason: string };

/**
 * Load a slot. Re-validates with Zod on read (Pitfall 6 mitigation: a tampered Dexie row
 * must not hydrate stores with unknown-shape data). Returns a typed discriminated union
 * — see {@link LoadSlotResult} — instead of throwing ZodError or returning a bare null.
 * Phase 14-02 hardening.
 */
export async function loadSlot(name: string): Promise<LoadSlotResult> {
  const row = await getPlannerDb().builds.get(name);
  if (!row) return { kind: 'not-found' };
  const parsed = buildDocumentSchema.safeParse(row.payload);
  if (!parsed.success) {
    return { kind: 'invalid', reason: parsed.error.message };
  }
  return { kind: 'ok', doc: parsed.data };
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
