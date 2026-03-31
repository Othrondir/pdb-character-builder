import { describe, expect, it } from 'vitest';
import { compiledSkillCatalog } from '@planner/features/skills/compiled-skill-catalog';
import {
  evaluateSkillSnapshot,
  type SkillLevelInput,
} from '@rules-engine/skills/skill-allocation';

function createLevel(
  level: number,
  overrides: Partial<SkillLevelInput> = {},
): SkillLevelInput {
  return {
    allocations: [],
    armorCategory: null,
    classId: 'class:fighter',
    intelligenceModifier: 0,
    level,
    skillPointsBase: 2,
    ...overrides,
  };
}

describe('phase 05 skill rules', () => {
  it('prices class and cross-class ranks differently against the compiled catalog', () => {
    const evaluation = evaluateSkillSnapshot({
      catalog: compiledSkillCatalog,
      levels: [
        createLevel(1, {
          allocations: [
            { rank: 4, skillId: 'skill:hide' },
            { rank: 1.5, skillId: 'skill:spellcraft' },
          ],
          classId: 'class:ranger',
          intelligenceModifier: 1,
          skillPointsBase: 8,
        }),
      ],
    });

    expect(evaluation.levels[0]?.spentPoints).toBe(7);
    expect(evaluation.levels[0]?.remainingPoints).toBe(29);
    expect(evaluation.levels[0]?.allocations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          costType: 'class',
          skillId: 'skill:hide',
          spentPoints: 4,
        }),
        expect.objectContaining({
          costType: 'cross-class',
          skillId: 'skill:spellcraft',
          spentPoints: 3,
        }),
      ]),
    );
  });

  it('marks ranks above the cross-class cap as illegal', () => {
    const evaluation = evaluateSkillSnapshot({
      catalog: compiledSkillCatalog,
      levels: [
        createLevel(1, {
          allocations: [{ rank: 2.5, skillId: 'skill:persuade' }],
          classId: 'class:fighter',
        }),
      ],
    });

    expect(evaluation.levels[0]?.status).toBe('illegal');
    expect(evaluation.levels[0]?.allocations[0]).toMatchObject({
      cap: 2,
      costType: 'cross-class',
      status: 'illegal',
    });
  });

  it('blocks compiled heavy-armor tumble restrictions without UI-local constants', () => {
    const evaluation = evaluateSkillSnapshot({
      catalog: compiledSkillCatalog,
      levels: [
        createLevel(1, {
          allocations: [{ rank: 2, skillId: 'skill:tumble' }],
          armorCategory: 'heavy',
          classId: 'class:rogue',
          intelligenceModifier: 2,
          skillPointsBase: 8,
        }),
      ],
    });

    expect(evaluation.levels[0]?.status).toBe('blocked');
    expect(evaluation.levels[0]?.allocations[0]?.status).toBe('blocked');
    expect(
      evaluation.levels[0]?.allocations[0]?.issues.some(
        (issue) => issue.status === 'blocked',
      ),
    ).toBe(true);
  });
});
