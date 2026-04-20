// @vitest-environment jsdom
import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import { cleanup, renderHook } from '@testing-library/react';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useSkillStore } from '@planner/features/skills/store';
import { useFeatStore } from '@planner/features/feats/store';
import { useResumenViewModel } from '@planner/features/summary/resumen-selectors';
import { formatDatasetLabel } from '@planner/data/ruleset-version';

describe('useResumenViewModel', () => {
  beforeEach(() => {
    useCharacterFoundationStore.getState().resetFoundation();
    useLevelProgressionStore.getState().resetProgression();
    useSkillStore.getState().resetSkillAllocations();
    useFeatStore.getState().resetFeatSelections();
  });

  afterEach(() => {
    cleanup();
  });

  it('projects identity labels from the foundation store', () => {
    const foundation = useCharacterFoundationStore.getState();
    foundation.setRace('race:human');
    foundation.setAlignment('alignment:lawful-good');

    const { result } = renderHook(() => useResumenViewModel());
    expect(result.current.identity.raceLabel).toBe('Humano');
    expect(result.current.identity.alignmentLabel).toBe('Legal bueno');
    expect(result.current.identity.datasetLabel).toBe(formatDatasetLabel());
  });

  it('emits six attribute rows in STR/DEX/CON/INT/WIS/CHA order', () => {
    const foundation = useCharacterFoundationStore.getState();
    foundation.setRace('race:human');
    foundation.setAlignment('alignment:lawful-good');

    const { result } = renderHook(() => useResumenViewModel());
    expect(result.current.attributes).toHaveLength(6);
    expect(result.current.attributes.map((a) => a.key)).toEqual([
      'str', 'dex', 'con', 'int', 'wis', 'cha',
    ]);
  });

  it('derives ability modifier as floor((total - 10) / 2)', () => {
    const foundation = useCharacterFoundationStore.getState();
    foundation.setRace('race:human');
    foundation.setAlignment('alignment:lawful-good');
    foundation.setBaseAttribute('str', 14);

    const { result } = renderHook(() => useResumenViewModel());
    const str = result.current.attributes.find((a) => a.key === 'str')!;
    expect(str.total).toBe(14);
    expect(str.modifier).toBe(2);
  });

  it('emits progression rows for all 20 levels; empty classes render null classLabel (UAT-2026-04-20 P6)', () => {
    const { result } = renderHook(() => useResumenViewModel());
    expect(result.current.progression).toHaveLength(20);
    for (const row of result.current.progression) {
      expect(row.classLabel).toBeNull();
      // Derived-stat cells MUST be null when no class chain exists — the table renders em-dash.
      expect(row.cumulativeBab).toBeNull();
      expect(row.cumulativeFort).toBeNull();
      expect(row.cumulativeRef).toBeNull();
      expect(row.cumulativeWill).toBeNull();
    }
  });

  it('computes cumulativeBab once a class is assigned at level 1', () => {
    const progression = useLevelProgressionStore.getState();
    progression.setLevelClassId(1, 'class:fighter');
    const foundation = useCharacterFoundationStore.getState();
    foundation.setRace('race:human');
    foundation.setAlignment('alignment:lawful-good');

    const { result } = renderHook(() => useResumenViewModel());
    // Fighter is high-BAB → level 1 contributes +1 BAB.
    expect(result.current.progression[0].cumulativeBab).toBe(1);
    // Levels 2..16 have no class yet, so they stay at the level-1 cumulative (1).
    expect(result.current.progression[1].cumulativeBab).toBe(1);
  });

  it('emits a skill row for every compiled skill, sorted alphabetically', () => {
    const { result } = renderHook(() => useResumenViewModel());
    expect(result.current.skills.length).toBeGreaterThan(0);
    const labels = result.current.skills.map((s) => s.skillLabel);
    const sorted = [...labels].sort((a, b) => a.localeCompare(b));
    expect(labels).toEqual(sorted);
  });
});
