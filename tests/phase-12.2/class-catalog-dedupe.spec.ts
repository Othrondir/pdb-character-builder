import { describe, expect, it } from 'vitest';

import { compiledClassCatalog } from '@planner/data/compiled-classes';
import { phase04ClassFixture } from '@planner/features/level-progression/class-fixture';

/**
 * Phase 12.2-04 (D-05) — fixture-level first-wins dedupe contract for the
 * compiled class projection.
 *
 * The compiled class catalog emitted by the extractor on 2026-04-17 contains
 * duplicate canonical IDs for prestige variants that collapse to the same
 * slug:
 *   - `class:harper` at sourceRow 28 (Agente Custodio Arcano) + 54 (Divino).
 *   - `class:shadowadept` at sourceRow 46 (Adepto Sombrio Arcano) + 55 (Divino).
 *
 * React renders these twice and emits duplicate-key warnings in the L1
 * picker. This spec mirrors the race-fixture dedupe contract from 12.1-02
 * (tests/phase-12.1/race-roster-wiring.spec.ts), asserting the projection
 * boundary drops duplicates first-wins before `selectClassOptionsForLevel`
 * ever sees them.
 *
 * Count-based floor assertions use `new Set(...).size` so a future extractor
 * re-emission that fixes upstream IDs cannot silently regress the contract.
 */

describe('Phase 12.2-04 — class-fixture first-wins dedupe', () => {
  it('every projected class id is unique (no React duplicate-key hazard)', () => {
    const ids = phase04ClassFixture.classes.map((c) => c.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('class:harper appears exactly once in the projected fixture', () => {
    const count = phase04ClassFixture.classes.filter(
      (c) => c.id === 'class:harper',
    ).length;
    const compiledCount = compiledClassCatalog.classes.filter(
      (c) => c.id === 'class:harper',
    ).length;
    if (compiledCount < 2) {
      // If the extractor ever fixes the upstream emission, this test becomes
      // a trivial pass — we assert the projection preserves compiled count.
      expect(count).toBe(compiledCount);
      return;
    }
    expect(count).toBe(1);
  });

  it('class:shadowadept appears exactly once in the projected fixture', () => {
    const count = phase04ClassFixture.classes.filter(
      (c) => c.id === 'class:shadowadept',
    ).length;
    const compiledCount = compiledClassCatalog.classes.filter(
      (c) => c.id === 'class:shadowadept',
    ).length;
    if (compiledCount < 2) {
      expect(count).toBe(compiledCount);
      return;
    }
    expect(count).toBe(1);
  });

  it('fixture length equals unique-id count in the compiled catalog (UNIQUE floor)', () => {
    const uniqueCompiled = new Set(
      compiledClassCatalog.classes.map((c) => c.id),
    );
    expect(phase04ClassFixture.classes.length).toBe(uniqueCompiled.size);
  });

  it('first-wins: surviving class:harper description matches the first compiled occurrence', () => {
    const compiledHarpers = compiledClassCatalog.classes.filter(
      (c) => c.id === 'class:harper',
    );
    if (compiledHarpers.length < 2) return; // no duplicates, nothing to check
    const first = compiledHarpers[0];
    const surviving = phase04ClassFixture.classes.find(
      (c) => c.id === 'class:harper',
    );
    expect(surviving).toBeDefined();
    expect(surviving!.description).toBe(first.description);
  });
});
