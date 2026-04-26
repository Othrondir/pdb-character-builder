// Phase 16-03 — D-05 backward-compat regression spec.
//
// Locks the share-URL invariant after Plan 16-02's race-aware threading:
//
//   1. v1.0-shaped JSON builds (Elfo Guerrero L1, `featSelections[0].bonusGeneralFeatIds: []`)
//      hydrate into v1.1 stores and project back BYTE-IDENTICAL.
//   2. v1.1-shaped JSON builds (Humano Guerrero L1, `featSelections[0].bonusGeneralFeatIds`
//      populated with the race-bonus pick) round-trip with the race-bonus slot
//      hydrating into the correct store position AND project back BYTE-IDENTICAL.
//   3. `buildDocumentSchema.shape.schemaVersion.value === 2` — share-URL invariant
//      (no schemaVersion bump in Phase 16 per CONTEXT D-05).
//
// Pattern S6 (PATTERNS.md): round-trip equality via Zod parse + stringify.
//   - `buildDocumentSchema.parse(projected).toEqual(original)` — semantic drift catch.
//   - `JSON.stringify(projected) === JSON.stringify(original)` — field-ordering drift catch.
//
// `createdAt` normalisation: `projectBuildDocument()` stamps a fresh
// `new Date().toISOString()` at projection time (project-build-document.ts:108)
// so the field is inherently non-deterministic across the round-trip. The
// existing Phase 8 round-trip (`tests/phase-08/hydrate-build-document.spec.ts:52-60`)
// works around this by comparing fields individually and skipping `createdAt`.
// To preserve the BYTE-IDENTICAL intent for everything that matters (schema
// shape + field ordering + all `build.*` content) we normalise `createdAt` on
// the projected doc to match `original` BEFORE the equality checks. The schema
// shape contract is still locked (Zod parse runs against the fresh stamp first
// to prove the projection emits a valid `datetime` string).
//
// Vitest env: node (default). The Phase 8 `setup.ts` factory imports
// `'fake-indexeddb/auto'` for Dexie; we re-use that factory by importing
// `sampleBuildDocument` from `../phase-08/setup` so the polyfill is still wired in.
import { beforeEach, describe, expect, it } from 'vitest';

import type { CanonicalId } from '@rules-engine/contracts/canonical-id';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useSkillStore } from '@planner/features/skills/store';
import { useFeatStore } from '@planner/features/feats/store';
import { hydrateBuildDocument } from '@planner/features/persistence/hydrate-build-document';
import { projectBuildDocument } from '@planner/features/persistence/project-build-document';
import { buildDocumentSchema } from '@planner/features/persistence/build-document-schema';
import { sampleBuildDocument } from '../phase-08/setup';

describe('Phase 16-03 — Humano L1 round-trip (FEAT-06, D-05 invariant)', () => {
  beforeEach(() => {
    useCharacterFoundationStore.getState().resetFoundation();
    useLevelProgressionStore.getState().resetProgression();
    useSkillStore.getState().resetSkillAllocations();
    useFeatStore.getState().resetFeatSelections();
  });

  it('Elfo Guerrero L1 v1.0-shaped build (empty bonusGeneralFeatIds) round-trips byte-identical', () => {
    // Default factory shape: featSelections[0].bonusGeneralFeatIds === [].
    // No race-bonus path is exercised; this MUST stay byte-identical so that
    // legacy v1.0 saves keep loading on the v1.1 build encoder unchanged.
    const original = sampleBuildDocument({ raceId: 'race:elf' as CanonicalId });

    hydrateBuildDocument(original);
    const projected = projectBuildDocument();

    // Lock the schema-shape contract first (proves the projection emits a
    // valid datetime for `createdAt` even though the value is fresh-stamped).
    const parsed = buildDocumentSchema.parse(projected);

    // Normalise the non-deterministic `createdAt` projection stamp before
    // byte-identical comparison — see file header for rationale.
    parsed.createdAt = original.createdAt;
    projected.createdAt = original.createdAt;

    expect(parsed).toEqual(original);
    expect(JSON.stringify(projected)).toBe(JSON.stringify(original));
  });

  it('Humano Guerrero L1 v1.1-shaped build (bonusGeneralFeatIds populated) round-trips byte-identical', () => {
    // Override featSelections[0].bonusGeneralFeatIds with the race-bonus pick.
    // The Phase 8 factory accepts top-level `build.*` overrides; deep
    // featSelections override needs to mutate the returned plain object before
    // hydrate (the doc is freshly-constructed JSON, not factory state).
    const original = sampleBuildDocument({ raceId: 'race:human' as CanonicalId });
    original.build.featSelections[0].bonusGeneralFeatIds = [
      'feat:weapon-focus-longsword' as CanonicalId,
    ];

    hydrateBuildDocument(original);

    // Sanity: the race-bonus pick lands in the correct store slot
    // (Plan 16-02 selectors convention — bonusGeneralFeatIds[0] holds the
    // race-bonus pick at Humano L1; the store mutator addresses it as
    // slotIndex=1, but the store-side array index is still [0]).
    expect(
      useFeatStore.getState().levels[0].bonusGeneralFeatIds[0],
    ).toBe('feat:weapon-focus-longsword');

    const projected = projectBuildDocument();

    // Lock the schema-shape contract first (Zod parse runs against the fresh
    // `createdAt` stamp before normalisation).
    const parsed = buildDocumentSchema.parse(projected);

    // Normalise the non-deterministic `createdAt` projection stamp before
    // byte-identical comparison — see file header for rationale.
    parsed.createdAt = original.createdAt;
    projected.createdAt = original.createdAt;

    expect(parsed).toEqual(original);
    expect(JSON.stringify(projected)).toBe(JSON.stringify(original));
  });

  it('schemaVersion stays at 2 (D-05: no share-URL bump)', () => {
    // Standalone regression lock — independent of hydrate/project so this stays
    // GREEN even if a future regression breaks Tests 1/2. If THIS test ever
    // turns RED, the share-URL contract has been bumped and every previously
    // shared link is dead.
    expect(buildDocumentSchema.shape.schemaVersion.value).toBe(2);
  });
});
