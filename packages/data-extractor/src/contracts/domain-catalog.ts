import { z } from 'zod';

import { datasetIdSchema } from './dataset-manifest';
import { canonicalIdRegex } from '../../../rules-engine/src/contracts/canonical-id';

/**
 * Spells granted at each spell level (0-9) for a cleric domain.
 * Each key is a spell level string, value is an array of canonical spell IDs
 * available at that level.
 */
const domainSpellsByLevelSchema = z.record(
  z.enum(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']),
  z.array(z.string().regex(canonicalIdRegex)),
);

export const compiledDomainSchema = z.object({
  description: z.string(),
  grantedFeatIds: z.array(z.string().regex(canonicalIdRegex)),
  id: z.string().regex(/^domain:[A-Za-z0-9._-]+$/),
  label: z.string().min(1),
  sourceRow: z.number().int().nonnegative(),
  spellIds: domainSpellsByLevelSchema,
});

export const domainCatalogSchema = z.object({
  datasetId: datasetIdSchema,
  domains: z.array(compiledDomainSchema).min(1),
  schemaVersion: z.literal('1'),
});

export type CompiledDomain = z.infer<typeof compiledDomainSchema>;
export type DomainCatalog = z.infer<typeof domainCatalogSchema>;
