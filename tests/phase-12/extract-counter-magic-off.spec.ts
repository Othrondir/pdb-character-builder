/**
 * Phase 12 Plan 12-02 — Bug 4 (IN-05) extract-counter regression spec.
 *
 * Locks the active-emitter descriptor list at the unit-helper seam (per
 * plan-checker ruling 2026-04-18): the GREEN implementation MUST export a pure
 * `buildEmitterPlan({ emitMagic }): Array<{index, total, name}>` helper from
 * `packages/data-extractor/src/cli.ts` and main() MUST iterate that list to
 * emit the `[N/TOTAL]` console-log counters.
 *
 * No child-process / full-extractor spawn here -- that variant was rejected
 * to prevent CI flakiness and to keep the assertion crisp (`EMIT_MAGIC_CATALOGS=0`
 * => total=5 => no `[N/7]` literal in stdout is implied directly by the helper
 * shape).
 *
 * RED today: `buildEmitterPlan` is not yet exported from cli.ts; the import
 * resolves at module-eval time and Vitest fails with "does not provide an
 * export named 'buildEmitterPlan'".
 */

import { describe, expect, it } from 'vitest';

import { buildEmitterPlan } from '@data-extractor/cli';

describe('extract-counter magic-off regression (IN-05)', () => {
  it('yields 5 active emitters with total = 5 when magic is off', () => {
    const plan = buildEmitterPlan({ emitMagic: false });

    expect(plan).toHaveLength(5);

    for (const step of plan) {
      expect(step.total).toBe(5);
    }

    // No '[N/7]' can be produced when total is 5.
    const formatted = plan.map((s) => `[${s.index}/${s.total}]`);
    expect(formatted.every((s) => !s.endsWith('/7]'))).toBe(true);
  });

  it('yields 7 active emitters with total = 7 when magic is on', () => {
    const plan = buildEmitterPlan({ emitMagic: true });

    expect(plan).toHaveLength(7);

    for (const step of plan) {
      expect(step.total).toBe(7);
    }
  });

  it('preserves emitter ordering: classes, races, skills, feats, [spells, domains,] deities', () => {
    const names = buildEmitterPlan({ emitMagic: true }).map((s) => s.name);

    expect(names).toEqual([
      'classes',
      'races',
      'skills',
      'feats',
      'spells',
      'domains',
      'deities',
    ]);
  });
});
