// Barrel for the Phase 8 persistence surface.
export { buildDocumentSchema, type BuildDocument } from './build-document-schema';
export {
  projectBuildDocument,
  isBuildProjectable,
  IncompleteBuildError,
  type IncompleteBuildField,
} from './project-build-document';
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
  type LoadSlotResult,
} from './slot-api';
export { downloadBuildAsJson } from './json-export';
export { importBuildFromFile, JsonImportError } from './json-import';
export {
  encodeSharePayload,
  decodeSharePayload,
  toBase64Url,
  fromBase64Url,
  ShareDecodeError,
} from './share-url';
export {
  MAX_ENCODED_PAYLOAD_LENGTH,
  SHARE_URL_HASH_PREFIX,
  exceedsBudget,
  buildShareUrl,
} from './url-budget';
export { diffRuleset, type RulesetDiff } from './version-mismatch';
