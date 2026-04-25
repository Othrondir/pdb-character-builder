import { beforeEach, describe, it, expect } from 'vitest';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';

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
