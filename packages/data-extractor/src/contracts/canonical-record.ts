import { z } from 'zod';

import {
  ENTITY_KINDS,
  type CanonicalId,
  canonicalIdRegex,
} from '../../../rules-engine/src/contracts/canonical-id';

export const SOURCE_LAYERS = [
  'base-game',
  'puerta-snapshot',
  'manual-override',
] as const;

export type SourceLayer = (typeof SOURCE_LAYERS)[number];

export const EVIDENCE_LAYERS = [
  'override-evidence',
  'forum-doc',
  'stale-doc',
] as const;

export type EvidenceLayer = (typeof EVIDENCE_LAYERS)[number];

const ANCHOR_LAYERS = [...SOURCE_LAYERS, ...EVIDENCE_LAYERS] as const;

export const sourceAnchorSchema = z.object({
  layer: z.enum(ANCHOR_LAYERS),
  resref: z.string().min(1).optional(),
  restype: z.number().int().nonnegative().optional(),
  rowIndex: z.number().int().nonnegative().optional(),
  label: z.string().min(1).optional(),
  strref: z.number().int().nonnegative().optional(),
  manifestSha1: z.string().min(1).optional(),
  evidenceId: z.string().min(1).optional(),
});

export type SourceAnchor = z.infer<typeof sourceAnchorSchema>;

export const canonicalRecordSchema = z.object({
  id: z.string().regex(canonicalIdRegex),
  kind: z.enum(ENTITY_KINDS),
  sourceAnchors: z.array(sourceAnchorSchema).min(1),
  aliases: z.array(z.string().regex(canonicalIdRegex)).min(1).optional(),
});

export interface CanonicalRecord {
  id: CanonicalId;
  kind: (typeof ENTITY_KINDS)[number];
  sourceAnchors: SourceAnchor[];
  aliases?: CanonicalId[];
}
