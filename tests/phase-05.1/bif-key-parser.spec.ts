import { describe, it, expect } from 'vitest';

// ── Helpers: build synthetic binary fixtures ──────────────────────────

/**
 * Build a minimal valid BIF V1.0 buffer with a single variable resource.
 *
 * Layout:
 *   Header (20 bytes):
 *     0-3:   "BIFF" magic
 *     4-7:   "V1  " version
 *     8-11:  variable resource count (uint32 LE)
 *     12-15: fixed resource count (uint32 LE) -- 0 for our needs
 *     16-19: variable table offset (uint32 LE)
 *
 *   Payload (5 bytes at offset 20):
 *     "HELLO"
 *
 *   Variable resource table (at offset 25):
 *     Entry 0 (16 bytes): id=0, offset=20, size=5, type=2017 (2DA restype)
 */
function buildBifBuffer(): Buffer {
  const payloadOffset = 20;
  const payload = Buffer.from('HELLO', 'ascii');
  const tableOffset = payloadOffset + payload.length; // 25
  const entryCount = 1;

  const buf = Buffer.alloc(tableOffset + entryCount * 16);

  // Header
  buf.write('BIFF', 0, 4, 'ascii');
  buf.write('V1  ', 4, 4, 'ascii');
  buf.writeUInt32LE(entryCount, 8);  // variable resource count
  buf.writeUInt32LE(0, 12);           // fixed resource count
  buf.writeUInt32LE(tableOffset, 16); // variable table offset

  // Payload at offset 20
  payload.copy(buf, payloadOffset);

  // Variable resource table entry at offset 25
  const entryBase = tableOffset;
  buf.writeUInt32LE(0, entryBase);           // id
  buf.writeUInt32LE(payloadOffset, entryBase + 4); // offset
  buf.writeUInt32LE(payload.length, entryBase + 8); // size
  buf.writeUInt32LE(2017, entryBase + 12);   // type (2DA)

  return buf;
}

/**
 * Build a minimal valid KEY V1.0 buffer with one BIF reference and one key entry.
 *
 * Layout:
 *   Header (24 bytes -- 64 bytes total in the format, but we use the minimum):
 *     0-3:   "KEY " magic
 *     4-7:   "V1  " version
 *     8-11:  bif count (uint32 LE) = 1
 *     12-15: key count (uint32 LE) = 1
 *     16-19: file table offset (uint32 LE)
 *     20-23: key table offset (uint32 LE)
 *
 *   Filename string (at offset 24): "data\0base_2da.bif\0" (18 bytes)
 *
 *   BIF file table (at offset 42):
 *     Entry 0 (12 bytes): fileSize(4) + filenameOffset(4) + filenameSize(2) + drives(2)
 *
 *   Key table (at offset 54):
 *     Entry 0 (22 bytes): resref "subraces" (16 bytes, null-padded) + restype 2017 (uint16 LE)
 *                          + resid (uint32 LE) where bifIndex=0, resourceIndex=0
 */
function buildKeyBuffer(): Buffer {
  const filenameStr = 'data\\base_2da.bif';
  const filenameBytes = Buffer.from(filenameStr, 'ascii');
  const filenameOffset = 24;
  const fileTableOffset = filenameOffset + filenameBytes.length;
  const bifFileEntrySize = 12; // fileSize(4) + filenameOffset(4) + filenameSize(2) + drives(2)
  const keyTableOffset = fileTableOffset + bifFileEntrySize;
  const keyEntrySize = 22;

  const totalSize = keyTableOffset + keyEntrySize;
  const buf = Buffer.alloc(totalSize);

  // Header
  buf.write('KEY ', 0, 4, 'ascii');
  buf.write('V1  ', 4, 4, 'ascii');
  buf.writeUInt32LE(1, 8);  // bif count
  buf.writeUInt32LE(1, 12); // key count
  buf.writeUInt32LE(fileTableOffset, 16); // file table offset
  buf.writeUInt32LE(keyTableOffset, 20);  // key table offset

  // Filename string
  filenameBytes.copy(buf, filenameOffset);

  // BIF file table entry
  buf.writeUInt32LE(1024, fileTableOffset);        // fileSize (arbitrary)
  buf.writeUInt32LE(filenameOffset, fileTableOffset + 4); // filenameOffset
  buf.writeUInt16LE(filenameBytes.length, fileTableOffset + 8); // filenameSize
  buf.writeUInt16LE(0, fileTableOffset + 10);      // drives

  // Key table entry
  const resref = 'subraces';
  buf.write(resref, keyTableOffset, 16, 'ascii'); // 16-byte null-padded
  buf.writeUInt16LE(2017, keyTableOffset + 16);   // restype (2DA)
  // resid: bifIndex=0 in upper 12 bits, resourceIndex=0 in lower 20 bits
  const resid = (0 << 20) | 0;
  buf.writeUInt32LE(resid, keyTableOffset + 18);

  return buf;
}

// ── BIF parser tests ──────────────────────────────────────────────────

describe('parseBif', () => {
  it('parses a valid BIF V1.0 buffer and returns resource entries', async () => {
    const { parseBif } = await import(
      '@data-extractor/parsers/bif-parser'
    );
    const bifBuf = buildBifBuffer();
    const bif = parseBif(bifBuf);

    expect(bif.entries).toHaveLength(1);
    expect(bif.entries[0].type).toBe(2017);
    expect(bif.entries[0].size).toBe(5);
  });

  it('extracts resource data by index using offset+size', async () => {
    const { parseBif } = await import(
      '@data-extractor/parsers/bif-parser'
    );
    const bifBuf = buildBifBuffer();
    const bif = parseBif(bifBuf);

    const resource = bif.getResource(0);
    expect(resource).not.toBeNull();
    expect(resource!.toString('ascii')).toBe('HELLO');
  });

  it('returns null for out-of-range resource index', async () => {
    const { parseBif } = await import(
      '@data-extractor/parsers/bif-parser'
    );
    const bifBuf = buildBifBuffer();
    const bif = parseBif(bifBuf);

    expect(bif.getResource(999)).toBeNull();
  });

  it('throws for invalid magic', async () => {
    const { parseBif } = await import(
      '@data-extractor/parsers/bif-parser'
    );
    const badBuf = Buffer.alloc(20);
    badBuf.write('NOPE', 0, 4, 'ascii');

    expect(() => parseBif(badBuf)).toThrow('Not a BIF file');
  });

  it('throws for truncated buffer', async () => {
    const { parseBif } = await import(
      '@data-extractor/parsers/bif-parser'
    );
    const tiny = Buffer.alloc(10);
    tiny.write('BIFF', 0, 4, 'ascii');

    expect(() => parseBif(tiny)).toThrow('Not a BIF file');
  });

  it('rejects resource entry with offset beyond buffer bounds', async () => {
    const { parseBif } = await import(
      '@data-extractor/parsers/bif-parser'
    );
    // Build a BIF with an entry that points beyond the buffer
    const tableOffset = 20;
    const buf = Buffer.alloc(tableOffset + 16);
    buf.write('BIFF', 0, 4, 'ascii');
    buf.write('V1  ', 4, 4, 'ascii');
    buf.writeUInt32LE(1, 8);
    buf.writeUInt32LE(0, 12);
    buf.writeUInt32LE(tableOffset, 16);
    // Entry with offset way beyond buffer
    buf.writeUInt32LE(0, tableOffset);
    buf.writeUInt32LE(9999, tableOffset + 4); // offset beyond buffer
    buf.writeUInt32LE(100, tableOffset + 8);
    buf.writeUInt32LE(2017, tableOffset + 12);

    const bif = parseBif(buf);
    // Attempt to read the out-of-bounds resource should return null
    expect(bif.getResource(0)).toBeNull();
  });
});

// ── KEY parser tests ──────────────────────────────────────────────────

describe('parseKey', () => {
  it('parses a valid KEY V1.0 buffer and returns BIF paths and entries', async () => {
    const { parseKey } = await import(
      '@data-extractor/parsers/key-parser'
    );
    const keyBuf = buildKeyBuffer();
    const key = parseKey(keyBuf);

    expect(key.bifPaths).toHaveLength(1);
    expect(key.bifPaths[0]).toBe('data/base_2da.bif');
    expect(key.entries).toHaveLength(1);
  });

  it('resolves resref, restype, bifIndex, and resourceIndex correctly', async () => {
    const { parseKey } = await import(
      '@data-extractor/parsers/key-parser'
    );
    const keyBuf = buildKeyBuffer();
    const key = parseKey(keyBuf);

    const entry = key.entries[0];
    expect(entry.resref).toBe('subraces');
    expect(entry.restype).toBe(2017);
    expect(entry.bifIndex).toBe(0);
    expect(entry.resourceIndex).toBe(0);
  });

  it('throws for invalid magic', async () => {
    const { parseKey } = await import(
      '@data-extractor/parsers/key-parser'
    );
    const badBuf = Buffer.alloc(24);
    badBuf.write('NOPE', 0, 4, 'ascii');

    expect(() => parseKey(badBuf)).toThrow('Not a KEY file');
  });

  it('throws for truncated buffer', async () => {
    const { parseKey } = await import(
      '@data-extractor/parsers/key-parser'
    );
    const tiny = Buffer.alloc(10);
    tiny.write('KEY ', 0, 4, 'ascii');

    expect(() => parseKey(tiny)).toThrow('Not a KEY file');
  });

  it('resolves bifIndex from upper bits and resourceIndex from lower bits', async () => {
    const { parseKey } = await import(
      '@data-extractor/parsers/key-parser'
    );

    // Build KEY with bifIndex=2 and resourceIndex=42
    const filenameStr = 'data\\test.bif';
    const filenameBytes = Buffer.from(filenameStr, 'ascii');
    const filenameOffset = 24;
    // We need 3 BIF file entries but only 1 key entry referencing BIF index 2
    const fileTableOffset = filenameOffset + filenameBytes.length;
    const bifFileEntrySize = 12;
    const bifCount = 3;
    const keyTableOffset = fileTableOffset + bifCount * bifFileEntrySize;
    const keyEntrySize = 22;

    const buf = Buffer.alloc(keyTableOffset + keyEntrySize);
    buf.write('KEY ', 0, 4, 'ascii');
    buf.write('V1  ', 4, 4, 'ascii');
    buf.writeUInt32LE(bifCount, 8);
    buf.writeUInt32LE(1, 12);
    buf.writeUInt32LE(fileTableOffset, 16);
    buf.writeUInt32LE(keyTableOffset, 20);

    filenameBytes.copy(buf, filenameOffset);

    // 3 BIF file table entries (all pointing to same filename for simplicity)
    for (let i = 0; i < bifCount; i++) {
      const base = fileTableOffset + i * bifFileEntrySize;
      buf.writeUInt32LE(1024, base);
      buf.writeUInt32LE(filenameOffset, base + 4);
      buf.writeUInt16LE(filenameBytes.length, base + 8);
      buf.writeUInt16LE(0, base + 10);
    }

    // Key entry: bifIndex=2, resourceIndex=42
    buf.write('testres', keyTableOffset, 16, 'ascii');
    buf.writeUInt16LE(2017, keyTableOffset + 16);
    const resid = (2 << 20) | 42;
    buf.writeUInt32LE(resid, keyTableOffset + 18);

    const key = parseKey(buf);
    expect(key.entries[0].bifIndex).toBe(2);
    expect(key.entries[0].resourceIndex).toBe(42);
  });
});

// ── BaseGameReader tests ──────────────────────────────────────────────

/**
 * Create a mock file reader that dispatches on path substrings.
 * Each entry maps a path substring to the Buffer it should return.
 */
function mockFileReader(
  fileMap: Record<string, Buffer>,
  tracker?: { calls: string[] },
): (path: string) => Buffer {
  return (filePath: string): Buffer => {
    tracker?.calls.push(filePath);
    for (const [substr, buf] of Object.entries(fileMap)) {
      if (filePath.includes(substr)) {
        return buf;
      }
    }
    throw new Error(`Unexpected file read: ${filePath}`);
  };
}

describe('BaseGameReader', () => {
  it('resolves a resource by resref and restype through KEY+BIF chain', async () => {
    const { BaseGameReader } = await import(
      '@data-extractor/readers/base-game-reader'
    );

    const keyBuf = buildKeyBuffer();
    const bifBuf = buildBifBuffer();

    const readFile = mockFileReader({
      '.key': keyBuf,
      'base_2da.bif': bifBuf,
    });

    const reader = new BaseGameReader('/game/nwn_base.key', '/game', { readFile });
    const result = reader.getResource('subraces', 2017);

    expect(result).not.toBeNull();
    expect(result!.toString('ascii')).toBe('HELLO');
  });

  it('returns null for unknown resref', async () => {
    const { BaseGameReader } = await import(
      '@data-extractor/readers/base-game-reader'
    );

    const keyBuf = buildKeyBuffer();
    const readFile = mockFileReader({ '.key': keyBuf });

    const reader = new BaseGameReader('/game/nwn_base.key', '/game', { readFile });
    const result = reader.getResource('nonexistent', 2017);

    expect(result).toBeNull();
  });

  it('caches BIF files lazily (only parses on first access)', async () => {
    const { BaseGameReader } = await import(
      '@data-extractor/readers/base-game-reader'
    );

    const keyBuf = buildKeyBuffer();
    const bifBuf = buildBifBuffer();

    const tracker = { calls: [] as string[] };
    const readFile = mockFileReader(
      { '.key': keyBuf, 'base_2da.bif': bifBuf },
      tracker,
    );

    const reader = new BaseGameReader('/game/nwn_base.key', '/game', { readFile });

    // First access should read the BIF (call count: 1 for KEY + 1 for BIF = 2)
    reader.getResource('subraces', 2017);
    const afterFirst = tracker.calls.filter((c) => c.includes('base_2da.bif')).length;
    expect(afterFirst).toBe(1);

    // Second access should NOT re-read the BIF
    reader.getResource('subraces', 2017);
    const afterSecond = tracker.calls.filter((c) => c.includes('base_2da.bif')).length;
    expect(afterSecond).toBe(1);
  });

  it('provides getTlk to read a standalone TLK file directly', async () => {
    const { BaseGameReader } = await import(
      '@data-extractor/readers/base-game-reader'
    );

    const keyBuf = buildKeyBuffer();
    const fakeTlkContent = Buffer.from('TLK_CONTENT_HERE', 'ascii');

    const readFile = mockFileReader({
      '.key': keyBuf,
      'dialog.tlk': fakeTlkContent,
    });

    const reader = new BaseGameReader('/game/nwn_base.key', '/game', { readFile });
    const tlk = reader.getTlk('lang/es/data/dialog.tlk');

    expect(tlk.toString('ascii')).toBe('TLK_CONTENT_HERE');
  });

  it('rejects path traversal in BIF filenames from KEY', async () => {
    const { BaseGameReader } = await import(
      '@data-extractor/readers/base-game-reader'
    );

    // Build KEY with a path-traversal BIF filename
    const filenameStr = '..\\..\\etc\\passwd';
    const filenameBytes = Buffer.from(filenameStr, 'ascii');
    const filenameOffset = 24;
    const fileTableOffset = filenameOffset + filenameBytes.length;
    const bifFileEntrySize = 12;
    const keyTableOffset = fileTableOffset + bifFileEntrySize;
    const keyEntrySize = 22;
    const totalSize = keyTableOffset + keyEntrySize;
    const buf = Buffer.alloc(totalSize);

    buf.write('KEY ', 0, 4, 'ascii');
    buf.write('V1  ', 4, 4, 'ascii');
    buf.writeUInt32LE(1, 8);
    buf.writeUInt32LE(1, 12);
    buf.writeUInt32LE(fileTableOffset, 16);
    buf.writeUInt32LE(keyTableOffset, 20);
    filenameBytes.copy(buf, filenameOffset);
    buf.writeUInt32LE(1024, fileTableOffset);
    buf.writeUInt32LE(filenameOffset, fileTableOffset + 4);
    buf.writeUInt16LE(filenameBytes.length, fileTableOffset + 8);
    buf.writeUInt16LE(0, fileTableOffset + 10);
    buf.write('evilres', keyTableOffset, 16, 'ascii');
    buf.writeUInt16LE(2017, keyTableOffset + 16);
    buf.writeUInt32LE(0, keyTableOffset + 18);

    const readFile = mockFileReader({ '.key': buf });

    const reader = new BaseGameReader('/game/nwn_base.key', '/game', { readFile });
    // Should reject/return null for a resource from a path-traversal BIF
    const result = reader.getResource('evilres', 2017);
    expect(result).toBeNull();
  });
});
