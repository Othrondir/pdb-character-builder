import { z } from 'zod';

export const ENTITY_KINDS = [
  'class',
  'feat',
  'spell',
  'skill',
  'race',
  'subrace',
  'alignment',
  'deity',
  'domain',
  'rule',
] as const;

export type EntityKind = (typeof ENTITY_KINDS)[number];

export type CanonicalId = `${EntityKind}:${string | number}`;

export const canonicalIdRegex = /^[a-z-]+:[A-Za-z0-9._-]+$/;

// Phase 12.6 (D-02, RESEARCH Pitfall 4) — canonical race-id schema.
// Mirrors the inline regex at packages/data-extractor/src/contracts/race-catalog.ts:13
// so extractor-emitted race IDs and snapshot keys share the same shape gate.
export const canonicalRaceIdSchema = z
  .string()
  .regex(/^race:[A-Za-z0-9._-]+$/);
