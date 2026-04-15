import { describe, it, expect } from 'vitest';
import { zstdCompressSync } from 'node:zlib';
import { decompressNsyc } from '@data-extractor/parsers/nsyc-decompress';

/**
 * Build a synthetic NSYC v3 blob for testing.
 *
 * Format: 4-byte "NSYC" magic + 4-byte uint32LE version + 16-byte sub-header
 *         + zstd-compressed payload.
 */
function buildNsycBlob(payload: Buffer, version = 3): Buffer {
  const compressed = zstdCompressSync(payload);
  const header = Buffer.alloc(24);
  header.write('NSYC', 0, 4, 'ascii');
  header.writeUInt32LE(version, 4);
  // Sub-header bytes 8-23: compression type (uint32LE=1 for zstd) + uncompressed size, etc.
  header.writeUInt32LE(1, 8); // compression type
  header.writeUInt32LE(payload.length, 12); // uncompressed size
  // bytes 16-23 can stay zero for testing
  return Buffer.concat([header, compressed]);
}

describe('decompressNsyc', () => {
  it('decompresses a valid NSYC v3 blob', () => {
    const original = Buffer.from('hello world', 'utf-8');
    const blob = buildNsycBlob(original);
    const result = decompressNsyc(blob);
    expect(result.toString('utf-8')).toBe('hello world');
  });

  it('throws for non-NSYC blob', () => {
    const garbage = Buffer.from('NOT_NSYC_DATA_HERE');
    expect(() => decompressNsyc(garbage)).toThrow('Not an NSYC container');
  });

  it('throws for unsupported NSYC version', () => {
    const original = Buffer.from('test', 'utf-8');
    const blob = buildNsycBlob(original, 2);
    expect(() => decompressNsyc(blob)).toThrow('Unsupported NSYC version: 2');
  });

  it('throws on truncated blob (no payload after header)', () => {
    const header = Buffer.alloc(24);
    header.write('NSYC', 0, 4, 'ascii');
    header.writeUInt32LE(3, 4);
    // No payload at all -- fzstd should throw on empty/invalid data
    expect(() => decompressNsyc(header)).toThrow();
  });

  it('handles larger payloads', () => {
    const original = Buffer.alloc(10000, 0x42); // 10KB of 'B'
    const blob = buildNsycBlob(original);
    const result = decompressNsyc(blob);
    expect(result.length).toBe(10000);
    expect(result.every((b) => b === 0x42)).toBe(true);
  });
});
