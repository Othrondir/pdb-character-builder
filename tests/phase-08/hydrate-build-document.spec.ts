import { beforeEach, describe, it, expect } from 'vitest';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useSkillStore } from '@planner/features/skills/store';
import { useFeatStore } from '@planner/features/feats/store';
import { hydrateBuildDocument } from '@planner/features/persistence/hydrate-build-document';
import { projectBuildDocument } from '@planner/features/persistence/project-build-document';
import { sampleBuildDocument } from './setup';

describe('hydrateBuildDocument', () => {
  beforeEach(() => {
    useCharacterFoundationStore.getState().resetFoundation();
    useLevelProgressionStore.getState().resetProgression();
    useSkillStore.getState().resetSkillAllocations();
    useFeatStore.getState().resetFeatSelections();
  });

  it('sets foundation fields from the doc', () => {
    hydrateBuildDocument(sampleBuildDocument());

    const foundation = useCharacterFoundationStore.getState();
    expect(foundation.raceId).toBe('race:human');
    expect(foundation.alignmentId).toBe('alignment:lawful-good');
    expect(foundation.baseAttributes.str).toBe(14);
  });

  it('sets level 1 classId when present', () => {
    hydrateBuildDocument(sampleBuildDocument());

    const progression = useLevelProgressionStore.getState();
    expect(progression.levels[0].classId).toBe('class:fighter');
    // Levels 2..16 stay null.
    expect(progression.levels[1].classId).toBeNull();
  });

  it('leaves skills/feats empty when the doc has none', () => {
    hydrateBuildDocument(sampleBuildDocument());

    const skills = useSkillStore.getState();
    const feats = useFeatStore.getState();
    expect(skills.levels.every((l) => l.allocations.length === 0)).toBe(true);
    expect(
      feats.levels.every(
        (l) =>
          l.classFeatId === null &&
          l.generalFeatId === null &&
          l.bonusGeneralFeatIds.length === 0,
      ),
    ).toBe(true);
  });

  it('round-trips: hydrate -> project preserves identity and structure (ignoring timestamps and name)', () => {
    const original = sampleBuildDocument();
    hydrateBuildDocument(original);
    const projected = projectBuildDocument();

    // Version header survives.
    expect(projected.schemaVersion).toBe(original.schemaVersion);
    expect(projected.plannerVersion).toBe(original.plannerVersion);
    expect(projected.rulesetVersion).toBe(original.rulesetVersion);
    expect(projected.datasetId).toBe(original.datasetId);

    // Identity survives.
    expect(projected.build.raceId).toBe(original.build.raceId);
    expect(projected.build.alignmentId).toBe(original.build.alignmentId);
    expect(projected.build.baseAttributes).toEqual(original.build.baseAttributes);

    // Structure survives.
    expect(projected.build.levels).toEqual(original.build.levels);
    expect(projected.build.skillAllocations).toEqual(original.build.skillAllocations);
    expect(projected.build.featSelections).toEqual(original.build.featSelections);
  });
});
