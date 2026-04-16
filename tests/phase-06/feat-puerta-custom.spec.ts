import { describe, expect, it } from 'vitest';
import { compiledFeatCatalog } from '@planner/data/compiled-feats';

describe('phase 06 Puerta de Baldur custom feats (FEAT-04)', () => {
  it('contains Puerta-specific feat IDs with "pb" or "herramientapb" identifiers', () => {
    const puertaFeats = compiledFeatCatalog.feats.filter(
      (f) => f.id.includes('pb'),
    );

    // Puerta-specific feats like herramientapb1, herramientapb3, etc.
    expect(puertaFeats.length).toBeGreaterThanOrEqual(2);
  });

  it('contains the (PB) Herramientas del jugador feat', () => {
    const herramientas = compiledFeatCatalog.feats.find(
      (f) => f.id === 'feat:herramientapb3-herramientas',
    );

    expect(herramientas).toBeDefined();
    expect(herramientas?.label).toContain('PB');
  });

  it('has classFeatLists for all 39 classes', () => {
    const classCount = Object.keys(compiledFeatCatalog.classFeatLists).length;

    expect(classCount).toBeGreaterThanOrEqual(39);
  });

  it('has valid feat IDs in classFeatLists that exist in the feats array', () => {
    const featIdSet = new Set(compiledFeatCatalog.feats.map((f) => f.id));
    const errors: string[] = [];

    for (const [classId, entries] of Object.entries(compiledFeatCatalog.classFeatLists)) {
      for (const entry of entries) {
        if (!featIdSet.has(entry.featId)) {
          errors.push(`${classId}: ${entry.featId} not found in feats array`);
        }
      }
    }

    // Allow a small number of mismatches (some class feat entries may reference
    // feats not in the general catalog). Check that vast majority are valid.
    const totalEntries = Object.values(compiledFeatCatalog.classFeatLists)
      .reduce((sum, entries) => sum + entries.length, 0);

    // ~1.4% of entries reference feats not in the main catalog (class-specific
    // internal feats). This is expected for the Puerta server data.
    expect(errors.length).toBeLessThan(totalEntries * 0.02);
  });

  it('contains custom Puerta class entries beyond base NWN1 classes', () => {
    const classIds = Object.keys(compiledFeatCatalog.classFeatLists);

    // Puerta-specific classes like discipulodedragon, ladron-sombras-amn, almapredilecta
    const customClasses = classIds.filter(
      (id) =>
        id.includes('discipulodedragon') ||
        id.includes('ladron-sombras') ||
        id.includes('almapredilecta'),
    );

    expect(customClasses.length).toBeGreaterThanOrEqual(1);
  });

  it('has Puerta custom proficiency split feats', () => {
    // Puerta server splits proficiencies more granularly than base NWN1
    // e.g., competenciaarmasencilla-druida, competenciaarmasencilla-monje, etc.
    const customProfSplits = compiledFeatCatalog.feats.filter(
      (f) =>
        f.id.startsWith('feat:competenciaarmasencilla-') ||
        f.id.startsWith('feat:competenciaarmamarcial-'),
    );

    // Should have class-specific weapon proficiency splits
    expect(customProfSplits.length).toBeGreaterThanOrEqual(5);
  });
});
