/**
 * Base game resource reader.
 *
 * Orchestrates KEY index + BIF extraction to resolve base-game resources
 * (2DAs, etc.) from the NWN1 EE Steam installation. Resources not present
 * in the Puerta nwsync manifest (subraces.2da, base-game spell tables,
 * dialog.tlk) must be read from here.
 *
 * Usage:
 *   const reader = new BaseGameReader(keyPath, baseDir);
 *   const buf = reader.getResource('subraces', 2017); // 2DA type
 *   const tlk = reader.getTlk('lang/es/data/dialog.tlk');
 *
 * Threat mitigation T-05.1-07: BIF paths from the KEY file table are
 * validated to reject absolute paths and path traversal (../).
 *
 * @module
 */

import { readFileSync } from 'node:fs';
import { join, resolve, normalize } from 'node:path';

import { parseKey, type KeyEntry } from '../parsers/key-parser';
import { parseBif, type BifFile } from '../parsers/bif-parser';

/**
 * Function signature for reading a file from disk. Defaults to
 * `fs.readFileSync` but can be replaced for testing.
 */
export type FileReader = (path: string) => Buffer;

/**
 * Options for constructing a BaseGameReader.
 */
export interface BaseGameReaderOptions {
  /** Override the file-reading function (default: fs.readFileSync). */
  readFile?: FileReader;
}

/**
 * Reads base-game resources from KEY/BIF files on disk.
 */
export class BaseGameReader {
  private readonly baseDir: string;
  private readonly bifPaths: readonly string[];
  private readonly entryIndex: Map<string, KeyEntry>;
  private readonly bifCache: Map<number, BifFile | null>;
  private readonly readFile: FileReader;

  /**
   * @param keyPath - Absolute path to the KEY file (e.g., data/nwn_base.key).
   * @param baseDir - Base directory of the NWN installation. BIF paths from
   *                  the KEY file are resolved relative to this directory.
   * @param options - Optional configuration (e.g., custom file reader for testing).
   */
  constructor(keyPath: string, baseDir: string, options?: BaseGameReaderOptions) {
    this.baseDir = resolve(baseDir);
    this.bifCache = new Map();
    this.readFile = options?.readFile ?? ((p: string) => readFileSync(p) as Buffer);

    const keyData = this.readFile(keyPath);
    const keyFile = parseKey(keyData);

    this.bifPaths = keyFile.bifPaths;

    // Index entries by "resref:restype" for O(1) lookup
    this.entryIndex = new Map();
    for (const entry of keyFile.entries) {
      const key = `${entry.resref}:${entry.restype}`;
      this.entryIndex.set(key, entry);
    }
  }

  /**
   * Get the raw resource data for a resref+restype pair.
   *
   * @param resref - Resource reference name (case-insensitive, lowercased internally).
   * @param restype - Resource type code (e.g., 2017 for 2DA).
   * @returns The raw resource bytes, or null if not found or the BIF path
   *          is unsafe (path traversal / absolute path).
   */
  getResource(resref: string, restype: number): Buffer | null {
    const key = `${resref.toLowerCase()}:${restype}`;
    const entry = this.entryIndex.get(key);

    if (!entry) {
      return null;
    }

    const bif = this.loadBif(entry.bifIndex);
    if (!bif) {
      return null;
    }

    return bif.getResource(entry.resourceIndex);
  }

  /**
   * Read a standalone file (not inside a BIF) relative to the base directory.
   *
   * Primary use: reading dialog.tlk which is NOT stored in a BIF file.
   *
   * @param relativePath - Path relative to baseDir (e.g., 'lang/es/data/dialog.tlk').
   * @returns The raw file bytes.
   */
  getTlk(relativePath: string): Buffer {
    const fullPath = join(this.baseDir, relativePath);
    return this.readFile(fullPath);
  }

  /**
   * Load and cache a BIF file by its index in the KEY file table.
   *
   * T-05.1-07: Validates BIF paths to reject path traversal and absolute paths.
   */
  private loadBif(bifIndex: number): BifFile | null {
    if (this.bifCache.has(bifIndex)) {
      return this.bifCache.get(bifIndex) ?? null;
    }

    if (bifIndex < 0 || bifIndex >= this.bifPaths.length) {
      this.bifCache.set(bifIndex, null);
      return null;
    }

    const bifRelPath = this.bifPaths[bifIndex];

    // T-05.1-07: Reject path traversal and absolute paths
    if (!this.isSafeBifPath(bifRelPath)) {
      this.bifCache.set(bifIndex, null);
      return null;
    }

    // Normalize path separators and resolve relative to baseDir
    const normalizedPath = bifRelPath.replace(/\\/g, '/');
    const fullPath = join(this.baseDir, normalizedPath);

    try {
      const bifData = this.readFile(fullPath);
      const bif = parseBif(bifData);
      this.bifCache.set(bifIndex, bif);
      return bif;
    } catch {
      // BIF file not found or unreadable -- cache as null
      this.bifCache.set(bifIndex, null);
      return null;
    }
  }

  /**
   * Validate a BIF path from the KEY file table.
   *
   * T-05.1-07: Rejects:
   * - Absolute paths (starting with / or drive letter like C:\)
   * - Path traversal sequences (..)
   * - Paths that would escape the base directory after normalization
   */
  private isSafeBifPath(bifPath: string): boolean {
    // Reject absolute paths
    if (/^[a-zA-Z]:/.test(bifPath) || bifPath.startsWith('/')) {
      return false;
    }

    // Reject path traversal
    if (bifPath.includes('..')) {
      return false;
    }

    // Verify the resolved path stays within baseDir
    const normalizedPath = bifPath.replace(/\\/g, '/');
    const resolved = normalize(join(this.baseDir, normalizedPath));
    if (!resolved.startsWith(this.baseDir)) {
      return false;
    }

    return true;
  }
}
