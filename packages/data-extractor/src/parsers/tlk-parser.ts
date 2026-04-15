/**
 * TLK V3.0 binary parser.
 *
 * Parses the NWN Talk Table format used by both the base game dialog.tlk and
 * the Puerta de Baldur custom TLK (pb_tlk_v6). Resolves string references to
 * Spanish text.
 *
 * Binary layout:
 *
 *   Header (20 bytes):
 *     0-3:   "TLK " magic (ASCII, note trailing space)
 *     4-7:   "V3.0" version (ASCII)
 *     8-11:  language ID (uint32 LE)
 *     12-15: string count (uint32 LE)
 *     16-19: strings data offset from start of file (uint32 LE)
 *
 *   Entry table (starts at byte 20, 40 bytes per entry):
 *     0-3:   flags (uint32 LE) - bit 0 = has text
 *     4-19:  sound ResRef (16 bytes ASCII, null-padded)
 *     20-23: volume variance (uint32 LE)
 *     24-27: pitch variance (uint32 LE)
 *     28-31: string offset (uint32 LE, relative to strings data section)
 *     32-35: string length (uint32 LE)
 *     36-39: sound length (float32 LE)
 *
 *   Strings data section (starts at stringsDataOffset from file start):
 *     Raw string bytes, addressed by entry offsets/lengths.
 *
 * Strings are decoded as Latin-1 (Windows-1252 compatible for NWN1) which
 * correctly handles Spanish accented characters.
 *
 * @module
 */

const TLK_MAGIC = 'TLK ';
const TLK_VERSION = 'V3.0';
const TLK_HEADER_SIZE = 20;
const TLK_ENTRY_SIZE = 40;
const TLK_FLAG_TEXT = 0x01;

/**
 * Parsed TLK string table. Provides indexed access to resolved strings.
 */
export interface TlkTable {
  /** Total number of string entries in the TLK file. */
  readonly stringCount: number;

  /**
   * Get the string at the given index.
   *
   * @param index - Zero-based string index.
   * @returns The resolved string, or empty string if the index is out of range
   *          or the entry has no text (flags bit 0 not set).
   */
  getString(index: number): string;
}

/**
 * Parse a TLK V3.0 binary buffer into an indexed string table.
 *
 * @param data - The raw TLK file bytes.
 * @returns A TlkTable for resolving string references.
 * @throws If the buffer does not have a valid TLK V3.0 header.
 */
export function parseTlk(data: Buffer): TlkTable {
  // Validate magic and version
  if (
    data.length < TLK_HEADER_SIZE ||
    data.toString('ascii', 0, 4) !== TLK_MAGIC ||
    data.toString('ascii', 4, 8) !== TLK_VERSION
  ) {
    throw new Error('Not a TLK file');
  }

  const stringCount = data.readUInt32LE(12);
  const stringsDataOffset = data.readUInt32LE(16);

  return {
    stringCount,

    getString(index: number): string {
      if (index < 0 || index >= stringCount) {
        return '';
      }

      const entryOffset = TLK_HEADER_SIZE + index * TLK_ENTRY_SIZE;

      // Bounds-check the entry against the buffer (T-05.1-02 mitigation)
      if (entryOffset + TLK_ENTRY_SIZE > data.length) {
        return '';
      }

      const flags = data.readUInt32LE(entryOffset);

      // Only read text if the text flag is set
      if (!(flags & TLK_FLAG_TEXT)) {
        return '';
      }

      const strOffset = data.readUInt32LE(entryOffset + 28);
      const strLen = data.readUInt32LE(entryOffset + 32);

      if (strLen === 0) {
        return '';
      }

      // Bounds-check string data against buffer size (T-05.1-02 mitigation)
      const absOffset = stringsDataOffset + strOffset;
      if (absOffset + strLen > data.length) {
        return '';
      }

      // Decode as Latin-1 -- correctly handles Spanish accented characters
      return data.subarray(absOffset, absOffset + strLen).toString('latin1');
    },
  };
}
