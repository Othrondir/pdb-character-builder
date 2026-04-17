import Dexie, { type EntityTable } from 'dexie';
import type { BuildDocument } from './build-document-schema';

/**
 * Local persistence for Phase 8 (D-01 "slots nombrados").
 *
 * Schema: single `builds` table keyed on the user-entered slot name.
 *
 * === UPGRADE DISCIPLINE (Pitfall 5 in 08-RESEARCH.md) ===
 * Every version() bump that changes the schema shape MUST carry an .upgrade(tx => ...)
 * callback unless the change is trivially additive (new secondary index with no required
 * field). Adding a REQUIRED field to `BuildSlotRow` without an upgrade callback WILL
 * silently corrupt older rows — test migrations end-to-end with fake-indexeddb before
 * shipping.
 */

export interface BuildSlotRow {
  name: string;              // PRIMARY KEY — user-entered slot name
  payload: BuildDocument;    // full document including version header fields
  createdAt: number;         // Date.now() at first save
  updatedAt: number;         // Date.now() at most recent save
}

export class PlannerDatabase extends Dexie {
  builds!: EntityTable<BuildSlotRow, 'name'>;

  constructor() {
    super('pdb-character-builder');
    // Dexie stores-string: "name" means "name" is PK, no secondary indexes needed.
    this.version(1).stores({
      builds: 'name',
    });
  }
}

let dbInstance: PlannerDatabase | null = null;

export function getPlannerDb(): PlannerDatabase {
  if (!dbInstance) dbInstance = new PlannerDatabase();
  return dbInstance;
}

/**
 * Safari private-mode + IndexedDB-disabled guard (Pitfall 3 in 08-RESEARCH.md).
 * Caller can use this to gray out Guardar/Cargar affordances and show
 * `shellCopyEs.persistence.privateModeUnavailable`.
 */
export async function isPersistenceAvailable(): Promise<boolean> {
  try {
    await getPlannerDb().open();
    return true;
  } catch {
    return false;
  }
}

/**
 * Test helper: drop the singleton so fake-indexeddb can reset between tests.
 * NOT exported from the package barrel.
 */
export function __resetPlannerDbForTests(): void {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch {
      // ignore
    }
  }
  dbInstance = null;
}
