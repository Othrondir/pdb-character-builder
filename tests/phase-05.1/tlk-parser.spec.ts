import { describe, it, expect } from 'vitest';
import { parseTlk } from '@data-extractor/parsers/tlk-parser';
import type { TlkTable } from '@data-extractor/parsers/tlk-parser';

/**
 * Build a minimal TLK V3.0 binary buffer for testing.
 *
 * Header (20 bytes):
 *   0-3:   "TLK " magic
 *   4-7:   "V3.0" version
 *   8-11:  language ID (uint32 LE)
 *   12-15: string count (uint32 LE)
 *   16-19: strings data offset from start of file (uint32 LE)
 *
 * Entry table: starts at byte 20, 40 bytes per entry
 *   0-3:   flags (uint32 LE) - bit 0 = has text
 *   4-19:  sound ResRef (16 bytes, null-padded)
 *   20-23: volume variance (uint32 LE)
 *   24-27: pitch variance (uint32 LE)
 *   28-31: string offset (uint32 LE, relative to strings data section)
 *   32-35: string length (uint32 LE)
 *   36-39: sound length (float32 LE)
 */
function buildTlkBuffer(
  entries: Array<{ text: string; hasText: boolean }>,
): Buffer {
  const stringCount = entries.length;
  const entryTableSize = stringCount * 40;
  const stringsDataOffset = 20 + entryTableSize;

  // Build the strings data section
  const stringBuffers: Buffer[] = [];
  const stringOffsets: number[] = [];
  let currentOffset = 0;

  for (const entry of entries) {
    stringOffsets.push(currentOffset);
    // Encode as Latin-1 to simulate NWN behavior
    const strBuf = Buffer.from(entry.text, 'latin1');
    stringBuffers.push(strBuf);
    currentOffset += strBuf.length;
  }

  const stringsData = Buffer.concat(stringBuffers);
  const totalSize = stringsDataOffset + stringsData.length;
  const buffer = Buffer.alloc(totalSize);

  // Header
  buffer.write('TLK ', 0, 4, 'ascii');
  buffer.write('V3.0', 4, 4, 'ascii');
  buffer.writeUInt32LE(0, 8); // language ID
  buffer.writeUInt32LE(stringCount, 12);
  buffer.writeUInt32LE(stringsDataOffset, 16);

  // Entry table
  for (let i = 0; i < entries.length; i++) {
    const entryOffset = 20 + i * 40;
    const flags = entries[i].hasText ? 1 : 0;
    buffer.writeUInt32LE(flags, entryOffset); // flags
    // bytes 4-19: sound resref (zeros)
    // bytes 20-23: volume variance (0)
    // bytes 24-27: pitch variance (0)
    buffer.writeUInt32LE(stringOffsets[i], entryOffset + 28); // string offset
    buffer.writeUInt32LE(
      entries[i].hasText ? Buffer.from(entries[i].text, 'latin1').length : 0,
      entryOffset + 32,
    ); // string length
    // bytes 36-39: sound length (0.0)
  }

  // Strings data
  stringsData.copy(buffer, stringsDataOffset);

  return buffer;
}

describe('parseTlk', () => {
  const testEntries = [
    { text: 'Hello', hasText: true },
    { text: 'Palad\u00edn', hasText: true }, // "Paladín" in Latin-1
    { text: '', hasText: false }, // flags=0, no text
  ];

  let tlk: TlkTable;

  it('returns correct stringCount', () => {
    const buffer = buildTlkBuffer(testEntries);
    tlk = parseTlk(buffer);
    expect(tlk.stringCount).toBe(3);
  });

  it('returns the first string', () => {
    const buffer = buildTlkBuffer(testEntries);
    tlk = parseTlk(buffer);
    expect(tlk.getString(0)).toBe('Hello');
  });

  it('correctly decodes Latin-1 Spanish accented characters', () => {
    const buffer = buildTlkBuffer(testEntries);
    tlk = parseTlk(buffer);
    // "Paladín" - the í (U+00ED) should come through from Latin-1
    expect(tlk.getString(1)).toBe('Palad\u00edn');
  });

  it('returns empty string for entries with flags=0 (no text)', () => {
    const buffer = buildTlkBuffer(testEntries);
    tlk = parseTlk(buffer);
    expect(tlk.getString(2)).toBe('');
  });

  it('returns empty string for out-of-range index (positive)', () => {
    const buffer = buildTlkBuffer(testEntries);
    tlk = parseTlk(buffer);
    expect(tlk.getString(999)).toBe('');
  });

  it('returns empty string for out-of-range index (negative)', () => {
    const buffer = buildTlkBuffer(testEntries);
    tlk = parseTlk(buffer);
    expect(tlk.getString(-1)).toBe('');
  });

  it('throws for non-TLK file (invalid magic)', () => {
    const garbage = Buffer.from('NOT A TLK FILE AT ALL!!');
    expect(() => parseTlk(garbage)).toThrow('Not a TLK file');
  });

  it('handles a single-entry TLK with Spanish text', () => {
    const buffer = buildTlkBuffer([
      { text: 'Mago de combate espa\u00f1ol', hasText: true },
    ]);
    const t = parseTlk(buffer);
    expect(t.stringCount).toBe(1);
    expect(t.getString(0)).toBe('Mago de combate espa\u00f1ol');
  });
});
