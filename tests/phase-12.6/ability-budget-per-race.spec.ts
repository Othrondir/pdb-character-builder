import { describe, expect, it } from 'vitest';
import { calculateAbilityBudgetSnapshot } from '@rules-engine/foundation/ability-budget';

/**
 * Phase 12.6 Plan 02 — ability-budget null branch (ATTR-01 R3).
 *
 * Plan 02 owns only the null-branch assertion: when `attributeRules` is
 * null, the snapshot is blocked with `rule:point-buy-missing`. The per-race
 * differential + table-driven assertions land in Plan 06 (A1b) once the
 * Puerta-vetted curves populate `puerta-point-buy.json`.
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

  it.todo(
    'per-race deltas: Elfo vs Enano at {STR:10,DEX:14,CON:10,...} yield different remainingPoints — BLOCKED on Plan 06 A1b',
  );

  it.todo(
    'table-driven: every race in dedupeByCanonicalId(compiledRaceCatalog.races) has a snapshot entry + canonical baseline + bump delta — BLOCKED on Plan 06',
  );
});
