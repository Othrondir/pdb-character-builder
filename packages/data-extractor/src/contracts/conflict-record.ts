import { z } from 'zod';

import { canonicalIdRegex } from '../../../rules-engine/src/contracts/canonical-id';
import { sourceAnchorSchema } from './canonical-record';

const CONFLICT_SEVERITIES = ['mechanical', 'text'] as const;
const CONFLICT_RESOLUTIONS = [
  'override-required',
  'blocked',
  'warning-only',
] as const;

export const conflictSeverity = z.enum(CONFLICT_SEVERITIES);
export const conflictResolution = z.enum(CONFLICT_RESOLUTIONS);

export type ConflictSeverity = z.infer<typeof conflictSeverity>;
export type ConflictResolution = z.infer<typeof conflictResolution>;

const conflictRecordInputSchema = z
  .object({
    id: z.string().min(1),
    severity: conflictSeverity,
    affectedIds: z.array(z.string().regex(canonicalIdRegex)).min(1),
    evidence: z.array(sourceAnchorSchema).min(1),
    resolution: conflictResolution.optional(),
    notes: z.string().min(1).optional(),
  })
  .superRefine((record, ctx) => {
    if (record.severity === 'mechanical' && record.resolution === 'warning-only') {
      ctx.addIssue({
        code: 'custom',
        path: ['resolution'],
        message:
          'Mechanical conflicts cannot downgrade to warning-only without an override.',
      });
    }
  });

export const conflictRecordSchema = conflictRecordInputSchema.transform((record) => ({
  ...record,
  resolution:
    record.resolution ?? (record.severity === 'mechanical' ? 'blocked' : 'override-required'),
}));

export type ConflictRecord = z.infer<typeof conflictRecordSchema>;
