import { z } from 'zod';

import { datasetIdSchema } from './dataset-manifest';
import { canonicalIdRegex } from '../../../rules-engine/src/contracts/canonical-id';

const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;
const BAB_PROGRESSIONS = ['low', 'medium', 'high'] as const;
const SAVE_PROGRESSIONS = ['low', 'high'] as const;

export const compiledClassSchema = z.object({
  attackBonusProgression: z.enum(BAB_PROGRESSIONS),
  description: z.string(),
  featTableRef: z.string().nullable(),
  hitDie: z.number().int().positive(),
  id: z.string().regex(/^class:[A-Za-z0-9._-]+$/),
  isBase: z.boolean(),
  label: z.string().min(1),
  prerequisiteColumns: z.record(z.string(), z.string().nullable()),
  primaryAbility: z.enum(ABILITY_KEYS).nullable(),
  savingThrows: z.object({
    fortitude: z.enum(SAVE_PROGRESSIONS),
    reflex: z.enum(SAVE_PROGRESSIONS),
    will: z.enum(SAVE_PROGRESSIONS),
  }),
  skillPointsPerLevel: z.number().int().nonnegative(),
  skillTableRef: z.string().nullable(),
  sourceRow: z.number().int().nonnegative(),
  spellCaster: z.boolean(),
  spellGainTableRef: z.string().nullable(),
  spellKnownTableRef: z.string().nullable(),
});

export const classCatalogSchema = z.object({
  classes: z.array(compiledClassSchema).min(1),
  datasetId: datasetIdSchema,
  schemaVersion: z.literal('1'),
});

export type CompiledClass = z.infer<typeof compiledClassSchema>;
export type ClassCatalog = z.infer<typeof classCatalogSchema>;
