import { beforeEach, describe, it, expect } from 'vitest';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useSkillStore } from '@planner/features/skills/store';
import { useFeatStore } from '@planner/features/feats/store';
import { projectBuildDocument } from '@planner/features/persistence/project-build-document';
import {
  CURRENT_DATASET_ID,
  PLANNER_VERSION,
  RULESET_VERSION,
  BUILD_ENCODING_VERSION,
} from '@planner/data/ruleset-version';

describe('projectBuildDocument', () => {
  beforeEach(() => {
    useCharacterFoundationStore.getState().resetFoundation();
    useLevelProgressionStore.getState().resetProgression();
    useSkillStore.getState().resetSkillAllocations();
    useFeatStore.getState().resetFeatSelections();
  });

  it('produces a document with the current version header', () => {
    const foundation = useCharacterFoundationStore.getState();
    foundation.setRace('race:human');
    foundation.setAlignment('alignment:lawful-good');

    const doc = projectBuildDocument();

    expect(doc.schemaVersion).toBe(BUILD_ENCODING_VERSION);
    expect(doc.plannerVersion).toBe(PLANNER_VERSION);
    expect(doc.rulesetVersion).toBe(RULESET_VERSION);
    expect(doc.datasetId).toBe(CURRENT_DATASET_ID);
    expect(doc.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('projects identity fields from the foundation store', () => {
    const foundation = useCharacterFoundationStore.getState();
    foundation.setRace('race:elf');
    foundation.setSubrace('subrace:moon-elf');
    foundation.setAlignment('alignment:neutral-good');

    const doc = projectBuildDocument();

    expect(doc.build.raceId).toBe('race:elf');
    expect(doc.build.subraceId).toBe('subrace:moon-elf');
    expect(doc.build.alignmentId).toBe('alignment:neutral-good');
    expect(doc.build.deityId).toBeNull();
  });

  it('projects 16-entry levels/skills/feats arrays', () => {
    const foundation = useCharacterFoundationStore.getState();
    foundation.setRace('race:human');
    foundation.setAlignment('alignment:lawful-good');

    const doc = projectBuildDocument();

    expect(doc.build.levels).toHaveLength(16);
    expect(doc.build.skillAllocations).toHaveLength(16);
    expect(doc.build.featSelections).toHaveLength(16);
  });

  it('stamps the supplied name into build.name', () => {
    const foundation = useCharacterFoundationStore.getState();
    foundation.setRace('race:human');
    foundation.setAlignment('alignment:lawful-good');

    const doc = projectBuildDocument('mi paladin tier-1');

    expect(doc.build.name).toBe('mi paladin tier-1');
  });

  it('omits build.name when no name is supplied', () => {
    const foundation = useCharacterFoundationStore.getState();
    foundation.setRace('race:human');
    foundation.setAlignment('alignment:lawful-good');

    const doc = projectBuildDocument();

    expect(doc.build).not.toHaveProperty('name');
  });
});
