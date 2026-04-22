import { describe, it, expect } from 'vitest';
import { buildDocumentSchema } from '@planner/features/persistence/build-document-schema';
import { sampleBuildDocument } from './setup';

describe('buildDocumentSchema', () => {
  it('accepts a minimal valid document', () => {
    expect(() => buildDocumentSchema.parse(sampleBuildDocument())).not.toThrow();
  });

  it('rejects unknown top-level keys (strict mode)', () => {
    const bad = { ...sampleBuildDocument(), evil: 'payload' } as unknown;
    expect(buildDocumentSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects unknown keys inside build.*', () => {
    const doc = sampleBuildDocument();
    const bad = { ...doc, build: { ...doc.build, spells: [] } } as unknown;
    expect(buildDocumentSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects unknown deep keys like domainId inside build.*', () => {
    const doc = sampleBuildDocument();
    const bad = { ...doc, build: { ...doc.build, domainId: 'domain:whatever' } } as unknown;
    expect(buildDocumentSchema.safeParse(bad).success).toBe(false);
  });

  it('requires datasetId to match puerta-ee-* pattern', () => {
    const doc = { ...sampleBuildDocument(), datasetId: 'bogus' };
    expect(buildDocumentSchema.safeParse(doc).success).toBe(false);
  });

  it('requires exactly 16 level entries', () => {
    const doc = sampleBuildDocument();
    const trimmed = {
      ...doc,
      build: { ...doc.build, levels: doc.build.levels.slice(0, 15) },
    };
    expect(buildDocumentSchema.safeParse(trimmed).success).toBe(false);
  });

  it('requires exactly 16 skillAllocations entries', () => {
    const doc = sampleBuildDocument();
    const trimmed = {
      ...doc,
      build: { ...doc.build, skillAllocations: doc.build.skillAllocations.slice(0, 15) },
    };
    expect(buildDocumentSchema.safeParse(trimmed).success).toBe(false);
  });

  it('requires exactly 16 featSelections entries', () => {
    const doc = sampleBuildDocument();
    const trimmed = {
      ...doc,
      build: { ...doc.build, featSelections: doc.build.featSelections.slice(0, 15) },
    };
    expect(buildDocumentSchema.safeParse(trimmed).success).toBe(false);
  });

  it('enforces attribute bounds 3..25', () => {
    const doc = sampleBuildDocument();
    const under = {
      ...doc,
      build: { ...doc.build, baseAttributes: { ...doc.build.baseAttributes, str: 2 } },
    };
    const over = {
      ...doc,
      build: { ...doc.build, baseAttributes: { ...doc.build.baseAttributes, str: 26 } },
    };
    expect(buildDocumentSchema.safeParse(under).success).toBe(false);
    expect(buildDocumentSchema.safeParse(over).success).toBe(false);
  });

  it('enforces skill rank bounds 0..19', () => {
    const doc = sampleBuildDocument({
      skillAllocations: Array.from({ length: 20 }, (_, i) => ({
        level: (i + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20,
        allocations: i === 0 ? [{ skillId: 'skill:concentracion', rank: 20 }] : [],
      })),
    });
    expect(buildDocumentSchema.safeParse(doc).success).toBe(false);
  });

  it('enforces canonicalId regex on every ID field', () => {
    const doc = { ...sampleBuildDocument() };
    // Invalid kind (uppercase not allowed before colon).
    const bad = { ...doc, build: { ...doc.build, raceId: 'Race:bad' } };
    expect(buildDocumentSchema.safeParse(bad).success).toBe(false);
  });

  it('requires schemaVersion literal 2', () => {
    const doc = { ...sampleBuildDocument(), schemaVersion: 1 };
    expect(buildDocumentSchema.safeParse(doc).success).toBe(false);
  });
});
