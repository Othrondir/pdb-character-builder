import { describe, expect, it } from 'vitest';
import { calculateAbilityBudgetSnapshot } from '@rules-engine/foundation/ability-budget';
import { evaluateOriginSelection } from '@rules-engine/foundation/origin-rules';
import {
  canonicalIdRegex,
  type CanonicalId,
} from '@rules-engine/contracts/canonical-id';
import { phase03FoundationFixture } from '@planner/features/character-foundation/foundation-fixture';

/**
 * Branded-id rebuilder helper. Validates that `raw` matches canonicalIdRegex
 * at runtime before asserting the CanonicalId brand — preserves the branded
 * invariant at the test fixture boundary without leaking `as CanonicalId`
 * casts across the spec (Phase 12 Bug 1 / D-01 per 12-CONTEXT.md).
 */
function asCanonicalId(raw: string): CanonicalId {
  if (!canonicalIdRegex.test(raw)) {
    throw new Error(
      `asCanonicalId: '${raw}' does not match canonicalIdRegex`,
    );
  }

  return raw as CanonicalId;
}

/**
 * Build a DeityRuleRecord-shaped value with both id and allowedAlignmentIds
 * branded as CanonicalId — the single cast site lives inside asCanonicalId
 * under the runtime regex guard, so fixture code stays cast-free.
 */
function buildDeityRecord(
  id: string,
  allowedAlignmentIds: readonly string[],
): { id: CanonicalId; allowedAlignmentIds: CanonicalId[] } {
  return {
    id: asCanonicalId(id),
    allowedAlignmentIds: allowedAlignmentIds.map(asCanonicalId),
  };
}

function createOriginSelection(
  overrides: Partial<Parameters<typeof evaluateOriginSelection>[0]>,
) {
  return {
    alignmentId: null,
    alignments: phase03FoundationFixture.alignments,
    deityId: null,
    deities: [buildDeityRecord('deity:none', [])],
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
        raceId: 'race:test-required-deity',
        races: [
          ...phase03FoundationFixture.races,
          {
            allowedAlignmentIds: phase03FoundationFixture.alignments.map((a) => a.id),
            deityPolicy: 'required',
            id: 'race:test-required-deity',
            label: 'Test race with required deity',
          },
        ],
      }),
    );

    expect(evaluation.requiredDeityResolved).toBe(false);
    expect(evaluation.summaryStatus).not.toBe('legal');
  });

  it('rejects a subrace outside the selected race', () => {
    // Phase 12.1-02: foundation-fixture.ts no longer hand-authors
    // subrace:moon-elf — the extractor does not emit subraces yet (CONTEXT
    // deferred). Inline a minimal test subrace with parentRaceId = 'race:elf'
    // so the rules-engine's parent-mismatch branch stays covered without
    // coupling this spec to extractor output.
    const testMoonElf = {
      allowedAlignmentIds: phase03FoundationFixture.alignments.map((a) => a.id),
      id: 'subrace:test-moon-elf' as CanonicalId,
      label: 'Elfo lunar (prueba)',
      parentRaceId: 'race:elf' as CanonicalId,
    };

    const evaluation = evaluateOriginSelection(
      createOriginSelection({
        alignmentId: 'alignment:neutral-good',
        deityId: 'deity:none',
        raceId: 'race:human',
        subraceId: testMoonElf.id,
        subraces: [...phase03FoundationFixture.subraces, testMoonElf],
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
