// Barrel for the Phase 8 persistence surface.
export { buildDocumentSchema, type BuildDocument } from './build-document-schema';
export { projectBuildDocument } from './project-build-document';
export { hydrateBuildDocument } from './hydrate-build-document';
export {
  getPlannerDb,
  isPersistenceAvailable,
  PlannerDatabase,
  type BuildSlotRow,
} from './dexie-db';
export {
  saveSlot,
  loadSlot,
  listSlots,
  deleteSlot,
  slotExists,
} from './slot-api';
export { downloadBuildAsJson } from './json-export';
export { importBuildFromFile, JsonImportError } from './json-import';
