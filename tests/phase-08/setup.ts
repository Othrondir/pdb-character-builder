// Phase 08 shared test setup.
// - fake-indexeddb/auto installs the polyfill globally so Dexie can run under jsdom/node.
// - sampleBuildDocument() returns a minimal-but-valid BuildDocument fixture (1 class,
//   20 empty levels). Overrides merge into build.* keys.
import 'fake-indexeddb/auto';
import type { BuildDocument } from '@planner/features/persistence/build-document-schema';
import {
  PLANNER_VERSION,
  RULESET_VERSION,
  BUILD_ENCODING_VERSION,
  CURRENT_DATASET_ID,
} from '@planner/data/ruleset-version';

// UAT-2026-04-20 P6 — level range extended to 1..20.
type LevelTuple =
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20;

export function sampleBuildDocument(
  overrides: Partial<BuildDocument['build']> = {},
): BuildDocument {
  const levels = Array.from({ length: 20 }, (_, i) => ({
    level: (i + 1) as LevelTuple,
    classId: (i === 0 ? 'class:fighter' : null) as `class:${string}` | null,
    abilityIncrease: null as 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha' | null,
  }));
  const skillAllocations = Array.from({ length: 20 }, (_, i) => ({
    level: (i + 1) as LevelTuple,
    allocations: [] as { skillId: `skill:${string}`; rank: number }[],
  }));
  const featSelections = Array.from({ length: 20 }, (_, i) => ({
    level: (i + 1) as LevelTuple,
    classFeatId: null as `feat:${string}` | null,
    generalFeatId: null as `feat:${string}` | null,
  }));
  return {
    schemaVersion: BUILD_ENCODING_VERSION as 1,
    plannerVersion: PLANNER_VERSION,
    rulesetVersion: RULESET_VERSION,
    datasetId: CURRENT_DATASET_ID,
    createdAt: new Date('2026-04-17T00:00:00.000Z').toISOString(),
    build: {
      raceId: 'race:human',
      subraceId: null,
      alignmentId: 'alignment:lawful-good',
      deityId: null,
      baseAttributes: { str: 14, dex: 12, con: 14, int: 10, wis: 10, cha: 10 },
      levels,
      skillAllocations,
      featSelections,
      ...overrides,
    },
  } as BuildDocument;
}
