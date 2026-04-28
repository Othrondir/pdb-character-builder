import { describe, expect, it } from 'vitest';
import { calculateAbilityBudgetSnapshot } from '@rules-engine/foundation/ability-budget';
import { selectAbilityBudgetRulesForRace } from '@planner/features/character-foundation/selectors';
import { compiledRaceCatalog } from '@planner/data/compiled-races';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';

/**
 * Phase 12.6 — ability-budget per-race assertions.
 *
 * This spec owns THREE contracts:
 *
 * 1. Null-branch fail-closed (Plan 02, SPEC R3) — preserved here verbatim.
 * 2. Table-driven per-race baseline + bump-delta (Plan 06, SPEC R4) —
 *    asserts every race in `dedupeByCanonicalId(compiledRaceCatalog.races)`
 *    resolves to a non-null `AbilityBudgetRules` via the rewired selector
 *    AND that a canonical baseline {8,8,8,8,8,8} yields
 *    remainingPoints === budget AND that bumping DEX 8→14 spends exactly
 *    `costByScore['14']-costByScore['8']` points.
 * 3. Genuine per-race variance note (Plan 06 CRITICAL variance-gate
 *    override) — the client-side racialtypes.2da exposes uniform
 *    `AbilitiesPointBuyNumber=30` and the NWN1 cost curve is hardcoded
 *    engine behavior. Therefore "different races produce different
 *    remainingPoints on identical base" is NOT currently achievable with
 *    truthful sourced data. This is documented as `it.todo` with a
 *    future-work pin; it is NOT a silent scope reduction.
 *
 * Phase 17 D-04 migration: this spec previously imported
 * `PUERTA_POINT_BUY_SNAPSHOT` from the now-retired snapshot module and
 * looked up curves via `PUERTA_POINT_BUY_SNAPSHOT[raceId]`. Post-Phase-17
 * the source-of-truth is `selectAbilityBudgetRulesForRace(raceId)` which
 * reads `compiledRaceCatalog` and composes the rules via
 * `deriveAbilityBudgetRules(race, NWN1_POINT_BUY_COST_TABLE)`. Behavior
 * pinned by this spec is unchanged — only the data source moved.
 */
describe('Phase 12.6 — ability-budget null branch (SPEC R3, Plan 02)', () => {
  it('null attributeRules → status blocked + issues contain rule:point-buy-missing', () => {
    const snapshot = calculateAbilityBudgetSnapshot({
      attributeRules: null,
      baseAttributes: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      originReady: true,
    });

    expect(snapshot.status).toBe('blocked');
    expect(snapshot.remainingPoints).toBe(0);
    expect(snapshot.spentPoints).toBe(0);

    const affectedIds = snapshot.issues.flatMap((issue) => issue.affectedIds);
    expect(affectedIds).toContain('rule:point-buy-missing');
  });

  it('null attributeRules → null branch returns even when originReady=false (single blocking issue dominates)', () => {
    // Defensive: the null branch short-circuits BEFORE the originReady check,
    // so the sole issue reported is rule:point-buy-missing. This keeps the UI
    // from enumerating overlapping block reasons during fail-closed states.
    const snapshot = calculateAbilityBudgetSnapshot({
      attributeRules: null,
      baseAttributes: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      originReady: false,
    });

    expect(snapshot.status).toBe('blocked');
    const affectedIds = snapshot.issues.flatMap((issue) => issue.affectedIds);
    expect(affectedIds).toContain('rule:point-buy-missing');
    // Null branch emits exactly one issue — origin-incomplete is not surfaced.
    expect(snapshot.issues).toHaveLength(1);
  });

  it('issue for null branch carries blockKind missing-source (VALI-04 discriminant)', () => {
    const snapshot = calculateAbilityBudgetSnapshot({
      attributeRules: null,
      baseAttributes: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
      originReady: true,
    });
    const pointBuyIssue = snapshot.issues.find((i) =>
      i.affectedIds.includes('rule:point-buy-missing'),
    );
    expect(pointBuyIssue).toBeDefined();
    expect(pointBuyIssue?.status).toBe('blocked');
    if (pointBuyIssue?.status === 'blocked') {
      expect(pointBuyIssue.blockKind).toBe('missing-source');
    }
  });
});

const BASELINE_ATTRS = { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };

// The extractor schema types `.id` as `string` (regex-validated at parse
// time), but rules-engine contracts treat race IDs as branded `CanonicalId`.
// Cast at the dedupe boundary so `describe.each` and the selector lookup
// are well-typed for the post-Phase-17 catalog-sourced pipeline.
const uniqueRaces = [
  ...new Set(compiledRaceCatalog.races.map((r) => r.id)),
] as CanonicalId[];

describe.each(uniqueRaces)(
  'Phase 12.6 — per-race ability budget — %s (SPEC R4, Plan 06; Phase 17 D-04 migrated source)',
  (raceId: CanonicalId) => {
    it('selector returns non-null AbilityBudgetRules for every unique race ID', () => {
      expect(selectAbilityBudgetRulesForRace(raceId)).not.toBeNull();
    });

    it('baseline {8,8,8,8,8,8} → remainingPoints === budget, spent === 0, status legal', () => {
      const rules = selectAbilityBudgetRulesForRace(raceId);
      expect(rules).not.toBeNull();
      const snapshot = calculateAbilityBudgetSnapshot({
        attributeRules: rules,
        baseAttributes: BASELINE_ATTRS,
        originReady: true,
      });
      expect(snapshot.remainingPoints).toBe(rules!.budget);
      expect(snapshot.spentPoints).toBe(0);
      expect(snapshot.status).toBe('legal');
    });

    it('bump DEX 8→14 → spentPoints === costByScore[14]-costByScore[8] and remainingPoints === budget - spent', () => {
      const rules = selectAbilityBudgetRulesForRace(raceId);
      expect(rules).not.toBeNull();
      const base = { ...BASELINE_ATTRS, dex: 14 };
      const snapshot = calculateAbilityBudgetSnapshot({
        attributeRules: rules,
        baseAttributes: base,
        originReady: true,
      });
      const expectedSpent = rules!.costByScore['14'] - rules!.costByScore['8'];
      expect(snapshot.spentPoints).toBe(expectedSpent);
      expect(snapshot.remainingPoints).toBe(rules!.budget - expectedSpent);
    });
  },
);

describe('Phase 12.6 — per-race variance note (SPEC R2+R4, Plan 06 variance-gate override; Phase 17 D-04 migrated source)', () => {
  it('Elfo and Enano at identical baseAttributes currently produce identical remainingPoints because sourced curve is uniform (racialtypes.2da AbilitiesPointBuyNumber=30 + NWN1 hardcoded cost step)', () => {
    // Plan 06 CRITICAL variance-gate override (Option 1): document
    // sourced-uniformity explicitly. The original plan expected ≥2 distinct
    // curve shapes; the client-extracted 2DA from Phase 05.1 shows uniform
    // AbilitiesPointBuyNumber=30 and NWN1's cost curve is engine-hardcoded,
    // so uniformity IS the truthful state. Phase 17 migrated this source
    // from PUERTA_POINT_BUY_SNAPSHOT dict to the selector pipeline; the
    // sourced-uniformity finding survives the migration verbatim.
    const elfRules = selectAbilityBudgetRulesForRace('race:elf' as CanonicalId);
    const dwarfRules = selectAbilityBudgetRulesForRace('race:dwarf' as CanonicalId);
    expect(elfRules).not.toBeNull();
    expect(dwarfRules).not.toBeNull();
    const base = { str: 10, dex: 14, con: 10, int: 10, wis: 10, cha: 10 };
    const elfSnap = calculateAbilityBudgetSnapshot({
      attributeRules: elfRules,
      baseAttributes: base,
      originReady: true,
    });
    const dwarfSnap = calculateAbilityBudgetSnapshot({
      attributeRules: dwarfRules,
      baseAttributes: base,
      originReady: true,
    });
    expect(elfSnap.remainingPoints).toBe(dwarfSnap.remainingPoints);
    expect(elfSnap.spentPoints).toBe(dwarfSnap.spentPoints);
    expect(elfRules!.budget).toBe(dwarfRules!.budget);
  });

  it.todo(
    'per-race deltas: Elfo vs Enano produce different remainingPoints — BLOCKED on server-script override evidence (racialtypes.2da client extraction shows uniform AbilitiesPointBuyNumber=30; NWN1 cost curve is engine-hardcoded; future Phase that captures server-side overrides can reopen this)',
  );
});
