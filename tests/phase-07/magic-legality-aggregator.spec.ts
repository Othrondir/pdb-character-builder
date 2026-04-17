import { describe, expect, it } from 'vitest';
import { aggregateMagicLegality } from '@rules-engine/magic/magic-legality-aggregator';
import type { MagicLevelInput } from '@rules-engine/magic/magic-revalidation';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';
import { compiledSpellCatalog } from '@planner/data/compiled-spells';
import { compiledDomainCatalog } from '@planner/data/compiled-domains';
import type { BuildStateAtLevel } from '@rules-engine/feats/feat-prerequisite';

function emptyBuildState(
  characterLevel: number,
  classLevels: Record<string, number> = {},
  casterLevelByClass: Record<string, number> = {},
): BuildStateAtLevel {
  return {
    abilityScores: { str: 10, dex: 10, con: 10, int: 14, wis: 10, cha: 10 },
    bab: 0,
    characterLevel,
    classLevels,
    fortitudeSave: 0,
    selectedFeatIds: new Set<string>(),
    skillRanks: {},
    casterLevelByClass,
  };
}

function emptyLevelInput(
  level: number,
  bs: BuildStateAtLevel,
  classId: CanonicalId | null = null,
): MagicLevelInput {
  return {
    level,
    buildState: bs,
    classId,
    domainsSelected: [],
    spellbookAdditions: {},
    knownSpells: {},
    swapsApplied: [],
  };
}

describe('aggregateMagicLegality', () => {
  it('returns pending when every level is empty + non-caster', () => {
    const levels = [1, 2, 3, 4].map((lvl) =>
      emptyLevelInput(lvl, emptyBuildState(lvl)),
    );
    const result = aggregateMagicLegality({
      levels,
      spellCatalog: compiledSpellCatalog,
      domainCatalog: compiledDomainCatalog,
    });
    expect(result.status).toBe('pending');
    expect(result.illegalCount).toBe(0);
    expect(result.repairCount).toBe(0);
    expect(result.perLevel).toHaveLength(4);
  });

  it('returns legal or pending for an empty-selection caster build', () => {
    const levels: MagicLevelInput[] = [
      emptyLevelInput(
        1,
        emptyBuildState(1, { 'class:cleric': 1 }, { 'class:cleric': 1 }),
      ),
    ];
    const result = aggregateMagicLegality({
      levels,
      spellCatalog: compiledSpellCatalog,
      domainCatalog: compiledDomainCatalog,
    });
    expect(['legal', 'pending']).toContain(result.status);
  });

  it('rolls a mixed pending+legal build up to pending (not legal)', () => {
    // Level 1: empty fighter (no caster, no selections) -> status 'pending'
    //   (revalidation returns pending when !hasAnySelection && !hasCaster)
    // Level 2: empty cleric at class level 1 (caster, no selections) -> status 'legal'
    //   (revalidation returns legal when no illegal/blocked issues and hasCaster)
    // Aggregator must pick the MORE severe: pending (2) < legal (3), so result = 'pending'.
    const levels: MagicLevelInput[] = [
      emptyLevelInput(1, emptyBuildState(1)),
      emptyLevelInput(
        2,
        emptyBuildState(2, { 'class:cleric': 1 }, { 'class:cleric': 1 }),
      ),
    ];
    const result = aggregateMagicLegality({
      levels,
      spellCatalog: compiledSpellCatalog,
      domainCatalog: compiledDomainCatalog,
    });
    // This assertion FAILS under the pre-fix STATUS_ORDER (legal=2, pending=3),
    // because legal would be treated as more severe than pending — locking the
    // CR-02 fix in place.
    expect(result.status).toBe('pending');
  });

  it('rolls an illegal selection up to overall status illegal', () => {
    const wizardSpell = compiledSpellCatalog.spells.find(
      (s) => s.classLevels['class:wizard'] != null,
    );
    expect(wizardSpell).toBeTruthy();
    const levels: MagicLevelInput[] = [
      {
        level: 1,
        buildState: emptyBuildState(
          1,
          { 'class:cleric': 1 },
          { 'class:cleric': 1 },
        ),
        classId: null,
        domainsSelected: [],
        spellbookAdditions: { 1: [wizardSpell!.id] },
        knownSpells: {},
        swapsApplied: [],
      },
    ];
    const result = aggregateMagicLegality({
      levels,
      spellCatalog: compiledSpellCatalog,
      domainCatalog: compiledDomainCatalog,
    });
    expect(result.status).toBe('illegal');
    expect(result.illegalCount).toBe(1);
    expect(result.illegalLevels).toContain(1);
  });

  it('cascades illegal at level 3 to blocked at later levels', () => {
    const wizardSpell = compiledSpellCatalog.spells.find(
      (s) => s.classLevels['class:wizard'] != null,
    );
    const levels: MagicLevelInput[] = [];
    for (let lvl = 1; lvl <= 5; lvl++) {
      const bs = emptyBuildState(
        lvl,
        { 'class:cleric': lvl },
        { 'class:cleric': lvl },
      );
      levels.push({
        level: lvl,
        buildState: bs,
        classId: null,
        domainsSelected: [],
        spellbookAdditions:
          lvl === 3
            ? { 1: [wizardSpell!.id] }
            : lvl === 5
              ? { 0: [wizardSpell!.id] }
              : {},
        knownSpells: {},
        swapsApplied: [],
      });
    }
    const result = aggregateMagicLegality({
      levels,
      spellCatalog: compiledSpellCatalog,
      domainCatalog: compiledDomainCatalog,
    });
    expect(result.illegalLevels).toContain(3);
    expect(result.repairLevels).toContain(5);
    expect(result.status).toBe('illegal');
  });

  it('treats missing-source domain as blocked not illegal', () => {
    const emptyDomain = compiledDomainCatalog.domains.find(
      (d) => d.grantedFeatIds.length === 0,
    );
    if (!emptyDomain) {
      // Phase 07-01 fix populated grantedFeatIds for every domain. The
      // fail-closed path is exercised through the synthetic-catalog test in
      // tests/phase-07/catalog-fail-closed.spec.ts; skip here silently when the
      // real catalog has no missing-source domains.
      return;
    }
    const levels: MagicLevelInput[] = [
      {
        level: 1,
        buildState: emptyBuildState(
          1,
          { 'class:cleric': 1 },
          { 'class:cleric': 1 },
        ),
        classId: null,
        domainsSelected: [emptyDomain.id],
        spellbookAdditions: {},
        knownSpells: {},
        swapsApplied: [],
      },
    ];
    const result = aggregateMagicLegality({
      levels,
      spellCatalog: compiledSpellCatalog,
      domainCatalog: compiledDomainCatalog,
    });
    expect(result.status).toBe('blocked');
    expect(result.repairCount).toBeGreaterThanOrEqual(1);
    expect(result.illegalCount).toBe(0);
  });

  it('perLevel preserves inheritedFromLevel from revalidation', () => {
    const wizardSpell = compiledSpellCatalog.spells.find(
      (s) => s.classLevels['class:wizard'] != null,
    );
    const levels: MagicLevelInput[] = [
      {
        level: 1,
        buildState: emptyBuildState(
          1,
          { 'class:cleric': 1 },
          { 'class:cleric': 1 },
        ),
        classId: null,
        domainsSelected: [],
        spellbookAdditions: { 1: [wizardSpell!.id] },
        knownSpells: {},
        swapsApplied: [],
      },
      {
        level: 2,
        buildState: emptyBuildState(
          2,
          { 'class:cleric': 2 },
          { 'class:cleric': 2 },
        ),
        classId: null,
        domainsSelected: [],
        spellbookAdditions: { 0: [wizardSpell!.id] },
        knownSpells: {},
        swapsApplied: [],
      },
    ];
    const result = aggregateMagicLegality({
      levels,
      spellCatalog: compiledSpellCatalog,
      domainCatalog: compiledDomainCatalog,
    });
    const level2 = result.perLevel.find((l) => l.level === 2);
    expect(level2?.inheritedFromLevel).toBe(1);
  });
});
