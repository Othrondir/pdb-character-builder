/**
 * Data extractor CLI orchestrator.
 *
 * Single-pass extraction of all NWN catalogs from the Puerta de Baldur server
 * nwsync data. Runs all assemblers in dependency order, emits TypeScript
 * catalog files, and produces an extraction report.
 *
 * Usage: cd packages/data-extractor && npx tsx src/cli.ts
 *   or:  pnpm extract
 *
 * Per D-07: Single-pass extraction of ALL catalogs.
 * Per D-13: Best-effort -- if a single assembler fails, log the error and
 *           continue with other catalogs.
 * Per T-05.1-17: No machine-local paths in generated output.
 * Per T-05.1-18: CLI runs locally at build time only.
 *
 * @module
 */

import { writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import {
  NWSYNC_META_DB,
  NWSYNC_DATA_DB,
  PUERTA_MANIFEST_SHA1,
  BASE_GAME_KEY,
  BASE_GAME_DIR,
  BASE_GAME_TLK,
  RESTYPE_2DA,
  OUTPUT_DIR,
} from './config';
import { NwsyncReader } from './readers/nwsync-reader';
import { BaseGameReader } from './readers/base-game-reader';
import { TlkResolver } from './readers/tlk-resolver';
import { parseTwoDa } from './parsers/two-da-parser';
import { ExtractionLog } from './logging/extraction-log';
import { emitTypescriptCatalog, writeTypescriptCatalog, type EmitOptions } from './emitters/ts-emitter';

// Assemblers
import { assembleClassCatalog } from './assemblers/class-assembler';
import { assembleRaceCatalog } from './assemblers/race-assembler';
import { assembleSkillCatalog } from './assemblers/skill-assembler';
import { assembleFeatCatalog, buildFeatIdsByRow, type ClassRowInfo } from './assemblers/feat-assembler';
import { assembleSpellCatalog, buildSpellIdsByRow, type SpellClassRowInfo } from './assemblers/spell-assembler';
import { assembleDomainCatalog } from './assemblers/domain-assembler';
import { assembleDeityData } from './assemblers/deity-assembler';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build the classRows map that the feat assembler needs.
 * Maps canonical class ID -> { sourceRow, featTableRef }.
 */
function buildFeatClassRows(
  classes: Array<{ id: string; sourceRow: number; featTableRef: string | null }>,
): Map<string, ClassRowInfo> {
  const map = new Map<string, ClassRowInfo>();
  for (const c of classes) {
    map.set(c.id, { sourceRow: c.sourceRow, featTableRef: c.featTableRef });
  }
  return map;
}

/**
 * Build the classRows map that the spell assembler needs.
 * Maps canonical class ID -> { sourceRow, spellGainTableRef, spellKnownTableRef, spellColumnName }.
 *
 * The spellColumnName is the raw Label from classes.2da, which corresponds to
 * the column header in spells.2da for that class's spell levels. Only classes
 * whose Label matches a column in spells.2da are included.
 */
function buildSpellClassRows(
  classes: Array<{
    id: string;
    sourceRow: number;
    spellGainTableRef: string | null;
    spellKnownTableRef: string | null;
    spellCaster: boolean;
  }>,
  classLabelsByRow: Map<number, string>,
  spellsColumnNames: Set<string>,
): Map<string, SpellClassRowInfo> {
  const map = new Map<string, SpellClassRowInfo>();

  for (const c of classes) {
    // Only spellcaster classes need spell column mapping
    if (!c.spellCaster) continue;

    const rawLabel = classLabelsByRow.get(c.sourceRow);
    if (!rawLabel) continue;

    // Check if the raw label matches a spells.2da column header
    // NWN1 convention: column names in spells.2da match the classes.2da Label
    // except for "Wizard" which maps to "Wiz_Sorc"
    let columnName: string | null = null;

    // Direct match first
    if (spellsColumnNames.has(rawLabel)) {
      columnName = rawLabel;
    }

    // Known NWN1 aliased mappings
    if (!columnName) {
      const LABEL_TO_COLUMN: Record<string, string> = {
        Wizard: 'Wiz_Sorc',
        Sorcerer: 'Wiz_Sorc',
      };
      if (LABEL_TO_COLUMN[rawLabel] && spellsColumnNames.has(LABEL_TO_COLUMN[rawLabel])) {
        columnName = LABEL_TO_COLUMN[rawLabel];
      }
    }

    // Case-insensitive fallback: try matching the label to column names
    if (!columnName) {
      for (const col of spellsColumnNames) {
        if (col.toLowerCase() === rawLabel.toLowerCase()) {
          columnName = col;
          break;
        }
      }
    }

    if (columnName) {
      map.set(c.id, {
        sourceRow: c.sourceRow,
        spellGainTableRef: c.spellGainTableRef,
        spellKnownTableRef: c.spellKnownTableRef,
        spellColumnName: columnName,
      });
    }
  }

  return map;
}

/**
 * Load classes.2da and extract the raw Label for each PlayerClass=1 row.
 * Returns a map of sourceRow -> rawLabel.
 */
function loadClassLabels(
  nwsyncReader: NwsyncReader,
  baseGameReader: BaseGameReader,
): Map<number, string> {
  const map = new Map<number, string>();
  const buf = nwsyncReader.getResource('classes', RESTYPE_2DA)
    ?? baseGameReader.getResource('classes', RESTYPE_2DA);
  if (!buf) return map;

  const table = parseTwoDa(buf.toString('utf-8'));
  for (const [rowIndex, row] of table.rows) {
    if (row.PlayerClass !== '1') continue;
    if (row.Label) {
      map.set(rowIndex, row.Label);
    }
  }
  return map;
}

/**
 * Load spells.2da and extract column header names.
 */
function loadSpellsColumnNames(
  nwsyncReader: NwsyncReader,
  baseGameReader: BaseGameReader,
): Set<string> {
  const buf = nwsyncReader.getResource('spells', RESTYPE_2DA)
    ?? baseGameReader.getResource('spells', RESTYPE_2DA);
  if (!buf) return new Set();

  const table = parseTwoDa(buf.toString('utf-8'));
  return new Set(table.columns);
}

// ---------------------------------------------------------------------------
// Catalog emit configuration
// ---------------------------------------------------------------------------

interface CatalogEmitConfig {
  fileName: string;
  catalogName: string;
  schemaImport: string;
  schemaName: string;
  typeName: string;
}

const CATALOG_CONFIGS: Record<string, CatalogEmitConfig> = {
  classes: {
    fileName: 'compiled-classes.ts',
    catalogName: 'compiledClassCatalog',
    schemaImport: '@data-extractor/contracts/class-catalog',
    schemaName: 'classCatalogSchema',
    typeName: 'ClassCatalog',
  },
  races: {
    fileName: 'compiled-races.ts',
    catalogName: 'compiledRaceCatalog',
    schemaImport: '@data-extractor/contracts/race-catalog',
    schemaName: 'raceCatalogSchema',
    typeName: 'RaceCatalog',
  },
  skills: {
    fileName: 'compiled-skills.ts',
    catalogName: 'compiledSkillCatalog',
    schemaImport: '@data-extractor/contracts/skill-catalog',
    schemaName: 'skillCatalogSchema',
    typeName: 'SkillCatalog',
  },
  feats: {
    fileName: 'compiled-feats.ts',
    catalogName: 'compiledFeatCatalog',
    schemaImport: '@data-extractor/contracts/feat-catalog',
    schemaName: 'featCatalogSchema',
    typeName: 'FeatCatalog',
  },
  spells: {
    fileName: 'compiled-spells.ts',
    catalogName: 'compiledSpellCatalog',
    schemaImport: '@data-extractor/contracts/spell-catalog',
    schemaName: 'spellCatalogSchema',
    typeName: 'SpellCatalog',
  },
  domains: {
    fileName: 'compiled-domains.ts',
    catalogName: 'compiledDomainCatalog',
    schemaImport: '@data-extractor/contracts/domain-catalog',
    schemaName: 'domainCatalogSchema',
    typeName: 'DomainCatalog',
  },
};

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------

export async function main(): Promise<void> {
  const startTime = Date.now();
  console.log('Puerta de Baldur Data Extractor');
  console.log('='.repeat(50));

  // -------------------------------------------------------------------------
  // a. Open readers
  // -------------------------------------------------------------------------
  console.log('\n[1/4] Opening data sources...');
  const nwsyncReader = new NwsyncReader(NWSYNC_META_DB, NWSYNC_DATA_DB, PUERTA_MANIFEST_SHA1);
  const baseGameReader = new BaseGameReader(BASE_GAME_KEY, BASE_GAME_DIR);

  // -------------------------------------------------------------------------
  // b. Create TlkResolver
  // -------------------------------------------------------------------------
  console.log('[2/4] Loading TLK tables...');
  const tlkResolver = TlkResolver.fromPaths(BASE_GAME_TLK, nwsyncReader);

  // -------------------------------------------------------------------------
  // c. Create ExtractionLog and generate datasetId
  // -------------------------------------------------------------------------
  const log = new ExtractionLog();
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const hashPrefix = PUERTA_MANIFEST_SHA1.slice(0, 8);
  const datasetId = `puerta-ee-${dateStr}+${hashPrefix}`;
  const timestamp = now.toISOString();

  log.setProvenance(datasetId, PUERTA_MANIFEST_SHA1, timestamp);

  console.log(`[3/4] Dataset: ${datasetId}`);
  console.log('');

  // Load auxiliary data for cross-assembler linking
  const classLabelsByRow = loadClassLabels(nwsyncReader, baseGameReader);
  const spellsColumnNames = loadSpellsColumnNames(nwsyncReader, baseGameReader);

  // -------------------------------------------------------------------------
  // d. Run assemblers in dependency order
  // -------------------------------------------------------------------------
  console.log('[4/4] Running assemblers...');

  const catalogs: Record<string, unknown> = {};
  let featIdsByRow = new Map<number, string>();
  let spellIdsByRow = new Map<number, string>();

  // 1. Classes (needed by skill, feat, spell assemblers)
  try {
    console.log('  [1/7] Assembling classes...');
    const result = assembleClassCatalog(nwsyncReader, baseGameReader, tlkResolver, datasetId);
    catalogs.classes = result.catalog;
    log.addCatalog('classes', result.catalog.classes.length);
    for (const w of result.warnings) log.addWarning('classes', w);
    console.log(`         ${result.catalog.classes.length} classes assembled`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.addWarning('classes', `FAILED: ${message}`);
    console.error(`  ERROR: Class assembly failed: ${message}`);
  }

  // 2. Races
  try {
    console.log('  [2/7] Assembling races...');
    const result = assembleRaceCatalog(nwsyncReader, baseGameReader, tlkResolver, datasetId);
    catalogs.races = result.catalog;
    log.addCatalog('races', result.catalog.races.length);
    for (const w of result.warnings) log.addWarning('races', w);
    console.log(`         ${result.catalog.races.length} races assembled`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.addWarning('races', `FAILED: ${message}`);
    console.error(`  ERROR: Race assembly failed: ${message}`);
  }

  // 3. Skills
  try {
    console.log('  [3/7] Assembling skills...');
    const result = assembleSkillCatalog(nwsyncReader, baseGameReader, tlkResolver, datasetId);
    catalogs.skills = result.catalog;
    log.addCatalog('skills', result.catalog.skills.length);
    for (const w of result.warnings) log.addWarning('skills', w);
    console.log(`         ${result.catalog.skills.length} skills assembled`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.addWarning('skills', `FAILED: ${message}`);
    console.error(`  ERROR: Skill assembly failed: ${message}`);
  }

  // 4. Feats (needs classRows from classes)
  try {
    console.log('  [4/7] Assembling feats...');
    const classCatalog = catalogs.classes as { classes: Array<{ id: string; sourceRow: number; featTableRef: string | null }> } | undefined;
    const featClassRows = classCatalog
      ? buildFeatClassRows(classCatalog.classes)
      : new Map<string, ClassRowInfo>();

    const result = assembleFeatCatalog(nwsyncReader, baseGameReader, tlkResolver, featClassRows, datasetId);
    catalogs.feats = result.catalog;
    // Phase 7 Plan 07-01 Task 1: Prefer the full pre-filter map so domain assembler
    // can resolve GrantedFeat indices that point at feats excluded by the D-08 player filter.
    featIdsByRow = result.featIdsByRowFull ?? buildFeatIdsByRow(result.catalog.feats);
    log.addCatalog('feats', result.catalog.feats.length);
    for (const w of result.warnings) log.addWarning('feats', w);
    console.log(`         ${result.catalog.feats.length} feats assembled`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.addWarning('feats', `FAILED: ${message}`);
    console.error(`  ERROR: Feat assembly failed: ${message}`);
  }

  // 5. Spells (needs classRows from classes)
  try {
    console.log('  [5/7] Assembling spells...');
    const classCatalog = catalogs.classes as {
      classes: Array<{
        id: string;
        sourceRow: number;
        spellGainTableRef: string | null;
        spellKnownTableRef: string | null;
        spellCaster: boolean;
      }>;
    } | undefined;

    const spellClassRows = classCatalog
      ? buildSpellClassRows(classCatalog.classes, classLabelsByRow, spellsColumnNames)
      : new Map<string, SpellClassRowInfo>();

    const result = assembleSpellCatalog(nwsyncReader, baseGameReader, tlkResolver, spellClassRows, datasetId);
    catalogs.spells = result.catalog;
    spellIdsByRow = buildSpellIdsByRow(result.catalog.spells);
    log.addCatalog('spells', result.catalog.spells.length);
    for (const w of result.warnings) log.addWarning('spells', w);
    console.log(`         ${result.catalog.spells.length} spells assembled`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.addWarning('spells', `FAILED: ${message}`);
    console.error(`  ERROR: Spell assembly failed: ${message}`);
  }

  // 6. Domains (needs featIdsByRow, spellIdsByRow)
  try {
    console.log('  [6/7] Assembling domains...');
    const result = assembleDomainCatalog(
      nwsyncReader, baseGameReader, tlkResolver,
      featIdsByRow, spellIdsByRow, datasetId,
    );
    catalogs.domains = result.catalog;
    log.addCatalog('domains', result.catalog.domains.length);
    for (const w of result.warnings) log.addWarning('domains', w);
    console.log(`         ${result.catalog.domains.length} domains assembled`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.addWarning('domains', `FAILED: ${message}`);
    console.error(`  ERROR: Domain assembly failed: ${message}`);
  }

  // 7. Deities (gap documentation)
  try {
    console.log('  [7/7] Checking deity data...');
    const result = assembleDeityData(nwsyncReader, baseGameReader, tlkResolver);
    // Deity returns null catalog -- document the gap
    for (const w of result.warnings) log.addWarning('deities', w);
    console.log('         Deity data: gap documented (no 2DA found)');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.addWarning('deities', `FAILED: ${message}`);
    console.error(`  ERROR: Deity check failed: ${message}`);
  }

  // -------------------------------------------------------------------------
  // e. Emit TypeScript catalog files
  // -------------------------------------------------------------------------
  console.log('\nEmitting TypeScript catalogs...');

  const outputDir = resolve(OUTPUT_DIR);
  let emittedCount = 0;

  for (const [key, config] of Object.entries(CATALOG_CONFIGS)) {
    const data = catalogs[key];
    if (!data) {
      console.log(`  SKIP: ${config.fileName} (assembler failed)`);
      continue;
    }

    const content = emitTypescriptCatalog({
      catalogName: config.catalogName,
      schemaImport: config.schemaImport,
      schemaName: config.schemaName,
      typeName: config.typeName,
      data,
    });

    const outputPath = join(outputDir, config.fileName);
    writeTypescriptCatalog(outputPath, content);
    console.log(`  EMIT: ${config.fileName}`);
    emittedCount++;
  }

  // Deity placeholder file
  const deityContent = [
    `// Generated by data-extractor on ${timestamp}. Do not edit manually.`,
    '',
    '// No deity 2DA found in nwsync or base game. See extraction log.',
    '// Deity data requires manual overrides from server documentation.',
    'export const compiledDeityCatalog = null;',
    '',
  ].join('\n');
  writeTypescriptCatalog(join(outputDir, 'compiled-deities.ts'), deityContent);
  console.log('  EMIT: compiled-deities.ts (placeholder)');
  emittedCount++;

  // Also emit a getCompiledSkillRecord helper in compiled-skills.ts
  // The existing planner code expects this helper function
  if (catalogs.skills) {
    const skillsPath = join(outputDir, 'compiled-skills.ts');
    // Read the emitted file and append the helper
    const existingContent = emitTypescriptCatalog({
      catalogName: CATALOG_CONFIGS.skills.catalogName,
      schemaImport: CATALOG_CONFIGS.skills.schemaImport,
      schemaName: CATALOG_CONFIGS.skills.schemaName,
      typeName: CATALOG_CONFIGS.skills.typeName,
      data: catalogs.skills,
    });

    const contentWithHelper = existingContent + [
      'export function getCompiledSkillRecord(skillId: string) {',
      '  return compiledSkillCatalog.skills.find((skill) => skill.id === skillId) ?? null;',
      '}',
      '',
    ].join('\n');

    writeTypescriptCatalog(skillsPath, contentWithHelper);
  }

  // -------------------------------------------------------------------------
  // f. Write extraction report
  // -------------------------------------------------------------------------
  const reportPath = resolve('extraction-report.txt');
  writeFileSync(reportPath, log.toReport(), 'utf-8');
  console.log(`\nExtraction report: ${reportPath}`);

  // -------------------------------------------------------------------------
  // g. Close readers
  // -------------------------------------------------------------------------
  nwsyncReader.close();

  // -------------------------------------------------------------------------
  // h. Summary
  // -------------------------------------------------------------------------
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n' + '='.repeat(50));
  console.log(`Extraction complete in ${elapsed}s`);
  console.log(`  Catalogs emitted: ${emittedCount}`);
  console.log(`  Total items:      ${log.totalItems}`);
  console.log(`  Total warnings:   ${log.totalWarnings}`);
  console.log('='.repeat(50));
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

main().catch((err) => {
  console.error('Fatal extraction error:', err);
  process.exit(1);
});
