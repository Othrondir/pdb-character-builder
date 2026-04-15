/**
 * NSYC v3 container decompressor.
 *
 * Every resource blob in the nwsync data database (nwsyncdata_0.sqlite3) is
 * wrapped in the NSYC v3 container format:
 *
 *   Bytes 0-3:   "NSYC" magic (ASCII)
 *   Bytes 4-7:   version (uint32 LE) -- must be 3
 *   Bytes 8-23:  sub-header (compression type, uncompressed size, etc.)
 *   Bytes 24+:   zstd-compressed payload
 *
 * This module validates the magic/version header and decompresses the payload
 * using fzstd (pure JS Zstandard implementation).
 *
 * @module
 */

import { decompress } from 'fzstd';

const NSYC_MAGIC = Buffer.from('NSYC');
const NSYC_HEADER_SIZE = 24; // 4 magic + 4 version + 16 sub-header

/**
 * Decompress an NSYC v3 blob from nwsync into its raw resource content.
 *
 * @param blob - The raw NSYC container bytes from the nwsync data database.
 * @returns The decompressed resource content as a Buffer.
 * @throws If the blob is not a valid NSYC v3 container or decompression fails.
 */
export function decompressNsyc(blob: Buffer): Buffer {
  // Validate magic header
  if (blob.length < NSYC_HEADER_SIZE || !blob.subarray(0, 4).equals(NSYC_MAGIC)) {
    throw new Error('Not an NSYC container');
  }

  // Validate version
  const version = blob.readUInt32LE(4);
  if (version !== 3) {
    throw new Error(`Unsupported NSYC version: ${version}`);
  }

  // Reject truncated blobs with no payload data
  if (blob.length <= NSYC_HEADER_SIZE) {
    throw new Error('Truncated NSYC container: no payload after header');
  }

  // Decompress the zstd payload after the 24-byte header
  const payload = blob.subarray(NSYC_HEADER_SIZE);
  return Buffer.from(decompress(payload));
}
