import { z } from 'zod';

import { datasetIdSchema } from './dataset-manifest';
import { canonicalIdRegex } from '../../../rules-engine/src/contracts/canonical-id';

const SKILL_ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;
const SKILL_CATEGORIES = [
  'athletic',
  'discipline',
  'lore',
  'perception',
  'social',
  'stealth',
  'utility',
] as const;
const SKILL_RESTRICTION_SOURCES = [
  'base-game',
  'puerta-snapshot',
  'manual-override',
] as const;
const SKILL_RESTRICTION_SCOPES = [
  'global',
  'class',
  'equipment',
  'server-rule',
] as const;
const SKILL_RESTRICTION_OUTCOMES = ['blocked', 'illegal'] as const;

export const skillRestrictionProvenanceSchema = z.object({
  evidence: z.string().min(1),
  note: z.string().min(1),
  source: z.enum(SKILL_RESTRICTION_SOURCES),
});

export const skillRestrictionMetadataSchema = z.object({
  code: z.string().min(1),
  condition: z
    .object({
      armorCategory: z.enum(['light', 'medium', 'heavy']).optional(),
    })
    .optional(),
  description: z.string().min(1),
  outcome: z.enum(SKILL_RESTRICTION_OUTCOMES),
  provenance: z.array(skillRestrictionProvenanceSchema).min(1),
  scope: z.enum(SKILL_RESTRICTION_SCOPES),
});

export const compiledSkillSchema = z.object({
  abilityKey: z.enum(SKILL_ABILITY_KEYS),
  category: z.enum(SKILL_CATEGORIES),
  defaultClassIds: z.array(z.string().regex(canonicalIdRegex)).min(1),
  id: z.string().regex(/^skill:[A-Za-z0-9._-]+$/),
  label: z.string().min(1),
  restrictionMetadata: z.array(skillRestrictionMetadataSchema),
  trainedOnly: z.boolean(),
});

export const skillRestrictionOverrideSchema = z.object({
  affectedClassIds: z.array(z.string().regex(canonicalIdRegex)).optional(),
  code: z.string().min(1),
  condition: z
    .object({
      armorCategory: z.enum(['light', 'medium', 'heavy']).optional(),
    })
    .optional(),
  description: z.string().min(1),
  outcome: z.enum(SKILL_RESTRICTION_OUTCOMES),
  provenance: z.array(skillRestrictionProvenanceSchema).min(1),
  scope: z.enum(SKILL_RESTRICTION_SCOPES),
  skillId: z.string().regex(/^skill:[A-Za-z0-9._-]+$/),
});

export const skillCatalogSchema = z.object({
  datasetId: datasetIdSchema,
  restrictionOverrides: z.array(skillRestrictionOverrideSchema),
  schemaVersion: z.literal('1'),
  skills: z.array(compiledSkillSchema).min(1),
});

export type CompiledSkill = z.infer<typeof compiledSkillSchema>;
export type SkillCatalog = z.infer<typeof skillCatalogSchema>;
export type SkillRestrictionMetadata = z.infer<
  typeof skillRestrictionMetadataSchema
>;
export type SkillRestrictionOverride = z.infer<
  typeof skillRestrictionOverrideSchema
>;
