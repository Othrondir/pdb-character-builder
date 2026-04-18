import type {
  CompiledRace,
  CompiledSubrace,
} from '@data-extractor/contracts/race-catalog';

/**
 * Phase 12.1 Plan 02 — pure helper that groups a compiled race catalog into a
 * parent → { parent, subraces[] } tree. Framework-agnostic; no React, no
 * browser APIs, no mutable singleton state.
 *
 * The race picker UI (D-03) renders a parent dropdown whose selection gates a
 * subrace dropdown showing only the children of the selected parent. This
 * helper decouples that derivation from the React layer so the contract can
 * be unit-tested without a DOM and re-used by any future consumer (preview
 * panels, share-URL validators, etc.).
 *
 * Orphan handling: subraces whose `parentRaceId` is not in the race set are
 * silently dropped. The compiled-catalog Zod schema already guarantees the
 * `parentRaceId` regex shape; deeper orphan telemetry is out of scope for
 * Phase 12.1 per CONTEXT.md deferred section.
 *
 * Complexity: O(n + m) where n = races.length, m = subraces.length.
 */
export interface GroupedRaceTreeEntry {
  parent: CompiledRace;
  subraces: CompiledSubrace[];
}

export type GroupedRaceTree = Map<string, GroupedRaceTreeEntry>;

export function groupRacesByParent(
  races: readonly CompiledRace[],
  subraces: readonly CompiledSubrace[],
): GroupedRaceTree {
  const tree: GroupedRaceTree = new Map();

  for (const race of races) {
    tree.set(race.id, { parent: race, subraces: [] });
  }

  for (const subrace of subraces) {
    const entry = tree.get(subrace.parentRaceId);
    if (entry) {
      entry.subraces.push(subrace);
    }
  }

  return tree;
}
