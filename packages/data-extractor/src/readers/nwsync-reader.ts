/**
 * NwsyncReader - queries nwsync SQLite databases for server resources.
 *
 * The nwsync system stores server resources across two SQLite databases:
 *
 *   - **nwsyncmeta.sqlite3**: Maps manifest SHA1 + resref + restype to a
 *     content SHA1 hash (the `manifest_resrefs` table).
 *   - **nwsyncdata_0.sqlite3**: Stores NSYC v3 compressed blobs indexed by
 *     their SHA1 hash (the `resrefs` table).
 *
 * Every query is scoped to a single server manifest SHA1 to avoid mixing
 * data from multiple servers (T-05.1-09 mitigation, RESEARCH Pitfall 4).
 *
 * @module
 */

import Database from 'better-sqlite3';
import type { Statement } from 'better-sqlite3';

import { decompressNsyc } from '../parsers/nsyc-decompress';

/** Row shape returned by the meta SHA1 lookup. */
interface MetaRow {
  resref_sha1: string;
}

/** Row shape returned by the data blob lookup. */
interface DataRow {
  data: Buffer;
}

/** Row shape returned by the resref listing query. */
interface ResrefRow {
  resref: string;
}

/**
 * Reads resources from the nwsync SQLite databases, scoped to a single
 * server manifest. Every blob returned is decompressed from NSYC v3 format.
 */
export class NwsyncReader {
  private readonly metaDb: Database.Database;
  private readonly dataDb: Database.Database;
  private readonly manifestSha1: string;

  // Prepared statements for efficient repeated queries
  private readonly metaStmt: Statement;
  private readonly dataStmt: Statement;
  private readonly listStmt: Statement;

  /**
   * @param metaDbPath - Absolute path to nwsyncmeta.sqlite3.
   * @param dataDbPath - Absolute path to nwsyncdata_0.sqlite3.
   * @param manifestSha1 - SHA1 hash of the target server manifest.
   */
  constructor(metaDbPath: string, dataDbPath: string, manifestSha1: string) {
    this.metaDb = new Database(metaDbPath, { readonly: true });
    this.dataDb = new Database(dataDbPath, { readonly: true });
    this.manifestSha1 = manifestSha1;

    // T-05.1-10 mitigation: prepared statements, not string interpolation
    this.metaStmt = this.metaDb.prepare(
      'SELECT resref_sha1 FROM manifest_resrefs WHERE manifest_sha1 = ? AND resref = ? AND restype = ?',
    );

    this.dataStmt = this.dataDb.prepare(
      'SELECT data FROM resrefs WHERE sha1 = ?',
    );

    this.listStmt = this.metaDb.prepare(
      'SELECT resref FROM manifest_resrefs WHERE manifest_sha1 = ? AND restype = ?',
    );
  }

  /**
   * Get a decompressed resource by resref and restype.
   *
   * @param resref - Resource reference name (e.g., "classes", "pb_tlk_v6").
   * @param restype - Resource type code (e.g., 2017 for 2DA, 2018 for TLK).
   * @returns Decompressed resource Buffer, or null if not found in the manifest.
   */
  getResource(resref: string, restype: number): Buffer | null {
    // T-05.1-09: Always filter by manifest SHA1
    const meta = this.metaStmt.get(
      this.manifestSha1,
      resref,
      restype,
    ) as MetaRow | undefined;

    if (!meta) {
      return null;
    }

    const data = this.dataStmt.get(meta.resref_sha1) as DataRow | undefined;

    if (!data?.data) {
      return null;
    }

    // Decompress NSYC v3 container
    return decompressNsyc(data.data);
  }

  /**
   * List all resref names for a given resource type in this manifest.
   *
   * @param restype - Resource type code to filter by.
   * @returns Array of resref name strings.
   */
  listResources(restype: number): string[] {
    // T-05.1-09: Always filter by manifest SHA1
    const rows = this.listStmt.all(
      this.manifestSha1,
      restype,
    ) as ResrefRow[];

    return rows.map((r) => r.resref);
  }

  /**
   * Close both database connections. Must be called when done to release
   * file handles (T-05.1-10 mitigation).
   */
  close(): void {
    this.metaDb.close();
    this.dataDb.close();
  }
}
