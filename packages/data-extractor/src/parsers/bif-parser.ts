/**
 * BIF V1.0 binary parser.
 *
 * Parses the NWN BIF (BIFF) format used to store game resources such as 2DA
 * tables, scripts, models, and other assets. Each BIF contains a flat table
 * of variable-size resources indexed by ID.
 *
 * Binary layout:
 *
 *   Header (20 bytes):
 *     0-3:   "BIFF" magic (ASCII)
 *     4-7:   "V1  " version (ASCII)
 *     8-11:  variable resource count (uint32 LE)
 *     12-15: fixed resource count (uint32 LE)
 *     16-19: variable table offset from start of file (uint32 LE)
 *
 *   Variable resource table (16 bytes per entry):
 *     0-3:   resource ID (uint32 LE)
 *     4-7:   resource offset from start of file (uint32 LE)
 *     8-11:  resource size in bytes (uint32 LE)
 *     12-15: resource type (uint32 LE)
 *
 * Threat mitigation T-05.1-05: All offset+size reads are bounds-checked
 * against the buffer length before slicing.
 *
 * @module
 */

const BIF_MAGIC = 'BIFF';
const BIF_VERSION = 'V1  ';
const BIF_HEADER_SIZE = 20;
const BIF_VAR_ENTRY_SIZE = 16;

/**
 * A single variable resource entry from the BIF resource table.
 */
export interface BifResourceEntry {
  /** Resource ID (index within the BIF). */
  id: number;
  /** Byte offset from start of BIF data. */
  offset: number;
  /** Size in bytes. */
  size: number;
  /** Resource type code (e.g., 2017 for 2DA). */
  type: number;
}

/**
 * Parsed BIF file. Provides indexed access to resource data.
 */
export interface BifFile {
  /** All variable resource entries. */
  readonly entries: readonly BifResourceEntry[];

  /**
   * Get the raw resource data by entry index (position in the entries array).
   *
   * @param index - Zero-based index into the entries array.
   * @returns The raw resource bytes, or null if the index is out of range
   *          or the entry's offset+size exceeds the buffer bounds.
   */
  getResource(index: number): Buffer | null;
}

/**
 * Parse a BIF V1.0 binary buffer into an indexed resource file.
 *
 * @param data - The raw BIF file bytes.
 * @returns A BifFile for extracting resource data.
 * @throws If the buffer does not have a valid BIF V1.0 header.
 */
export function parseBif(data: Buffer): BifFile {
  // Validate magic and version (T-05.1-05: header validation)
  if (
    data.length < BIF_HEADER_SIZE ||
    data.toString('ascii', 0, 4) !== BIF_MAGIC ||
    data.toString('ascii', 4, 8) !== BIF_VERSION
  ) {
    throw new Error('Not a BIF file');
  }

  const varResourceCount = data.readUInt32LE(8);
  const varTableOffset = data.readUInt32LE(16);

  // Bounds-check the variable table (T-05.1-05)
  const tableEnd = varTableOffset + varResourceCount * BIF_VAR_ENTRY_SIZE;
  if (tableEnd > data.length) {
    throw new Error(
      'BIF variable table extends beyond buffer bounds',
    );
  }

  // Parse variable resource entries
  const entries: BifResourceEntry[] = [];

  for (let i = 0; i < varResourceCount; i++) {
    const entryOffset = varTableOffset + i * BIF_VAR_ENTRY_SIZE;

    entries.push({
      id: data.readUInt32LE(entryOffset),
      offset: data.readUInt32LE(entryOffset + 4),
      size: data.readUInt32LE(entryOffset + 8),
      type: data.readUInt32LE(entryOffset + 12),
    });
  }

  return {
    entries,

    getResource(index: number): Buffer | null {
      if (index < 0 || index >= entries.length) {
        return null;
      }

      const entry = entries[index];

      // Bounds-check resource data against buffer size (T-05.1-05)
      if (entry.offset + entry.size > data.length) {
        return null;
      }

      return data.subarray(entry.offset, entry.offset + entry.size);
    },
  };
}
