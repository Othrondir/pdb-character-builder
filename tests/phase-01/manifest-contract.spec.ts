import { describe, expect, it } from 'vitest';

import { datasetCatalogSchema } from '../../packages/data-extractor/src/contracts/dataset-catalog';
import { datasetManifestSchema } from '../../packages/data-extractor/src/contracts/dataset-manifest';
import { overrideRegistryEntrySchema, overrideRegistrySchema } from '../../packages/data-extractor/src/contracts/override-registry';
import overrideRegistry from '../../packages/overrides/registry.json';
import customDomainLabels from '../../packages/overrides/text/custom-domain-labels.json';

const validDatasetId = 'puerta-ee-2026-03-29+cf6e8aad';

const validManifest = {
  schemaVersion: '1',
  datasetId: validDatasetId,
  datasetHash: 'cf6e8aad5751930e345266b84a3be31d9d67f3b1',
  generatedAt: '2026-03-30T08:45:57Z',
  defaultLocale: 'es',
  supportedLocales: ['es', 'en'],
  levelCap: 16,
  precedencePolicy: {
    mechanics: ['manual-override', 'puerta-snapshot', 'base-game'],
    evidence: ['override-evidence', 'forum-doc', 'stale-doc'],
  },
  ambiguityPolicy: 'blocked',
  sourceSummary: {
    baseGame: {
      keyFile: 'data/nwn_base.key',
      mechanicalBif: 'data/base_2da.bif',
      locales: ['de', 'en', 'es', 'fr', 'it', 'pl'],
    },
    puertaSnapshot: {
      originUrl: 'http://nwsync.puertadebaldur.com',
      manifestSha1: 'cf6e8aad5751930e345266b84a3be31d9d67f3b1',
      manifestCreatedAt: '2026-03-29T22:10:00Z',
      includesClientContents: true,
      includesModuleContents: false,
      resourceCount: 42,
      snapshotSerial: '7532',
    },
    manualOverrides: {
      registryVersion: '1',
      entryCount: 1,
      registryHash: 'registry-hash',
    },
  },
  artifactHashes: {
    'datasets/canonical.json': 'artifact-hash',
  },
} as const;

describe('dataset manifest contract', () => {
  it('requires datasetId to match the puerta snapshot naming pattern', () => {
    expect(datasetManifestSchema.safeParse(validManifest).success).toBe(true);

    expect(
      datasetManifestSchema.safeParse({
        ...validManifest,
        datasetId: 'puerta-ee-2026-3-29+cf6e8aad',
      }).success,
    ).toBe(false);

    expect(
      datasetManifestSchema.safeParse({
        ...validManifest,
        datasetId: 'snapshot-2026-03-29+cf6e8aad',
      }).success,
    ).toBe(false);
  });

  it('rejects absolute local Windows paths anywhere in the public manifest', () => {
    expect(
      datasetManifestSchema.safeParse({
        ...validManifest,
        artifactHashes: {
          ...validManifest.artifactHashes,
          leakedPath: 'C:\\Users\\pzhly\\Documents\\Neverwinter Nights\\nwsync\\nwsyncmeta.sqlite3',
        },
      }).success,
    ).toBe(false);

    expect(
      datasetManifestSchema.safeParse({
        ...validManifest,
        sourceSummary: {
          ...validManifest.sourceSummary,
          baseGame: {
            ...validManifest.sourceSummary.baseGame,
            keyFile: 'C:\\Users\\pzhly\\nwn_base.key',
          },
        },
      }).success,
    ).toBe(false);
  });
});

describe('dataset catalog contract', () => {
  it('requires an explicit activeDatasetId for manual promotion', () => {
    expect(
      datasetCatalogSchema.safeParse({
        activationMode: 'manual',
        activeDatasetId: validDatasetId,
        availableDatasetIds: [validDatasetId],
        lastPromotedAt: '2026-03-30T08:45:57Z',
        lastPromotedBy: 'manual',
      }).success,
    ).toBe(true);

    expect(
      datasetCatalogSchema.safeParse({
        activationMode: 'manual',
        availableDatasetIds: [validDatasetId],
        lastPromotedAt: '2026-03-30T08:45:57Z',
        lastPromotedBy: 'manual',
      }).success,
    ).toBe(false);

    expect(
      datasetCatalogSchema.safeParse({
        activationMode: 'manual',
        activeDatasetId: 'puerta-ee-2026-03-28+deadbeef',
        availableDatasetIds: [validDatasetId],
        lastPromotedAt: '2026-03-30T08:45:57Z',
        lastPromotedBy: 'manual',
      }).success,
    ).toBe(false);
  });
});

describe('override registry contract', () => {
  it('accepts the committed seed registry and keeps payloads repo-relative', () => {
    expect(overrideRegistrySchema.safeParse(overrideRegistry).success).toBe(true);
    expect(overrideRegistry.entries[0]?.payloadFile.startsWith('packages/overrides/')).toBe(
      true,
    );
    expect(customDomainLabels).toEqual({
      locale: 'es',
      records: [],
    });
  });

  it('rejects override payload paths that leak local machines or raw sqlite files', () => {
    expect(
      overrideRegistryEntrySchema.safeParse({
        ...overrideRegistry.entries[0],
        payloadFile: 'C:\\Users\\pzhly\\Documents\\Neverwinter Nights\\nwsync\\nwsyncmeta.sqlite3',
      }).success,
    ).toBe(false);

    expect(
      overrideRegistryEntrySchema.safeParse({
        ...overrideRegistry.entries[0],
        payloadFile: 'packages/overrides/raw/nwsyncmeta.sqlite3',
      }).success,
    ).toBe(false);
  });
});
