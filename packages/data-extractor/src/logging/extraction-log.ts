/**
 * Extraction log.
 *
 * Accumulates extraction events (catalogs assembled, warnings, skipped items)
 * and produces a human-readable report for extraction provenance auditing.
 *
 * Per D-14: The report includes dataset provenance, per-catalog summaries,
 * warning details, and skipped item details.
 *
 * @module
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CatalogEntry {
  name: string;
  itemCount: number;
}

interface WarningEntry {
  catalog: string;
  message: string;
}

interface SkippedEntry {
  catalog: string;
  item: string;
  reason: string;
}

// ---------------------------------------------------------------------------
// ExtractionLog
// ---------------------------------------------------------------------------

/**
 * Accumulates extraction events and produces a human-readable report.
 */
export class ExtractionLog {
  private readonly catalogs: CatalogEntry[] = [];
  private readonly warnings: WarningEntry[] = [];
  private readonly skipped: SkippedEntry[] = [];
  private datasetId = '';
  private manifestSha1 = '';
  private timestamp = '';

  /** Record a successfully assembled catalog. */
  addCatalog(name: string, itemCount: number): void {
    this.catalogs.push({ name, itemCount });
  }

  /** Record a warning from a catalog assembly. */
  addWarning(catalog: string, message: string): void {
    this.warnings.push({ catalog, message });
  }

  /** Record a skipped item from a catalog assembly. */
  addSkipped(catalog: string, item: string, reason: string): void {
    this.skipped.push({ catalog, item, reason });
  }

  /** Record dataset provenance information. */
  setProvenance(datasetId: string, manifestSha1: string, timestamp: string): void {
    this.datasetId = datasetId;
    this.manifestSha1 = manifestSha1;
    this.timestamp = timestamp;
  }

  /** Get total items across all catalogs. */
  get totalItems(): number {
    return this.catalogs.reduce((sum, c) => sum + c.itemCount, 0);
  }

  /** Get total warning count. */
  get totalWarnings(): number {
    return this.warnings.length;
  }

  /** Get total skipped count. */
  get totalSkipped(): number {
    return this.skipped.length;
  }

  /**
   * Produce a human-readable report string.
   */
  toReport(): string {
    const lines: string[] = [];

    // Header
    lines.push('='.repeat(60));
    lines.push('  Puerta de Baldur Data Extraction Report');
    lines.push('='.repeat(60));
    lines.push('');

    // Provenance
    lines.push('PROVENANCE');
    lines.push(`  Dataset ID:    ${this.datasetId}`);
    lines.push(`  Manifest SHA1: ${this.manifestSha1}`);
    lines.push(`  Extracted:     ${this.timestamp}`);
    lines.push('');

    // Catalog summaries
    lines.push('-'.repeat(60));
    lines.push('CATALOGS');
    lines.push('-'.repeat(60));
    for (const catalog of this.catalogs) {
      lines.push(`  ${catalog.name.padEnd(20)} ${String(catalog.itemCount).padStart(6)} items`);
    }
    lines.push('');

    // Warnings
    if (this.warnings.length > 0) {
      lines.push('-'.repeat(60));
      lines.push(`WARNINGS (${this.warnings.length})`);
      lines.push('-'.repeat(60));
      for (const w of this.warnings) {
        lines.push(`  [${w.catalog}] ${w.message}`);
      }
      lines.push('');
    }

    // Skipped items
    if (this.skipped.length > 0) {
      lines.push('-'.repeat(60));
      lines.push(`SKIPPED ITEMS (${this.skipped.length})`);
      lines.push('-'.repeat(60));
      for (const s of this.skipped) {
        lines.push(`  [${s.catalog}] ${s.item}: ${s.reason}`);
      }
      lines.push('');
    }

    // Footer
    lines.push('='.repeat(60));
    lines.push(`  TOTAL: ${this.totalItems} items | ${this.totalWarnings} warnings | ${this.totalSkipped} skipped`);
    lines.push('='.repeat(60));
    lines.push('');

    return lines.join('\n');
  }
}
