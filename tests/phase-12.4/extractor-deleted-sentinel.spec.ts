import { describe, expect, it } from 'vitest';

import {
  SENTINEL_REGEX,
  isSentinelLabel,
} from '@data-extractor/lib/sentinel-regex';
import { compiledFeatCatalog } from '@planner/data/compiled-feats';
import { compiledSkillCatalog } from '@planner/data/compiled-skills';
import { compiledClassCatalog } from '@planner/data/compiled-classes';
import { compiledRaceCatalog } from '@planner/data/compiled-races';

/**
 * Phase 12.4-01 — extractor + UI sentinel filter (SPEC R8).
 *
 * Locks the fail-closed contract for the shared sentinel-label predicate
 * consumed by all four catalog assemblers + the UI feat selector:
 *   - SENTINEL_REGEX matches DELETED / ***DELETED*** / DELETED_* / PADDING
 *     / UNUSED / **** (case-insensitive, tolerant of surrounding whitespace).
 *   - isSentinelLabel(label) returns true for any sentinel string, false for
 *     real labels and null/undefined/empty input.
 *
 * Regression lock: the shipped feat/skill/class/race catalogs contain zero
 * rows whose `label` matches the sentinel predicate. Current compiled-feats.ts
 * ships two `"label": "DELETED"` entries at sourceRow 385 + 403 — this spec
 * MUST fail against that artifact until Task 1 regenerates it.
 */
describe('Phase 12.4-01 — extractor + UI sentinel filter (SPEC R8)', () => {
  describe('isSentinelLabel — pure helper', () => {
    it.each<[string | null | undefined, boolean]>([
      ['DELETED', true],
      ['deleted', true],
      ['***DELETED***', true],
      ['*** DELETED ***', true],
      ['PADDING', true],
      ['UNUSED', true],
      ['DELETED_EPIC', true],
      ['DELETED_DO_NOT_USE', true],
      ['****', true],
      ['*****', true],
      ['Esquiva', false],
      ['Arma predilecta', false],
      [null, false],
      [undefined, false],
      ['', false],
    ])('isSentinelLabel(%j) === %s', (input, expected) => {
      expect(isSentinelLabel(input)).toBe(expected);
    });

    it('SENTINEL_REGEX is exported as a RegExp', () => {
      expect(SENTINEL_REGEX).toBeInstanceOf(RegExp);
    });
  });

  describe('Extractor catalog hygiene — fail-closed at producer', () => {
    it('feat catalog ships zero sentinel rows', () => {
      const leaks = compiledFeatCatalog.feats.filter((f) =>
        isSentinelLabel(f.label),
      );
      expect(leaks).toEqual([]);
    });

    it('skill catalog ships zero sentinel rows', () => {
      const leaks = compiledSkillCatalog.skills.filter((s) =>
        isSentinelLabel(s.label),
      );
      expect(leaks).toEqual([]);
    });

    it('class catalog ships zero sentinel rows', () => {
      const leaks = compiledClassCatalog.classes.filter((c) =>
        isSentinelLabel(c.label),
      );
      expect(leaks).toEqual([]);
    });

    it('race catalog ships zero sentinel rows', () => {
      const leaks = compiledRaceCatalog.races.filter((r) =>
        isSentinelLabel(r.label),
      );
      expect(leaks).toEqual([]);
    });
  });
});
