import { z } from 'zod';

const windowsAbsolutePathRegex = /(^|[^A-Za-z0-9])[A-Za-z]:[\\/]/;
const rawSourceExtensionRegex = /\.(sqlite|sqlite3|bif|key|tlk)$/i;

const payloadFileSchema = z
  .string()
  .min(1)
  .refine((value) => !value.includes('\\'), {
    message: 'payloadFile must use repo-relative forward slashes.',
  })
  .refine((value) => value.startsWith('packages/overrides/'), {
    message: 'payloadFile must stay inside packages/overrides/.',
  })
  .refine((value) => value.endsWith('.json'), {
    message: 'payloadFile must reference a committed JSON artifact.',
  })
  .refine((value) => !windowsAbsolutePathRegex.test(value), {
    message: 'payloadFile must not contain an absolute Windows path.',
  })
  .refine((value) => !rawSourceExtensionRegex.test(value), {
    message: 'payloadFile must not reference raw source payloads.',
  });

export const overrideEvidenceSchema = z.object({
  type: z.enum([
    'forum-post',
    'admin-note',
    'script-review',
    'manual-reconciliation',
  ]),
  reference: z.string().min(1),
  capturedAt: z.string().datetime({ offset: true }),
});

export const overrideRegistryEntrySchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['rule', 'text', 'conflict-resolution', 'blocked-marker']),
  targetIds: z.array(z.string().min(1)),
  operation: z.enum([
    'replace-fields',
    'append-values',
    'suppress-record',
    'add-synthetic-rule',
    'mark-blocked',
  ]),
  evidence: z.array(overrideEvidenceSchema).min(1),
  rationale: z.string().min(1),
  confidence: z.enum(['high', 'medium', 'low']),
  appliesTo: z
    .object({
      manifestSha1: z.array(z.string().min(1)).min(1).optional(),
      datasetRange: z.string().min(1).optional(),
    })
    .refine(
      (value) =>
        typeof value.datasetRange === 'string' ||
        Array.isArray(value.manifestSha1),
      {
        message: 'appliesTo must declare datasetRange or manifestSha1.',
      },
    ),
  reviewStatus: z.enum(['verified', 'needs-review', 'blocked']),
  payloadFile: payloadFileSchema,
});

export const overrideRegistrySchema = z.object({
  registryVersion: z.literal('1'),
  entries: z.array(overrideRegistryEntrySchema),
});

export type OverrideRegistryEntry = z.infer<typeof overrideRegistryEntrySchema>;
export type OverrideRegistry = z.infer<typeof overrideRegistrySchema>;
