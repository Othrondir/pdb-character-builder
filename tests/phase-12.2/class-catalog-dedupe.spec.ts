import { describe, expect, it } from 'vitest';

import { compiledClassCatalog } from '@planner/data/compiled-classes';
import {
  getPhase04ClassRecord,
  phase04ClassFixture,
} from '@planner/features/level-progression/class-fixture';

/**
 * The extractor still emits duplicate raw IDs for Arcano/Divino prestige
 * variants. The planner projection must expose them as separate selectable rows
 * instead of first-wins dropping the Divino row.
 */

describe('Phase 12.2-04 — class-fixture prestige variant projection', () => {
  it('every projected class id is unique (no React duplicate-key hazard)', () => {
    const ids = phase04ClassFixture.classes.map((c) => c.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('projects Agente Custodio Arcano and Divino as separate rows', () => {
    expect(getPhase04ClassRecord('class:harper-arcane')).toMatchObject({
      id: 'class:harper-arcane',
      label: 'Agente Custodio (Arcano)',
    });
    expect(getPhase04ClassRecord('class:harper-divine')).toMatchObject({
      id: 'class:harper-divine',
      label: 'Agente Custodio (Divino)',
    });
  });

  it('projects Adepto Sombrio Arcano and Divino as separate rows', () => {
    expect(getPhase04ClassRecord('class:shadowadept-arcane')).toMatchObject({
      id: 'class:shadowadept-arcane',
      label: 'Adepto Sombrio (Arcano)',
    });
    expect(getPhase04ClassRecord('class:shadowadept-divine')).toMatchObject({
      id: 'class:shadowadept-divine',
      label: 'Adepto Sombrio (Divino)',
    });
  });

  it('keeps legacy collapsed IDs readable as Arcano for older saved builds', () => {
    expect(getPhase04ClassRecord('class:harper')?.id).toBe('class:harper-arcane');
    expect(getPhase04ClassRecord('class:shadowadept')?.id).toBe(
      'class:shadowadept-arcane',
    );
  });

  it('does not lose raw extractor rows while making projected ids unique', () => {
    expect(phase04ClassFixture.classes).toHaveLength(
      compiledClassCatalog.classes.length,
    );
  });
});
