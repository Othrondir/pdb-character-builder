import { z } from 'zod';

import { datasetIdSchema } from './dataset-manifest';
import { canonicalIdRegex } from '../../../rules-engine/src/contracts/canonical-id';

const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;
const RACE_SIZES = ['small', 'medium', 'large'] as const;

export const compiledRaceSchema = z.object({
  abilityAdjustments: z.record(z.enum(ABILITY_KEYS), z.number().int()),
  description: z.string(),
  favoredClass: z.string().regex(canonicalIdRegex).nullable(),
  id: z.string().regex(/^race:[A-Za-z0-9._-]+$/),
  label: z.string().min(1),
  size: z.enum(RACE_SIZES),
  sourceRow: z.number().int().nonnegative(),
});

export const compiledSubraceSchema = z.object({
  description: z.string(),
  id: z.string().regex(/^subrace:[A-Za-z0-9._-]+$/),
  isDeprecated: z.boolean(),
  label: z.string().min(1),
  parentRaceId: z.string().regex(/^race:[A-Za-z0-9._-]+$/),
  sourceRow: z.number().int().nonnegative(),
});

export const raceCatalogSchema = z.object({
  datasetId: datasetIdSchema,
  races: z.array(compiledRaceSchema).min(1),
  schemaVersion: z.literal('1'),
  subraces: z.array(compiledSubraceSchema),
});

export type CompiledRace = z.infer<typeof compiledRaceSchema>;
export type CompiledSubrace = z.infer<typeof compiledSubraceSchema>;
export type RaceCatalog = z.infer<typeof raceCatalogSchema>;
