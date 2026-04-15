/**
 * KEY V1.0 binary parser.
 *
 * Parses the NWN KEY format used to index resources across multiple BIF files.
 * The KEY file maps resref+restype pairs to specific BIF files and resource
 * indices within those BIFs.
 *
 * Binary layout:
 *
 *   Header (24+ bytes, but we read the first 24):
 *     0-3:   "KEY " magic (ASCII, note trailing space)
 *     4-7:   "V1  " version (ASCII, note trailing spaces)
 *     8-11:  BIF file count (uint32 LE)
 *     12-15: key entry count (uint32 LE)
 *     16-19: BIF file table offset (uint32 LE)
 *     20-23: key table offset (uint32 LE)
 *
 *   BIF file table (12 bytes per entry):
 *     0-3:   file size (uint32 LE)
 *     4-7:   filename offset from start of file (uint32 LE)
 *     8-9:   filename size (uint16 LE)
 *     10-11: drives bitmask (uint16 LE)
 *
 *   Key table (22 bytes per entry):
 *     0-15:  resref (16 bytes ASCII, null-padded)
 *     16-17: resource type (uint16 LE)
 *     18-21: resource ID (uint32 LE)
 *             bifIndex = (resid >> 20) & 0xFFF
 *             resourceIndex = resid & 0xFFFFF
 *
 * Threat mitigation T-05.1-06: All offsets and table sizes are bounds-checked
 * against the buffer length before reading.
 *
 * @module
 */

const KEY_MAGIC = 'KEY ';
const KEY_VERSION = 'V1  ';
const KEY_HEADER_SIZE = 24;
const BIF_FILE_ENTRY_SIZE = 12;
const KEY_ENTRY_SIZE = 22;

/**
 * A key table entry mapping a resref to a BIF resource location.
 */
export interface KeyEntry {
  /** Resource reference name (lowercase, trimmed). */
  resref: string;
  /** Resource type code (e.g., 2017 for 2DA). */
  restype: number;
  /** Index into the BIF file table. */
  bifIndex: number;
  /** Resource index within the BIF file. */
  resourceIndex: number;
}

/**
 * Parsed KEY file. Contains BIF paths and resource index entries.
 */
export interface KeyFile {
  /** Relative BIF file paths (forward-slashed, from KEY file table). */
  readonly bifPaths: readonly string[];
  /** All key table entries. */
  readonly entries: readonly KeyEntry[];
}

/**
 * Parse a KEY V1.0 binary buffer into a resource index.
 *
 * @param data - The raw KEY file bytes.
 * @returns A KeyFile with BIF paths and key entries.
 * @throws If the buffer does not have a valid KEY V1.0 header.
 */
export function parseKey(data: Buffer): KeyFile {
  // Validate magic and version (T-05.1-06: header validation)
  if (
    data.length < KEY_HEADER_SIZE ||
    data.toString('ascii', 0, 4) !== KEY_MAGIC ||
    data.toString('ascii', 4, 8) !== KEY_VERSION
  ) {
    throw new Error('Not a KEY file');
  }

  const bifCount = data.readUInt32LE(8);
  const keyCount = data.readUInt32LE(12);
  const fileTableOffset = data.readUInt32LE(16);
  const keyTableOffset = data.readUInt32LE(20);

  // Bounds-check BIF file table (T-05.1-06)
  const fileTableEnd = fileTableOffset + bifCount * BIF_FILE_ENTRY_SIZE;
  if (fileTableEnd > data.length) {
    throw new Error('KEY BIF file table extends beyond buffer bounds');
  }

  // Bounds-check key table (T-05.1-06)
  const keyTableEnd = keyTableOffset + keyCount * KEY_ENTRY_SIZE;
  if (keyTableEnd > data.length) {
    throw new Error('KEY key table extends beyond buffer bounds');
  }

  // Parse BIF file table
  const bifPaths: string[] = [];

  for (let i = 0; i < bifCount; i++) {
    const entryBase = fileTableOffset + i * BIF_FILE_ENTRY_SIZE;
    const filenameOffset = data.readUInt32LE(entryBase + 4);
    const filenameSize = data.readUInt16LE(entryBase + 8);

    // Bounds-check filename read (T-05.1-06)
    if (filenameOffset + filenameSize > data.length) {
      throw new Error(
        `KEY BIF filename at index ${i} extends beyond buffer bounds`,
      );
    }

    // Read filename as ASCII, trim null bytes, normalize path separators
    let filename = data
      .subarray(filenameOffset, filenameOffset + filenameSize)
      .toString('ascii')
      .replace(/\0+$/, '');

    // Normalize backslashes to forward slashes for cross-platform consistency
    filename = filename.replace(/\\/g, '/');

    bifPaths.push(filename);
  }

  // Parse key table
  const entries: KeyEntry[] = [];

  for (let i = 0; i < keyCount; i++) {
    const entryBase = keyTableOffset + i * KEY_ENTRY_SIZE;

    // Read 16-byte null-padded ASCII resref
    const resref = data
      .subarray(entryBase, entryBase + 16)
      .toString('ascii')
      .replace(/\0+$/, '')
      .toLowerCase();

    const restype = data.readUInt16LE(entryBase + 16);
    const resid = data.readUInt32LE(entryBase + 18);

    // Decompose resid into BIF index and resource index
    const bifIndex = (resid >>> 20) & 0xfff;
    const resourceIndex = resid & 0xfffff;

    entries.push({ resref, restype, bifIndex, resourceIndex });
  }

  return { bifPaths, entries };
}
