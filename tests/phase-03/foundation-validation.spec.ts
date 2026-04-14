import { describe, expect, it } from 'vitest';
import { calculateAbilityBudgetSnapshot } from '@rules-engine/foundation/ability-budget';
import { evaluateOriginSelection } from '@rules-engine/foundation/origin-rules';
import { phase03FoundationFixture } from '@planner/features/character-foundation/foundation-fixture';

function createOriginSelection(
  overrides: Partial<Parameters<typeof evaluateOriginSelection>[0]>,
) {
  return {
    alignmentId: null,
    alignments: phase03FoundationFixture.alignments,
    deityId: null,
    deities: phase03FoundationFixture.deities,
    raceId: null,
    races: phase03FoundationFixture.races,
    subraceId: null,
    subraces: phase03FoundationFixture.subraces,
    ...overrides,
  };
}

describe('phase 03 foundation validation helpers', () => {
  it('treats deity:none as legal when the race keeps deity optional', () => {
    const evaluation = evaluateOriginSelection(
      createOriginSelection({
        alignmentId: 'alignment:neutral-good',
        deityId: 'deity:none',
        raceId: 'race:human',
      }),
    );

    expect(evaluation.requiredDeityResolved).toBe(true);
    expect(evaluation.summaryStatus).toBe('legal');
  });

  it('does not return legal when the selected race requires a deity', () => {
    const evaluation = evaluateOriginSelection(
      createOriginSelection({
        alignmentId: 'alignment:neutral-good',
        deityId: 'deity:none',
        raceId: 'race:dwarf',
      }),
    );

    expect(evaluation.requiredDeityResolved).toBe(false);
    expect(evaluation.summaryStatus).not.toBe('legal');
  });

  it('rejects a subrace outside the selected race', () => {
    const evaluation = evaluateOriginSelection(
      createOriginSelection({
        alignmentId: 'alignment:neutral-good',
        deityId: 'deity:none',
        raceId: 'race:human',
        subraceId: 'subrace:moon-elf',
      }),
    );

    expect(evaluation.summaryStatus).not.toBe('legal');
  });

  it('marks overspent attributes as illegal and returns a negative remainder', () => {
    const budget = calculateAbilityBudgetSnapshot({
      attributeRules: phase03FoundationFixture.attributeRules,
      baseAttributes: {
        cha: 18,
        con: 18,
        dex: 18,
        int: 18,
        str: 18,
        wis: 18,
      },
      originReady: true,
    });

    expect(budget.remainingPoints).toBeLessThan(0);
    expect(budget.status).toBe('illegal');
  });
});
