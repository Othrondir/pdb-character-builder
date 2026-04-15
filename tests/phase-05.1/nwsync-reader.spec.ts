import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { existsSync } from 'node:fs';

import { NwsyncReader } from '@data-extractor/readers/nwsync-reader';
import {
  NWSYNC_META_DB,
  NWSYNC_DATA_DB,
  PUERTA_MANIFEST_SHA1,
  RESTYPE_2DA,
  RESTYPE_TLK,
} from '@data-extractor/config';

// ---------------------------------------------------------------------------
// Integration tests - only run when nwsync databases exist locally
// ---------------------------------------------------------------------------
const hasNwsync = existsSync(NWSYNC_META_DB) && existsSync(NWSYNC_DATA_DB);

describe.skipIf(!hasNwsync)('NwsyncReader (integration)', () => {
  let reader: NwsyncReader;

  // Open before all and close after all to avoid per-test DB overhead
  beforeAll(() => {
    reader = new NwsyncReader(
      NWSYNC_META_DB,
      NWSYNC_DATA_DB,
      PUERTA_MANIFEST_SHA1,
    );
  });

  afterAll(() => {
    reader.close();
  });

  it('getResource returns non-null Buffer for a known 2DA resource (classes)', () => {
    const buf = reader.getResource('classes', RESTYPE_2DA);
    expect(buf).not.toBeNull();
    expect(buf).toBeInstanceOf(Buffer);
    // The decompressed content should start with "2DA V2.0"
    const text = buf!.toString('utf-8', 0, 8);
    expect(text).toBe('2DA V2.0');
  });

  it('getResource returns null for a nonexistent resource', () => {
    const buf = reader.getResource('nonexistent_resource_xyz', RESTYPE_2DA);
    expect(buf).toBeNull();
  });

  it('getResource returns a valid TLK binary for pb_tlk_v6', () => {
    const buf = reader.getResource('pb_tlk_v6', RESTYPE_TLK);
    expect(buf).not.toBeNull();
    // TLK files start with "TLK " magic
    const magic = buf!.toString('ascii', 0, 4);
    expect(magic).toBe('TLK ');
  });

  it('listResources(RESTYPE_2DA) returns array containing known resrefs', () => {
    const resrefs = reader.listResources(RESTYPE_2DA);
    expect(resrefs).toBeInstanceOf(Array);
    expect(resrefs.length).toBeGreaterThan(0);
    expect(resrefs).toContain('classes');
    expect(resrefs).toContain('skills');
    expect(resrefs).toContain('feat');
  });

  it('listResources returns only Puerta resources (not Arelith)', () => {
    const resrefs = reader.listResources(RESTYPE_2DA);
    // Per RESEARCH Pitfall 4: Puerta has ~338 2DAs, combined is ~754
    // We should get significantly fewer than 754
    expect(resrefs.length).toBeLessThan(500);
  });
});
