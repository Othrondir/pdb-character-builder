import { describe, expect, it, beforeEach } from 'vitest';
import { compiledFeatCatalog } from '@planner/data/compiled-feats';
import {
  createEmptyFeatLevels,
  createInitialFeatState,
  useFeatStore,
} from '@planner/features/feats/store';

describe('phase 06 feat store', () => {
  beforeEach(() => {
    useFeatStore.setState(createInitialFeatState());
  });

  it('createEmptyFeatLevels returns 20 records with null feat IDs (UAT-2026-04-20 P6)', () => {
    const levels = createEmptyFeatLevels();

    expect(levels).toHaveLength(20);

    for (const level of levels) {
      expect(level.classFeatId).toBeNull();
      expect(level.generalFeatId).toBeNull();
    }
  });

  it('createInitialFeatState has activeLevel=1 and matching datasetId', () => {
    const state = createInitialFeatState();

    expect(state.activeLevel).toBe(1);
    expect(state.datasetId).toBe(compiledFeatCatalog.datasetId);
    expect(state.lastEditedLevel).toBeNull();
    expect(state.levels).toHaveLength(20);
  });

  it('setClassFeat sets classFeatId on the target level only', () => {
    useFeatStore.getState().setClassFeat(3, 'feat:ataquepoderoso');

    const state = useFeatStore.getState();
    const level3 = state.levels.find((r) => r.level === 3);
    const level1 = state.levels.find((r) => r.level === 1);

    expect(level3?.classFeatId).toBe('feat:ataquepoderoso');
    expect(level3?.generalFeatId).toBeNull();
    expect(level1?.classFeatId).toBeNull();
    expect(state.lastEditedLevel).toBe(3);
  });

  it('setGeneralFeat sets generalFeatId on the target level only', () => {
    useFeatStore.getState().setGeneralFeat(1, 'feat:alertness');

    const state = useFeatStore.getState();
    const level1 = state.levels.find((r) => r.level === 1);

    expect(level1?.generalFeatId).toBe('feat:alertness');
    expect(level1?.classFeatId).toBeNull();
    expect(state.lastEditedLevel).toBe(1);
  });

  it('clearClassFeat resets classFeatId to null', () => {
    useFeatStore.getState().setClassFeat(3, 'feat:ataquepoderoso');
    useFeatStore.getState().clearClassFeat(3);

    const level3 = useFeatStore.getState().levels.find((r) => r.level === 3);

    expect(level3?.classFeatId).toBeNull();
  });

  it('clearGeneralFeat resets generalFeatId to null', () => {
    useFeatStore.getState().setGeneralFeat(1, 'feat:alertness');
    useFeatStore.getState().clearGeneralFeat(1);

    const level1 = useFeatStore.getState().levels.find((r) => r.level === 1);

    expect(level1?.generalFeatId).toBeNull();
  });

  it('resetLevel clears both classFeatId and generalFeatId for that level', () => {
    useFeatStore.getState().setClassFeat(3, 'feat:ataquepoderoso');
    useFeatStore.getState().setGeneralFeat(3, 'feat:alertness');
    useFeatStore.getState().resetLevel(3);

    const level3 = useFeatStore.getState().levels.find((r) => r.level === 3);

    expect(level3?.classFeatId).toBeNull();
    expect(level3?.generalFeatId).toBeNull();
  });

  it('resetFeatSelections restores all levels to initial state', () => {
    useFeatStore.getState().setClassFeat(3, 'feat:ataquepoderoso');
    useFeatStore.getState().setGeneralFeat(1, 'feat:alertness');
    useFeatStore.getState().setActiveLevel(5);
    useFeatStore.getState().resetFeatSelections();

    const state = useFeatStore.getState();

    expect(state.activeLevel).toBe(1);
    expect(state.lastEditedLevel).toBeNull();

    for (const level of state.levels) {
      expect(level.classFeatId).toBeNull();
      expect(level.generalFeatId).toBeNull();
    }
  });

  it('setActiveLevel updates only the active level', () => {
    useFeatStore.getState().setActiveLevel(7);

    expect(useFeatStore.getState().activeLevel).toBe(7);
  });
});
