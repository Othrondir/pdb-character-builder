import { z } from 'zod';

import { datasetIdSchema } from './dataset-manifest';
import { canonicalIdRegex } from '../../../rules-engine/src/contracts/canonical-id';

const SPELL_LEVEL_INDICES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

/**
 * Spell slots gained per caster level. Each row represents one caster level
 * and the number of spell slots available at each spell level (0-9).
 */
export const spellGainRowSchema = z.object({
  casterLevel: z.number().int().positive(),
  slots: z.record(
    z.enum(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']),
    z.number().int().nonnegative(),
  ),
});

/**
 * Spells known per caster level (for spontaneous casters like Sorcerer/Bard).
 * Each row represents one caster level and the number of spells known at each
 * spell level (0-9).
 */
export const spellKnownRowSchema = z.object({
  casterLevel: z.number().int().positive(),
  known: z.record(
    z.enum(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']),
    z.number().int().nonnegative(),
  ),
});

export const compiledSpellSchema = z.object({
  classLevels: z.record(z.string().regex(canonicalIdRegex), z.number().int().nonnegative()),
  description: z.string(),
  id: z.string().regex(/^spell:[A-Za-z0-9._-]+$/),
  innateLevel: z.number().int().nonnegative().nullable(),
  label: z.string().min(1),
  school: z.string(),
  sourceRow: z.number().int().nonnegative(),
});

export const spellCatalogSchema = z.object({
  datasetId: datasetIdSchema,
  schemaVersion: z.literal('1'),
  spellGainTables: z.record(
    z.string().regex(canonicalIdRegex),
    z.array(spellGainRowSchema),
  ),
  spellKnownTables: z.record(
    z.string().regex(canonicalIdRegex),
    z.array(spellKnownRowSchema),
  ),
  spells: z.array(compiledSpellSchema).min(1),
});

export type SpellGainRow = z.infer<typeof spellGainRowSchema>;
export type SpellKnownRow = z.infer<typeof spellKnownRowSchema>;
export type CompiledSpell = z.infer<typeof compiledSpellSchema>;
export type SpellCatalog = z.infer<typeof spellCatalogSchema>;
