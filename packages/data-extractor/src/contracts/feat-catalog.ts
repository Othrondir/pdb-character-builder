import { z } from 'zod';

import { datasetIdSchema } from './dataset-manifest';
import { canonicalIdRegex } from '../../../rules-engine/src/contracts/canonical-id';

/**
 * Feat prerequisites, matching the RESEARCH Feat Prerequisite Column Reference.
 * All fields are optional/nullable since not every feat has every prerequisite.
 */
export const featPrerequisitesSchema = z.object({
  minBab: z.number().int().nonnegative().nullable().optional(),
  minCha: z.number().int().nonnegative().nullable().optional(),
  minCon: z.number().int().nonnegative().nullable().optional(),
  minDex: z.number().int().nonnegative().nullable().optional(),
  minFortSave: z.number().int().nonnegative().nullable().optional(),
  minInt: z.number().int().nonnegative().nullable().optional(),
  minLevel: z.number().int().nonnegative().nullable().optional(),
  minLevelClass: z.string().regex(canonicalIdRegex).nullable().optional(),
  minStr: z.number().int().nonnegative().nullable().optional(),
  minWis: z.number().int().nonnegative().nullable().optional(),
  maxLevel: z.number().int().nonnegative().nullable().optional(),
  orReqFeats: z.array(z.string().regex(canonicalIdRegex)).optional(),
  preReqEpic: z.boolean().nullable().optional(),
  requiredFeat1: z.string().regex(canonicalIdRegex).nullable().optional(),
  requiredFeat2: z.string().regex(canonicalIdRegex).nullable().optional(),
  requiredSkill: z
    .object({
      id: z.string().regex(canonicalIdRegex),
      minRanks: z.number().int().nonnegative(),
    })
    .nullable()
    .optional(),
  requiredSkill2: z
    .object({
      id: z.string().regex(canonicalIdRegex),
      minRanks: z.number().int().nonnegative(),
    })
    .nullable()
    .optional(),
});

/**
 * Phase 12.4-08 (SPEC R7 / CONTEXT D-05) — parameterized feat-family
 * metadata. Optional + nullable (Open Question 4 resolution): rows with
 * and without this field parse cleanly so the Phase 8 SHAR-05 share-URL
 * schema invariant is preserved (no schema version bump required).
 *
 * UI groups feats by `groupKey` client-side → one main list row per
 * family (`Soltura con una habilidad`, etc.) instead of ~N rows per
 * variant. `paramLabel` feeds the expander <legend> copy (`Elige
 * habilidad`, `Elige escuela de magia`, `Elige arma`).
 */
export const parameterizedFeatFamilySchema = z
  .object({
    canonicalId: z.string().regex(/^feat:[a-z0-9-]+$/),
    groupKey: z.string(),
    paramLabel: z.string(),
  })
  .nullable()
  .optional();

export const compiledFeatSchema = z.object({
  allClassesCanUse: z.boolean(),
  category: z.string(),
  description: z.string(),
  id: z.string().regex(/^feat:[A-Za-z0-9._-]+$/),
  label: z.string().min(1),
  parameterizedFeatFamily: parameterizedFeatFamilySchema,
  prerequisites: featPrerequisitesSchema,
  sourceRow: z.number().int().nonnegative(),
});

export const classFeatEntrySchema = z.object({
  featId: z.string().regex(/^feat:[A-Za-z0-9._-]+$/),
  grantedOnLevel: z.number().int().positive().nullable(),
  list: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  onMenu: z.boolean(),
});

export const featCatalogSchema = z.object({
  classFeatLists: z.record(
    z.string().regex(canonicalIdRegex),
    z.array(classFeatEntrySchema),
  ),
  datasetId: datasetIdSchema,
  feats: z.array(compiledFeatSchema).min(1),
  schemaVersion: z.literal('1'),
});

export type FeatPrerequisites = z.infer<typeof featPrerequisitesSchema>;
export type CompiledFeat = z.infer<typeof compiledFeatSchema>;
export type ClassFeatEntry = z.infer<typeof classFeatEntrySchema>;
export type FeatCatalog = z.infer<typeof featCatalogSchema>;
