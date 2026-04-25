/**
 * Phase 14-05 — abilityModifier helper + skills-delegation regression spec.
 *
 * Locks ROADMAP SC#5 (Phase 14):
 *   - Single canonical D&D 3.5 / NWN1 EE ability-modifier formula lives in
 *     `packages/rules-engine/src/foundation/ability-modifier.ts`.
 *   - The four production sites that previously inlined `Math.floor((score - 10) / 2)`
 *     (skills/selectors.ts, attributes-board.tsx, summary/resumen-selectors.ts,
 *     character-sheet.tsx) all delegate via `import { abilityModifier } from
 *     '@rules-engine/foundation'`.
 *
 * Spec layout:
 *   - 9 helper unit cases (H1..H9) — formula + purity.
 *   - 1 integration case (D1) — `evaluateSkillSnapshot` honours the helper at L1.
 *   - 1 sentinel scan (added in Task 2) — no inline `Math.floor((score - 10)/2)`
 *     remains in the four migrated production files.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { abilityModifier } from '@rules-engine/foundation';
import {
  evaluateSkillSnapshot,
  type SkillLevelInput,
} from '@rules-engine/skills/skill-allocation';
import { compiledSkillCatalog } from '@planner/features/skills/compiled-skill-catalog';

describe('Phase 14-05 — abilityModifier canonical helper', () => {
  it('H1: score 10 → modifier 0 (baseline anchor)', () => {
    expect(abilityModifier(10)).toBe(0);
  });

  it('H2: score 11 → modifier 0 (odd-score floor)', () => {
    expect(abilityModifier(11)).toBe(0);
  });

  it('H3: score 12 → modifier 1 (first positive step)', () => {
    expect(abilityModifier(12)).toBe(1);
  });

  it('H4: score 18 → modifier 4 (canonical hero baseline)', () => {
    expect(abilityModifier(18)).toBe(4);
  });

  it('H5: score 25 → modifier 7 (NWN1 schema upper bound)', () => {
    expect(abilityModifier(25)).toBe(7);
  });

  it('H6: score 8 → modifier -1 (one-step penalty)', () => {
    expect(abilityModifier(8)).toBe(-1);
  });

  it('H7: score 1 → modifier -5 (extreme low; below schema clamp)', () => {
    expect(abilityModifier(1)).toBe(-5);
  });

  it('H8: score 0 → modifier -5 (mathematically floor(-10/2)=-5; documented edge)', () => {
    // NWN1 schema clamps attributes to [3, 25]; 0 is unreachable through real
    // input, but the math is asserted to lock pure-function intent.
    expect(abilityModifier(0)).toBe(-5);
  });

  it('H9: pure function — repeated calls return identical results (idempotence)', () => {
    expect(abilityModifier(15)).toBe(abilityModifier(15));
    expect(abilityModifier(7)).toBe(abilityModifier(7));
    // Side-effect probe: snapshot a pure permutation, re-call, compare.
    const probeA = [10, 11, 12, 13, 14, 15, 16, 17, 18].map(abilityModifier);
    const probeB = [10, 11, 12, 13, 14, 15, 16, 17, 18].map(abilityModifier);
    expect(probeA).toEqual(probeB);
  });

  it('D1: evaluateSkillSnapshot honours abilityModifier(14)=2 → L1 rogue=(8+2)*4=40 points', () => {
    const intelligenceScore = 14;
    const expectedMod = abilityModifier(intelligenceScore);
    expect(expectedMod).toBe(2);

    const level1: SkillLevelInput = {
      allocations: [],
      armorCategory: null,
      classId: 'class:rogue',
      intelligenceModifier: expectedMod,
      level: 1,
      skillPointsBase: 8,
    };

    const evaluation = evaluateSkillSnapshot({
      catalog: compiledSkillCatalog,
      levels: [level1],
    });

    // Canonical D&D 3.5 / NWN1 L1 formula: (skillPointsBase + intMod) × 4.
    expect(evaluation.levels[0]?.availablePoints).toBe(40);
  });
});

describe('Phase 14-05 — production-site sentinel (no inline (score - 10)/2)', () => {
  it('production-site sweep — no inline (score - 10) / 2 expressions remain in the four migrated files', () => {
    const repoRoot = process.cwd();
    const targets = [
      'apps/planner/src/features/skills/selectors.ts',
      'apps/planner/src/features/character-foundation/attributes-board.tsx',
      'apps/planner/src/features/summary/resumen-selectors.ts',
      'apps/planner/src/components/shell/character-sheet.tsx',
    ];

    // The pattern matches single-line OR multi-line `Math.floor(... - 10) / 2)`
    // forms (selectors.ts line 227 spans multiple lines; the .s-flag isn't
    // available in the literal regex, so we strip newlines first).
    const inlineFormula = /Math\.floor\(\s*\(?[^)]*-\s*10\)\s*\/\s*2\s*\)/;

    for (const rel of targets) {
      const abs = resolve(repoRoot, rel);
      const raw = readFileSync(abs, 'utf-8').replace(/\s+/g, ' ');
      expect(
        inlineFormula.test(raw),
        `${rel} still contains an inline (score - 10)/2 expression — migrate to abilityModifier`,
      ).toBe(false);
    }
  });
});
