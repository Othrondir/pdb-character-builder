import { compiledClassCatalog } from '@planner/data/compiled-classes';

/**
 * Phase 08 single source of truth for dataset + planner + ruleset + wire-format version.
 *
 * Every persisted artifact (Dexie row payload, exported JSON, shared URL payload) embeds
 * these four values in its header so the decode pipeline (Plan 08-02 D-07) can fail closed
 * on any mismatch.
 *
 * - PLANNER_VERSION: app identity. Bump per release.
 * - RULESET_VERSION: Puerta de Baldur rules engine identity. Bump whenever rules
 *   computation logic changes (e.g. skill caps, prestige entry prereqs).
 * - BUILD_ENCODING_VERSION: wire-format schema version. Bump whenever buildDocumentSchema
 *   changes shape in a way that breaks older payloads.
 * - CURRENT_DATASET_ID: data snapshot identity. Read from the compiled catalog so it cannot
 *   drift from the actual data bundled into the runtime. Do NOT hardcode a literal here.
 */
export const PLANNER_VERSION = '1.0.0' as const;
export const RULESET_VERSION = '1.0.1' as const;
export const BUILD_ENCODING_VERSION = 2 as const;
export const CURRENT_DATASET_ID: string = compiledClassCatalog.datasetId;

/**
 * Human-readable one-line dataset label shown in the shell footer, Resumen header,
 * and exported JSON comment header. Format mirrors Plantilla Base.xlsx handoff conventions.
 * Output example: "Ruleset v1.0.0 · Dataset 2026-04-17 (cf6e8aad)"
 */
export function formatDatasetLabel(): string {
  const match = /^puerta-ee-(\d{4}-\d{2}-\d{2})\+([a-z0-9]+)$/.exec(CURRENT_DATASET_ID);
  if (!match) {
    return `Ruleset v${RULESET_VERSION} · Dataset ${CURRENT_DATASET_ID}`;
  }
  return `Ruleset v${RULESET_VERSION} · Dataset ${match[1]} (${match[2]})`;
}
