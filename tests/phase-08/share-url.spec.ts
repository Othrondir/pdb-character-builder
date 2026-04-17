import { describe, it, expect } from 'vitest';
import { deflateSync, strToU8 } from 'fflate';
import './setup';
import { sampleBuildDocument } from './setup';
import {
  encodeSharePayload,
  decodeSharePayload,
  toBase64Url,
  fromBase64Url,
  ShareDecodeError,
} from '@planner/features/persistence';

describe('share-url encode/decode', () => {
  it('round-trips a sample build document', () => {
    const doc = sampleBuildDocument();
    const encoded = encodeSharePayload(doc);
    const decoded = decodeSharePayload(encoded);
    expect(decoded).toEqual(doc);
  });

  it('is deterministic across repeated invocations', () => {
    const doc = sampleBuildDocument();
    const first = encodeSharePayload(doc);
    for (let i = 0; i < 10; i++) {
      expect(encodeSharePayload(doc)).toBe(first);
    }
  });

  it('produces base64url-safe characters only (no +, /, =)', () => {
    const doc = sampleBuildDocument();
    const encoded = encodeSharePayload(doc);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(encoded).not.toContain('+');
    expect(encoded).not.toContain('/');
    expect(encoded).not.toContain('=');
  });

  it('throws ShareDecodeError with base64url diagnostic on malformed input', () => {
    expect(() => decodeSharePayload('!not-base64!')).toThrow(ShareDecodeError);
    try {
      decodeSharePayload('!not-base64!');
    } catch (err) {
      expect((err as ShareDecodeError).message).toMatch(/base64url/i);
    }
  });

  it('throws ShareDecodeError with DEFLATE diagnostic on invalid deflate stream', () => {
    // 'aGVsbG8' decodes base64url to "hello" — not a valid DEFLATE stream.
    expect(() => decodeSharePayload('aGVsbG8')).toThrow(ShareDecodeError);
    try {
      decodeSharePayload('aGVsbG8');
    } catch (err) {
      expect((err as ShareDecodeError).message).toMatch(/DEFLATE/i);
    }
  });

  it('throws ShareDecodeError when inflated payload exceeds the 200 kB safety cap', () => {
    // Build a ~300 kB string that compresses very small (deflate flattens repetition),
    // and assert that decoding triggers the size guard.
    const huge = 'A'.repeat(300_000);
    const compressed = deflateSync(strToU8(huge), { level: 9 });
    const encoded = toBase64Url(compressed);
    expect(() => decodeSharePayload(encoded)).toThrow(ShareDecodeError);
    try {
      decodeSharePayload(encoded);
    } catch (err) {
      expect((err as ShareDecodeError).message).toMatch(/excede/i);
    }
  });

  it('throws ShareDecodeError with JSON diagnostic on invalid JSON inside a valid deflate stream', () => {
    const compressed = deflateSync(strToU8('{invalid}'), { level: 9 });
    const encoded = toBase64Url(compressed);
    expect(() => decodeSharePayload(encoded)).toThrow(ShareDecodeError);
    try {
      decodeSharePayload(encoded);
    } catch (err) {
      expect((err as ShareDecodeError).message).toMatch(/JSON/i);
    }
  });

  it('fromBase64Url inverts toBase64Url', () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 251, 252, 253, 254, 255]);
    const restored = fromBase64Url(toBase64Url(bytes));
    expect(Array.from(restored)).toEqual(Array.from(bytes));
  });
});
