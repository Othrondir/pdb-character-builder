/**
 * TlkResolver - unified dual-TLK string resolver.
 *
 * NWN1 uses two TLK tables simultaneously:
 *
 *   - **Base TLK** (dialog.tlk from the game installation): Contains all
 *     standard NWN text. String references < 0x01000000 (16,777,216) index
 *     into this table.
 *
 *   - **Custom TLK** (Puerta pb_tlk_v6 from nwsync): Contains server-added
 *     Spanish text for custom classes, feats, skills, etc. String references
 *     >= 0x01000000 index into this table at (strref - 0x01000000).
 *
 * Every Name and Description column in a 2DA file uses integer string
 * references (strrefs). This resolver dispatches each strref to the correct
 * TLK table and returns the resolved Spanish text.
 *
 * @module
 */

import { readFileSync } from 'node:fs';

import { parseTlk, type TlkTable } from '../parsers/tlk-parser';
import { CUSTOM_TLK_OFFSET, CUSTOM_TLK_RESREF, CUSTOM_TLK_RESTYPE } from '../config';
import type { NwsyncReader } from './nwsync-reader';

/**
 * Strip NWN engine color markup tags from a string.
 *
 * NWN uses `<c{3 raw bytes}>text</c>` to colorize in-game text.
 * The 3 bytes after `<c` are binary RGB values (not hex), so they
 * appear as arbitrary characters when decoded as Latin-1/UTF-8.
 * We strip both the opening `<c...>` tag and the closing `</c>`.
 */
function stripNwnColorCodes(text: string): string {
  // <c followed by exactly 3 arbitrary characters, then >
  return text.replace(/<c.{3}>/g, '').replace(/<\/c>/g, '');
}

/**
 * Resolves NWN string references to Spanish text using the dual-TLK system.
 */
export class TlkResolver {
  private readonly baseTlk: TlkTable;
  private readonly customTlk: TlkTable;

  /**
   * @param baseTlk - Parsed base game TLK table (dialog.tlk).
   * @param customTlk - Parsed custom server TLK table (pb_tlk_v6).
   */
  constructor(baseTlk: TlkTable, customTlk: TlkTable) {
    this.baseTlk = baseTlk;
    this.customTlk = customTlk;
  }

  /**
   * Resolve a string reference to its text value.
   *
   * @param strref - Integer string reference from a 2DA cell.
   * @returns The resolved text string. Returns empty string for invalid,
   *          negative, NaN, or out-of-range strrefs.
   */
  resolve(strref: number): string {
    // Guard against NaN, undefined, negative, or non-number inputs
    if (strref == null || !Number.isFinite(strref) || strref < 0) {
      return '';
    }

    if (strref >= CUSTOM_TLK_OFFSET) {
      const customIndex = strref - CUSTOM_TLK_OFFSET;
      return stripNwnColorCodes(this.customTlk.getString(customIndex));
    }

    return stripNwnColorCodes(this.baseTlk.getString(strref));
  }

  /**
   * Factory method: load both TLK tables from disk and nwsync, then
   * construct a TlkResolver.
   *
   * @param baseTlkPath - Absolute path to the base game dialog.tlk file.
   * @param nwsyncReader - NwsyncReader for retrieving the custom TLK.
   * @returns A configured TlkResolver ready for use.
   * @throws If the base TLK file cannot be read or the custom TLK is not
   *         found in nwsync.
   */
  static fromPaths(baseTlkPath: string, nwsyncReader: NwsyncReader): TlkResolver {
    // Read and parse base game TLK
    const baseTlkData = readFileSync(baseTlkPath);
    const baseTlk = parseTlk(baseTlkData as Buffer);

    // Read and parse custom Puerta TLK from nwsync
    const customTlkData = nwsyncReader.getResource(
      CUSTOM_TLK_RESREF,
      CUSTOM_TLK_RESTYPE,
    );

    if (!customTlkData) {
      throw new Error(
        `Custom TLK '${CUSTOM_TLK_RESREF}' not found in nwsync manifest`,
      );
    }

    const customTlk = parseTlk(customTlkData);

    return new TlkResolver(baseTlk, customTlk);
  }
}
