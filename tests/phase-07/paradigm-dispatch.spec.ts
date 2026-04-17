// @vitest-environment node
import { describe, expect, it, beforeEach } from 'vitest';

import type { CanonicalId } from '@rules-engine/contracts/canonical-id';
import {
  createInitialMagicState,
  useMagicStore,
} from '@planner/features/magic/store';
import { useFeatStore } from '@planner/features/feats/store';
import { useSkillStore } from '@planner/features/skills/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { selectMagicBoardView } from '@planner/features/magic/selectors';

describe('phase 07 dispatchParadigm multiclass cleric (WR-01)', () => {
  beforeEach(() => {
    useMagicStore.setState(createInitialMagicState());
    useLevelProgressionStore.getState().resetProgression();
  });

  it('Fighter-1 / Cleric-2 routes level 2 to domains paradigm (first cleric level)', () => {
    // Seed a Fighter L1 + Cleric L2 progression. The domain picker must fire
    // at level 2 because that is the first cleric level, not level 1.
    useLevelProgressionStore.setState({
      ...useLevelProgressionStore.getState(),
      levels: useLevelProgressionStore.getState().levels.map((rec) => {
        if (rec.level === 1) return { ...rec, classId: 'class:fighter' as CanonicalId };
        if (rec.level === 2) return { ...rec, classId: 'class:cleric' as CanonicalId };
        return rec;
      }),
    });

    useMagicStore.getState().setActiveLevel(2);

    const view = selectMagicBoardView(
      useMagicStore.getState(),
      useFeatStore.getState(),
      useSkillStore.getState(),
      useLevelProgressionStore.getState(),
      useCharacterFoundationStore.getState(),
    );

    expect(view.activeSheet.paradigm).toBe('domains');
  });

  it('Cleric-1 / Cleric-2 routes level 2 to prepared-summary (not first cleric level)', () => {
    useLevelProgressionStore.setState({
      ...useLevelProgressionStore.getState(),
      levels: useLevelProgressionStore.getState().levels.map((rec) => {
        if (rec.level === 1) return { ...rec, classId: 'class:cleric' as CanonicalId };
        if (rec.level === 2) return { ...rec, classId: 'class:cleric' as CanonicalId };
        return rec;
      }),
    });

    useMagicStore.getState().setActiveLevel(2);

    const view = selectMagicBoardView(
      useMagicStore.getState(),
      useFeatStore.getState(),
      useSkillStore.getState(),
      useLevelProgressionStore.getState(),
      useCharacterFoundationStore.getState(),
    );

    // At level 2, cleric class-level is 2 (not 1), so domains picker is done.
    expect(view.activeSheet.paradigm).toBe('prepared-summary');
  });
});
