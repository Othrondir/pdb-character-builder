import { describe, expect, it } from 'vitest';
import { selectAbilityBudgetRulesForRace } from '@planner/features/character-foundation/selectors';
import {
  NWN1_POINT_BUY_COST_TABLE,
} from '@rules-engine/foundation/ability-budget';
import { compiledRaceCatalog } from '@planner/data/compiled-races';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';

/**
 * Phase 17 (ATTR-02 SC#4 — D-03 reframe).
 *
 * Original SC#4: "specs cover ≥3 races with distinct curves."
 * Reframed (D-03): schema-shape coverage — ≥3 dedupe-canonical races resolve
 * to non-null AbilityBudgetRules via the selector, AND ≥1 case demonstrates
 * the null fail-closed branch (synthetic or naturally-null).
 *
 * "Distinct curves" literal dropped: per Phase 12.6 evidence, the truthful
 * client-side dataset is sourced-uniform (racialtypes.2da AbilitiesPointBuyNumber=30
 * + NWN1 hardcoded engine cost step). Coverage spec asserts pipeline
 * correctness, not value variance. Future server-script overrides re-open
 * this via tests/phase-12.6 spec's it.todo (preserved by D-04 atomic
 * migration in Plan 17-03).
 */
describe('Phase 17 — SC#4 reframe: per-race point-buy pipeline coverage', () => {
  it('≥3 races resolve to non-null AbilityBudgetRules via selectAbilityBudgetRulesForRace', () => {
    const sampleRaceIds: CanonicalId[] = [
      'race:human',
      'race:elf',
      'race:dwarf',
    ] as CanonicalId[];
    for (const raceId of sampleRaceIds) {
      const rules = selectAbilityBudgetRulesForRace(raceId);
      expect(rules).not.toBeNull();
      expect(rules!.budget).toBeGreaterThan(0);
      expect(rules!.minimum).toBe(NWN1_POINT_BUY_COST_TABLE.minimum);
      expect(rules!.maximum).toBe(NWN1_POINT_BUY_COST_TABLE.maximum);
      expect(rules!.costByScore).toEqual(NWN1_POINT_BUY_COST_TABLE.costByScore);
    }
  });

  it('selector returns null for unknown raceId (fail-closed: race not in catalog)', () => {
    expect(
      selectAbilityBudgetRulesForRace('race:does-not-exist' as CanonicalId),
    ).toBeNull();
  });

  it('selector returns null for null raceId (fail-closed: no race selected)', () => {
    expect(selectAbilityBudgetRulesForRace(null)).toBeNull();
  });

  it('every race in compiledRaceCatalog produces a non-null selector result (coverage migrated from deleted snapshot-coverage spec)', () => {
    // Replaces the legacy snapshot-coverage spec (deleted in Plan 17-03)
    // — same coverage invariant, new source-of-truth.
    const uniqueIds = [
      ...new Set(compiledRaceCatalog.races.map((r) => r.id)),
    ] as CanonicalId[];
    for (const id of uniqueIds) {
      expect(selectAbilityBudgetRulesForRace(id)).not.toBeNull();
    }
  });
});
