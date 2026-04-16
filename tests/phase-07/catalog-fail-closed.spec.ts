// Phase 7 Wave 0 contract:
//   Empty description / empty grantedFeatIds MUST produce
//   { status: 'blocked', blockKind: 'missing-source' } via resolveValidationOutcome.
import { describe, expect, it } from 'vitest';
import {
  detectMissingSpellData,
  detectMissingDomainData,
} from '@rules-engine/magic/catalog-fail-closed';
import { compiledSpellCatalog } from '@planner/data/compiled-spells';
import { compiledDomainCatalog } from '@planner/data/compiled-domains';

describe('phase 07 detectMissingSpellData', () => {
  it('returns blocked + missing-source ValidationOutcome for a spell with empty description', () => {
    const emptyDescSpell = compiledSpellCatalog.spells.find(
      (s) => s.description === '',
    );
    expect(emptyDescSpell).toBeDefined();
    if (!emptyDescSpell) return;

    const outcome = detectMissingSpellData(emptyDescSpell.id, compiledSpellCatalog);

    expect(outcome).not.toBeNull();
    expect(outcome?.status).toBe('blocked');
    if (outcome && outcome.status === 'blocked') {
      expect(outcome.blockKind).toBe('missing-source');
    }
  });

  it('returns blocked + missing-source for an unknown spell id', () => {
    const outcome = detectMissingSpellData(
      'spell:does-not-exist',
      compiledSpellCatalog,
    );

    expect(outcome).not.toBeNull();
    expect(outcome?.status).toBe('blocked');
    if (outcome && outcome.status === 'blocked') {
      expect(outcome.blockKind).toBe('missing-source');
    }
  });

  it('returns null for a spell with non-empty description', () => {
    const okSpell = compiledSpellCatalog.spells.find(
      (s) => s.description.length > 0,
    );
    expect(okSpell).toBeDefined();
    if (!okSpell) return;

    const outcome = detectMissingSpellData(okSpell.id, compiledSpellCatalog);
    expect(outcome).toBeNull();
  });
});

describe('phase 07 detectMissingDomainData', () => {
  it('returns null for a domain with populated grantedFeatIds', () => {
    const domainWithFeats = compiledDomainCatalog.domains.find(
      (d) => d.grantedFeatIds.length > 0,
    );
    expect(domainWithFeats).toBeDefined();
    if (!domainWithFeats) return;

    const outcome = detectMissingDomainData(
      domainWithFeats.id,
      compiledDomainCatalog,
    );
    expect(outcome).toBeNull();
  });

  it('returns blocked + missing-source for a synthetic domain with empty grantedFeatIds', () => {
    const fakeDomainId = 'domain:unknown-domain';
    const outcome = detectMissingDomainData(fakeDomainId, compiledDomainCatalog);

    expect(outcome).not.toBeNull();
    expect(outcome?.status).toBe('blocked');
    if (outcome && outcome.status === 'blocked') {
      expect(outcome.blockKind).toBe('missing-source');
    }
  });
});

describe('phase 07 fail-closed message keys', () => {
  it('missing-source ValidationOutcome carries the notVerifiable message key', () => {
    const outcome = detectMissingSpellData(
      'spell:does-not-exist',
      compiledSpellCatalog,
    );
    expect(outcome).not.toBeNull();
    expect(outcome?.messageKey).toBe('validation.blocked.notVerifiable');
  });
});
