import { deflateSync, inflateSync, strFromU8, strToU8 } from 'fflate';
import type { BuildDocument } from './build-document-schema';

/**
 * Share URL encode/decode.
 * Pipeline: BuildDocument -> JSON.stringify -> fflate.deflateSync(raw, level 9) -> base64url.
 * Decode reverses the pipeline. Caller must Zod-validate the decoded output via buildDocumentSchema.
 *
 * - Raw DEFLATE (no zlib header) = smallest envelope for URL payloads. Per fflate docs,
 *   `deflateSync` produces raw DEFLATE bytes (matches pako's `deflateRaw`).
 * - base64url per RFC 4648 §5: URL-safe alphabet, no padding.
 * - Zip-bomb mitigation: inflateSync output bounded at MAX_INFLATED_BYTES (200 kB). Largest
 *   legit payload is ~6 kB. A 30× safety factor guards against crafted deflate streams.
 */

const MAX_INFLATED_BYTES = 200_000;

export class ShareDecodeError extends Error {
  public readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'ShareDecodeError';
    this.cause = cause;
  }
}

export function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromBase64Url(s: string): Uint8Array {
  // Restore standard base64 padding.
  const pad = s.length % 4 === 0 ? 0 : 4 - (s.length % 4);
  const base64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad);
  let binary: string;
  try {
    binary = atob(base64);
  } catch (err) {
    throw new ShareDecodeError('Payload base64url inválido', err);
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function encodeSharePayload(doc: BuildDocument): string {
  const json = JSON.stringify(doc); // No whitespace — canonical form.
  const compressed = deflateSync(strToU8(json), { level: 9 });
  return toBase64Url(compressed);
}

export function decodeSharePayload(b: string): unknown {
  const compressed = fromBase64Url(b);
  let inflated: Uint8Array;
  try {
    inflated = inflateSync(compressed);
  } catch (err) {
    throw new ShareDecodeError('Payload DEFLATE inválido', err);
  }
  if (inflated.length > MAX_INFLATED_BYTES) {
    throw new ShareDecodeError(
      `Payload descomprimido excede ${MAX_INFLATED_BYTES} bytes`,
    );
  }
  try {
    return JSON.parse(strFromU8(inflated));
  } catch (err) {
    throw new ShareDecodeError('JSON inválido dentro del payload', err);
  }
}
