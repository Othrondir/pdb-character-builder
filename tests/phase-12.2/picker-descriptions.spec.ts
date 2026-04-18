import { describe, expect, it } from 'vitest';

import { compiledClassCatalog } from '@planner/data/compiled-classes';
import { compiledRaceCatalog } from '@planner/data/compiled-races';
import { phase03FoundationFixture } from '@planner/features/character-foundation/foundation-fixture';
import { phase04ClassFixture } from '@planner/features/level-progression/class-fixture';

/**
 * Phase 12.2 Plan 01 regression — TLK descriptions must flow from the compiled
 * extractor catalogs (compiled-races.ts / compiled-classes.ts) through the
 * projection adapters (projectCompiledRace / projectCompiledClass) to the
 * FoundationRaceOption.description / PlannerClassRecord.description surface
 * consumed by the race + class picker DetailPanel bodies.
 *
 * Phase 12.1 UAT Bug 1 surfaced that picker detail panes show only label
 * echoes ("${label} seleccionado." / "Clase seleccionada: ${label}") — the
 * TLK prose already lives in compiledRaceCatalog.races[].description and
 * compiledClassCatalog.classes[].description but the projection adapters
 * dropped it. This spec locks the wiring contract so a future adapter refactor
 * cannot silently regress.
 *
 * Canary IDs follow the 12.1-02 race-roster pattern: skip-with-note if a
 * canary is absent from the compiled catalog so an extractor re-emission
 * that drops a canary does not masquerade as a wiring regression.
 */

describe('Phase 12.2-01 — picker descriptions wired through projection adapters', () => {
  const raceCanaries = ['race:dwarf', 'race:elf', 'race:human'] as const;
  const classCanaries = ['class:fighter', 'class:cleric', 'class:wizard'] as const;

  describe('FoundationRaceOption.description', () => {
    it.each(raceCanaries)(
      '%s carries a non-empty description distinct from its label',
      (id) => {
        const compiled = compiledRaceCatalog.races.find((r) => r.id === id);
        if (!compiled) {
          // Skip-with-note: canary absent from compiled catalog
          expect
            .soft(compiled, `canary ${id} not present in compiled race catalog`)
            .toBeDefined();
          return;
        }
        const projected = phase03FoundationFixture.races.find((r) => r.id === id);
        expect(projected).toBeDefined();
        expect(projected!.description).toBeTypeOf('string');
        expect(projected!.description.length).toBeGreaterThan(0);
        expect(projected!.description).not.toBe(projected!.label);
      },
    );

    it('every projected race carries a non-empty description', () => {
      for (const race of phase03FoundationFixture.races) {
        expect(
          race.description.length,
          `race ${race.id} missing description`,
        ).toBeGreaterThan(0);
      }
    });
  });

  describe('PlannerClassRecord.description', () => {
    it.each(classCanaries)(
      '%s carries a non-empty description distinct from its label',
      (id) => {
        const compiled = compiledClassCatalog.classes.find((c) => c.id === id);
        if (!compiled) {
          expect
            .soft(compiled, `canary ${id} not present in compiled class catalog`)
            .toBeDefined();
          return;
        }
        const projected = phase04ClassFixture.classes.find((c) => c.id === id);
        expect(projected).toBeDefined();
        expect(projected!.description).toBeTypeOf('string');
        expect(projected!.description.length).toBeGreaterThan(0);
        expect(projected!.description).not.toBe(projected!.label);
      },
    );

    it('every projected class carries a non-empty description', () => {
      for (const entry of phase04ClassFixture.classes) {
        expect(
          entry.description.length,
          `class ${entry.id} missing description`,
        ).toBeGreaterThan(0);
      }
    });
  });
});
