/**
 * Domain catalog assembler.
 *
 * Reads domains.2da from nwsync (34 entries), resolves TLK names and
 * descriptions to Spanish text, cross-references granted feats and
 * spell lists via row index maps from the feat and spell assemblers,
 * and produces a validated DomainCatalog payload.
 *
 * T-05.1-15: Validates GrantedFeat and Level_* indices against known
 * feat/spell row ranges; logs warnings for unresolvable references.
 *
 * @module
 */

import { parseTwoDa, type TwoDaTable } from '../parsers/two-da-parser';
import {
  domainCatalogSchema,
  type DomainCatalog,
  type CompiledDomain,
} from '../contracts/domain-catalog';
import { RESTYPE_2DA } from '../config';
import type { NwsyncReader } from '../readers/nwsync-reader';
import type { BaseGameReader } from '../readers/base-game-reader';
import type { TlkResolver } from '../readers/tlk-resolver';
import type { AssembleResult } from './class-assembler';
import { canonicalId } from './slug-utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse an integer from a 2DA cell, returning null for **** or non-numeric values. */
function parseIntOrNull(value: string | null | undefined): number | null {
  if (value == null || value === '****' || value === '') return null;
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * Load a 2DA table by resref, trying nwsync first then base game BIF fallback.
 */
function load2da(
  resref: string,
  nwsyncReader: NwsyncReader,
  baseGameReader: BaseGameReader,
): TwoDaTable | null {
  const buf = nwsyncReader.getResource(resref, RESTYPE_2DA);
  if (buf) return parseTwoDa(buf.toString('utf-8'));

  const baseBuf = baseGameReader.getResource(resref, RESTYPE_2DA);
  if (baseBuf) return parseTwoDa(baseBuf.toString('utf-8'));

  return null;
}

// ---------------------------------------------------------------------------
// Main assembler
// ---------------------------------------------------------------------------

/**
 * Assemble the domain catalog from domains.2da.
 *
 * @param nwsyncReader - NwsyncReader for accessing Puerta server data.
 * @param baseGameReader - BaseGameReader for fallback data.
 * @param tlkResolver - TlkResolver for Spanish text resolution.
 * @param featIdsByRow - Map of feat.2da row index to canonical feat ID.
 * @param spellIdsByRow - Map of spells.2da row index to canonical spell ID.
 * @param datasetId - Dataset provenance identifier.
 * @returns The assembled and validated domain catalog with warnings.
 */
export function assembleDomainCatalog(
  nwsyncReader: NwsyncReader,
  baseGameReader: BaseGameReader,
  tlkResolver: TlkResolver,
  featIdsByRow: Map<number, string>,
  spellIdsByRow: Map<number, string>,
  datasetId: string,
): AssembleResult<DomainCatalog> {
  const warnings: string[] = [];

  // -------------------------------------------------------------------------
  // 1. Load domains.2da
  // -------------------------------------------------------------------------
  const domainsTable = load2da('domains', nwsyncReader, baseGameReader);
  if (!domainsTable) {
    throw new Error('domains.2da not found in nwsync or base game');
  }

  // -------------------------------------------------------------------------
  // 2. Build domain entries
  // -------------------------------------------------------------------------
  const domains: CompiledDomain[] = [];

  for (const [rowIndex, row] of domainsTable.rows) {
    // Skip inactive domains if IsActive column exists
    if (row.IsActive === '0') {
      continue;
    }

    // Generate canonical ID from Label if available, else from row index
    const label = row.Label;
    const id = label ? canonicalId('domain', label) : `domain:row-${rowIndex}`;

    // Resolve Spanish name and description via TLK
    const nameStrref = parseIntOrNull(row.Name);
    const descStrref = parseIntOrNull(row.Description);
    const resolvedName = nameStrref != null ? tlkResolver.resolve(nameStrref) : '';
    const resolvedDesc = descStrref != null ? tlkResolver.resolve(descStrref) : '';

    const displayLabel = resolvedName || label || `Domain ${rowIndex}`;

    // D-13: Warn for empty TLK resolution
    if (nameStrref != null && !resolvedName) {
      warnings.push(`Domain row ${rowIndex}: Name strref ${nameStrref} resolved to empty`);
    }

    // -----------------------------------------------------------------------
    // Granted feats
    // -----------------------------------------------------------------------
    const grantedFeatIds: string[] = [];

    // Check GrantedFeat column (single feat)
    const grantedFeatIndex = parseIntOrNull(row.GrantedFeat);
    if (grantedFeatIndex != null) {
      const featId = featIdsByRow.get(grantedFeatIndex);
      if (featId) {
        grantedFeatIds.push(featId);
      } else {
        // T-05.1-15: Log warning for unresolvable feat reference
        warnings.push(
          `Domain row ${rowIndex} (${displayLabel}): GrantedFeat=${grantedFeatIndex} not found in feat catalog`,
        );
      }
    }

    // Check additional granted feat columns (GrantedFeat1, GrantedFeat2, etc.)
    for (let i = 1; i <= 5; i++) {
      const colName = `GrantedFeat${i}`;
      const extraFeatIndex = parseIntOrNull(row[colName]);
      if (extraFeatIndex != null) {
        const featId = featIdsByRow.get(extraFeatIndex);
        if (featId) {
          grantedFeatIds.push(featId);
        } else {
          warnings.push(
            `Domain row ${rowIndex} (${displayLabel}): ${colName}=${extraFeatIndex} not found in feat catalog`,
          );
        }
      }
    }

    // -----------------------------------------------------------------------
    // Spell lists by level (Level_0 through Level_9)
    // Zod record with enum keys requires all keys present, so default to []
    // -----------------------------------------------------------------------
    const spellIds: Record<string, string[]> = {};

    for (let lvl = 0; lvl <= 9; lvl++) {
      const colName = `Level_${lvl}`;
      const spellIndex = parseIntOrNull(row[colName]);
      if (spellIndex != null) {
        const spellId = spellIdsByRow.get(spellIndex);
        if (spellId) {
          spellIds[String(lvl)] = [spellId];
        } else {
          // T-05.1-15: Log warning for unresolvable spell reference
          warnings.push(
            `Domain row ${rowIndex} (${displayLabel}): ${colName}=${spellIndex} not found in spell catalog`,
          );
          spellIds[String(lvl)] = [];
        }
      } else {
        // Default to empty array for levels without spells
        spellIds[String(lvl)] = [];
      }
    }

    domains.push({
      description: resolvedDesc,
      grantedFeatIds,
      id,
      label: displayLabel,
      sourceRow: rowIndex,
      spellIds,
    });
  }

  if (domains.length === 0) {
    throw new Error('No active domains found in domains.2da');
  }

  // -------------------------------------------------------------------------
  // 3. Build and validate catalog
  // -------------------------------------------------------------------------
  const catalog: DomainCatalog = {
    datasetId,
    domains,
    schemaVersion: '1',
  };

  const parsed = domainCatalogSchema.parse(catalog);

  return { catalog: parsed, warnings };
}
