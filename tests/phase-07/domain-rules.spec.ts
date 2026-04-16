import { describe, expect, it } from 'vitest';
import type { BuildStateAtLevel } from '@rules-engine/feats/feat-prerequisite';
import {
  evaluateDomainSelection,
  getEligibleDomains,
  MAX_DOMAINS_PER_CLERIC,
} from '@rules-engine/magic/domain-rules';
import { compiledDomainCatalog } from '@planner/data/compiled-domains';

function createMagicBuildState(
  overrides: Partial<BuildStateAtLevel> = {},
): BuildStateAtLevel {
  return {
    abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 14, cha: 10 },
    bab: 0,
    characterLevel: 1,
    classLevels: {},
    fortitudeSave: 0,
    selectedFeatIds: new Set<string>(),
    skillRanks: {},
    casterLevelByClass: {},
    ...overrides,
  };
}

describe('phase 07 domain rules', () => {
  it('exports MAX_DOMAINS_PER_CLERIC = 2 per D-11', () => {
    expect(MAX_DOMAINS_PER_CLERIC).toBe(2);
  });

  it('allows a cleric at class level 1 to select a single domain', () => {
    const buildState = createMagicBuildState({
      classLevels: { 'class:cleric': 1 },
    });

    const result = evaluateDomainSelection(
      'domain:air',
      [],
      buildState,
      compiledDomainCatalog,
    );

    expect(result.met).toBe(true);
    const failed = result.checks.filter((c) => !c.met);
    expect(failed).toHaveLength(0);
  });

  it('blocks selection of a 3rd domain with a Spanish-labeled cap violation', () => {
    const buildState = createMagicBuildState({
      classLevels: { 'class:cleric': 1 },
    });

    const result = evaluateDomainSelection(
      'domain:earth',
      ['domain:air', 'domain:animal'],
      buildState,
      compiledDomainCatalog,
    );

    expect(result.met).toBe(false);
    const capCheck = result.checks.find((c) =>
      /dominio/i.test(c.label),
    );
    expect(capCheck).toBeDefined();
    expect(capCheck?.met).toBe(false);
  });

  it('allows Puerta custom domain domain:pb-suerte for a cleric', () => {
    const buildState = createMagicBuildState({
      classLevels: { 'class:cleric': 1 },
    });

    const result = evaluateDomainSelection(
      'domain:pb-suerte',
      [],
      buildState,
      compiledDomainCatalog,
    );

    expect(result.met).toBe(true);
  });

  it('blocks non-cleric from selecting a domain with Spanish cleric requirement', () => {
    const buildState = createMagicBuildState({
      classLevels: { 'class:fighter': 5 },
    });

    const result = evaluateDomainSelection(
      'domain:air',
      [],
      buildState,
      compiledDomainCatalog,
    );

    expect(result.met).toBe(false);
    const clericCheck = result.checks.find((c) =>
      /Cl[eé]rigo/i.test(c.label),
    );
    expect(clericCheck).toBeDefined();
    expect(clericCheck?.met).toBe(false);
  });

  it('getEligibleDomains returns non-empty list including domain:pb-suerte for a cleric', () => {
    const buildState = createMagicBuildState({
      classLevels: { 'class:cleric': 1 },
    });

    const eligible = getEligibleDomains(buildState, compiledDomainCatalog);

    expect(eligible.length).toBeGreaterThan(0);
    const hasPuerta = eligible.some((e) => e.domain.id === 'domain:pb-suerte');
    expect(hasPuerta).toBe(true);
  });
});
