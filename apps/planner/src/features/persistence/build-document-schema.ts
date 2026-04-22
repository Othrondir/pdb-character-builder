/**
 * Canonical wire format for a planner build.
 *
 * Single source of truth consumed by:
 * - Dexie row payload (slot-api.ts)
 * - JSON export (json-export.ts) and import (json-import.ts)
 * - URL share payload (Plan 08-02 share-url.ts)
 *
 * See Phase 08 CONTEXT:
 * - D-04 (JSON import/export) — this is the exact shape exported and re-imported.
 * - D-05 (URL share) — this payload is compressed + base64url-encoded in Plan 08-02.
 * - D-07 (version mismatch) — schemaVersion + plannerVersion + rulesetVersion + datasetId
 *   are compared on decode; mismatch fails closed via VersionMismatchDialog.
 *
 * CRITICAL: The root object MUST end in `.strict()` (Pitfall 6 in 08-RESEARCH.md).
 * Allowing unknown keys via `.passthrough()` would let stale/malicious fields leak into
 * the zustand stores during hydration.
 */
import { z } from 'zod';
import { canonicalIdRegex } from '@rules-engine/contracts/canonical-id';

const canonicalId = z.string().regex(canonicalIdRegex);
const attributeKey = z.enum(['str', 'dex', 'con', 'int', 'wis', 'cha']);
// UAT-2026-04-20 P6 — level range extended 1..16 → 1..20.
const level16 = z.number().int().min(1).max(20);

export const buildDocumentSchema = z
  .object({
    // Version header — ALL four must be present.
    schemaVersion: z.literal(2),
    plannerVersion: z.string().min(1),
    rulesetVersion: z.string().min(1),
    datasetId: z.string().regex(/^puerta-ee-\d{4}-\d{2}-\d{2}\+[a-z0-9]+$/),
    createdAt: z.string().datetime(),
    // The build itself.
    build: z
      .object({
        name: z.string().max(80).optional(),
        raceId: canonicalId,
        subraceId: canonicalId.nullable(),
        alignmentId: canonicalId,
        deityId: canonicalId.nullable(),
        baseAttributes: z
          .object({
            str: z.number().int().min(3).max(25),
            dex: z.number().int().min(3).max(25),
            con: z.number().int().min(3).max(25),
            int: z.number().int().min(3).max(25),
            wis: z.number().int().min(3).max(25),
            cha: z.number().int().min(3).max(25),
          })
          .strict(),
        levels: z
          .array(
            z
              .object({
                level: level16,
                classId: canonicalId.nullable(),
                abilityIncrease: attributeKey.nullable(),
              })
              .strict(),
          )
          .length(20),
        skillAllocations: z
          .array(
            z
              .object({
                level: level16,
                allocations: z.array(
                  z
                    .object({
                      skillId: canonicalId,
                      rank: z.number().int().min(0).max(19),
                    })
                    .strict(),
                ),
              })
              .strict(),
          )
          .length(20),
        featSelections: z
          .array(
            z
              .object({
                level: level16,
                bonusGeneralFeatIds: z.array(canonicalId),
                classFeatId: canonicalId.nullable(),
                generalFeatId: canonicalId.nullable(),
              })
              .strict(),
          )
          .length(20),
      })
      .strict(),
  })
  .strict();

export type BuildDocument = z.infer<typeof buildDocumentSchema>;
