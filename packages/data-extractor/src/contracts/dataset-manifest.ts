import { z } from 'zod';

import {
  EVIDENCE_PRECEDENCE,
  MECHANICS_PRECEDENCE,
} from './source-precedence';

const datasetIdRegex = /^puerta-ee-\d{4}-\d{2}-\d{2}\+[a-z0-9]+$/;
const windowsAbsolutePathRegex = /(^|[^A-Za-z0-9])[A-Za-z]:[\\/]/;

function addWindowsPathIssues(
  value: unknown,
  path: Array<string | number>,
  ctx: z.RefinementCtx,
): void {
  if (typeof value === 'string' && windowsAbsolutePathRegex.test(value)) {
    ctx.addIssue({
      code: 'custom',
      path,
      message: 'Public manifest values must not contain absolute Windows paths.',
    });
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) => addWindowsPathIssues(entry, [...path, index], ctx));
    return;
  }

  if (value && typeof value === 'object') {
    for (const [key, nestedValue] of Object.entries(
      value as Record<string, unknown>,
    )) {
      addWindowsPathIssues(nestedValue, [...path, key], ctx);
    }
  }
}

export const datasetIdSchema = z.string().regex(datasetIdRegex, {
  message: 'datasetId must match puerta-ee-YYYY-MM-DD+<hash>.',
});

export const datasetManifestSchema = z
  .object({
    schemaVersion: z.literal('1'),
    datasetId: datasetIdSchema,
    datasetHash: z.string().min(1),
    generatedAt: z.string().datetime({ offset: true }),
    defaultLocale: z.literal('es'),
    supportedLocales: z.array(z.string().min(2)).min(1),
    levelCap: z.literal(16),
    precedencePolicy: z.object({
      mechanics: z.tuple([
        z.literal(MECHANICS_PRECEDENCE[0]),
        z.literal(MECHANICS_PRECEDENCE[1]),
        z.literal(MECHANICS_PRECEDENCE[2]),
      ]),
      evidence: z.tuple([
        z.literal(EVIDENCE_PRECEDENCE[0]),
        z.literal(EVIDENCE_PRECEDENCE[1]),
        z.literal(EVIDENCE_PRECEDENCE[2]),
      ]),
    }),
    ambiguityPolicy: z.literal('blocked'),
    sourceSummary: z.object({
      baseGame: z.object({
        keyFile: z.literal('data/nwn_base.key'),
        mechanicalBif: z.literal('data/base_2da.bif'),
        locales: z.array(z.string().min(2)).min(1),
      }),
      puertaSnapshot: z.object({
        originUrl: z.literal('http://nwsync.puertadebaldur.com'),
        manifestSha1: z.string().min(1),
        manifestCreatedAt: z.string().datetime({ offset: true }),
        includesClientContents: z.literal(true),
        includesModuleContents: z.literal(false),
        resourceCount: z.number().int().nonnegative(),
        snapshotSerial: z.string().min(1).optional(),
      }),
      manualOverrides: z.object({
        registryVersion: z.string().min(1),
        entryCount: z.number().int().nonnegative(),
        registryHash: z.string().min(1),
      }),
    }),
    artifactHashes: z.record(z.string(), z.string().min(1)),
  })
  .superRefine((manifest, ctx) => {
    if (!manifest.supportedLocales.includes(manifest.defaultLocale)) {
      ctx.addIssue({
        code: 'custom',
        path: ['supportedLocales'],
        message: 'supportedLocales must include the default locale.',
      });
    }

    if (new Set(manifest.supportedLocales).size !== manifest.supportedLocales.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['supportedLocales'],
        message: 'supportedLocales must not contain duplicates.',
      });
    }

    addWindowsPathIssues(manifest, [], ctx);
  });

export type DatasetManifest = z.infer<typeof datasetManifestSchema>;
