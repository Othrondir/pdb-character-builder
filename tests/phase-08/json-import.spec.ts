// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import {
  importBuildFromFile,
  JsonImportError,
} from '@planner/features/persistence/json-import';
import { sampleBuildDocument } from './setup';

describe('importBuildFromFile', () => {
  it('parses and validates a well-formed JSON BuildDocument', async () => {
    const doc = sampleBuildDocument();
    const file = new File([JSON.stringify(doc)], 'build.json', {
      type: 'application/json',
    });

    const loaded = await importBuildFromFile(file);
    expect(loaded).toEqual(doc);
  });

  it('rejects malformed JSON with a typed JsonImportError', async () => {
    const file = new File(['{"malformed": '], 'bad.json', { type: 'application/json' });

    await expect(importBuildFromFile(file)).rejects.toThrow(JsonImportError);
    await expect(importBuildFromFile(file)).rejects.toThrow(/JSON válido/);
  });

  it('rejects valid JSON that fails the BuildDocument schema', async () => {
    const file = new File([JSON.stringify({ foo: 'bar' })], 'bad.json', {
      type: 'application/json',
    });

    await expect(importBuildFromFile(file)).rejects.toThrow(JsonImportError);
    await expect(importBuildFromFile(file)).rejects.toThrow(/esquema de build/);
  });

  it('rejects documents with unknown top-level keys (strict mode)', async () => {
    const doc = { ...sampleBuildDocument(), evil: 'payload' };
    const file = new File([JSON.stringify(doc)], 'bad.json', {
      type: 'application/json',
    });

    await expect(importBuildFromFile(file)).rejects.toThrow(JsonImportError);
  });
});
