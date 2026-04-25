import { beforeEach, describe, it, expect } from 'vitest';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useSkillStore } from '@planner/features/skills/store';
import { useFeatStore } from '@planner/features/feats/store';
import { hydrateBuildDocument } from '@planner/features/persistence/hydrate-build-document';
import { projectBuildDocument } from '@planner/features/persistence/project-build-document';
import { sampleBuildDocument } from '../phase-08/setup';

describe('foundation store buildName slice', () => {
  beforeEach(() => {
    useCharacterFoundationStore.getState().resetFoundation();
  });

  it('A1: initial state has buildName === null', () => {
    expect(useCharacterFoundationStore.getState().buildName).toBeNull();
  });

  it('A2: setBuildName("Mi Paladín") updates store', () => {
    useCharacterFoundationStore.getState().setBuildName('Mi Paladín');
    expect(useCharacterFoundationStore.getState().buildName).toBe('Mi Paladín');
  });

  it('A3: setBuildName(null) clears the name', () => {
    useCharacterFoundationStore.getState().setBuildName('Anything');
    expect(useCharacterFoundationStore.getState().buildName).toBe('Anything');
    useCharacterFoundationStore.getState().setBuildName(null);
    expect(useCharacterFoundationStore.getState().buildName).toBeNull();
  });

  it('A4: resetFoundation() resets buildName back to null', () => {
    useCharacterFoundationStore.getState().setBuildName('Will Be Cleared');
    expect(useCharacterFoundationStore.getState().buildName).toBe('Will Be Cleared');
    useCharacterFoundationStore.getState().resetFoundation();
    expect(useCharacterFoundationStore.getState().buildName).toBeNull();
  });

  it('A5: setter accepts any string at runtime — schema bounds enforce at boundary', () => {
    // Bounding (max 80 chars) lives at the persistence boundary
    // (build-document-schema.ts: z.string().max(80).optional()), NOT inside the store.
    // The store is a neutral slice; over-length values are rejected by the schema gate
    // BEFORE reaching the setter via hydrateBuildDocument.
    const longName = 'x'.repeat(200);
    useCharacterFoundationStore.getState().setBuildName(longName);
    expect(useCharacterFoundationStore.getState().buildName).toBe(longName);
  });
});

describe('hydrate + project round-trip name', () => {
  // Mirror tests/phase-08/hydrate-build-document.spec.ts:11-16 — reset all four stores
  // so progression/skills/feats don't leak between cases (hydrate touches all of them).
  beforeEach(() => {
    useCharacterFoundationStore.getState().resetFoundation();
    useLevelProgressionStore.getState().resetProgression();
    useSkillStore.getState().resetSkillAllocations();
    useFeatStore.getState().resetFeatSelections();
  });

  it('B1: hydrate persists doc.build.name into foundation.buildName', () => {
    const base = sampleBuildDocument();
    const doc = { ...base, build: { ...base.build, name: 'Mi Paladín' } };
    hydrateBuildDocument(doc);
    expect(useCharacterFoundationStore.getState().buildName).toBe('Mi Paladín');
  });

  it('B2: hydrate clears foundation.buildName when doc.build.name is undefined', () => {
    // Pre-condition: store dirty.
    useCharacterFoundationStore.getState().setBuildName('Stale');
    expect(useCharacterFoundationStore.getState().buildName).toBe('Stale');
    // sampleBuildDocument() ships no `name` field by default (verified via setup.ts).
    const doc = sampleBuildDocument();
    hydrateBuildDocument(doc);
    expect(useCharacterFoundationStore.getState().buildName).toBeNull();
  });

  it('B3: project with no arg + store buildName set echoes name into doc.build.name', () => {
    // Hydrate a base doc to satisfy raceId/alignmentId, THEN set buildName before project.
    hydrateBuildDocument(sampleBuildDocument());
    useCharacterFoundationStore.getState().setBuildName('Mi Paladín');
    const out = projectBuildDocument();
    expect(out.build.name).toBe('Mi Paladín');
  });

  it('B4: project with no arg + store buildName null omits name from doc.build', () => {
    hydrateBuildDocument(sampleBuildDocument());
    expect(useCharacterFoundationStore.getState().buildName).toBeNull();
    const out = projectBuildDocument();
    expect(out.build.name).toBeUndefined();
    expect('name' in out.build).toBe(false);
  });

  it('B5: explicit projectBuildDocument(arg) WINS over store value', () => {
    hydrateBuildDocument(sampleBuildDocument());
    useCharacterFoundationStore.getState().setBuildName('StoreName');
    const out = projectBuildDocument('Override');
    expect(out.build.name).toBe('Override');
  });

  it('B6: projectBuildDocument(undefined) falls through to store (matches no-arg)', () => {
    hydrateBuildDocument(sampleBuildDocument());
    useCharacterFoundationStore.getState().setBuildName('FromStore');
    const out = projectBuildDocument(undefined);
    expect(out.build.name).toBe('FromStore');
  });

  it('B7: round-trip parity — hydrate(docWithName) → project() preserves name', () => {
    const base = sampleBuildDocument();
    const docWithName = { ...base, build: { ...base.build, name: 'Mi Paladín Test' } };
    hydrateBuildDocument(docWithName);
    const out = projectBuildDocument();
    expect(out.build.name).toBe(docWithName.build.name);
  });
});
