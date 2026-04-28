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
  // Skill IDs now use Spanish canonical names from the extracted 2DA data:
  //   skill:hide -> skill:esconderse
  //   skill:spellcraft -> skill:conocimientoconjuros
  //   skill:persuade -> skill:diplomacia
  //   skill:tumble -> skill:piruetas

  it('prices class and cross-class ranks differently against the compiled catalog', () => {
    const evaluation = evaluateSkillSnapshot({
      catalog: compiledSkillCatalog,
      levels: [
        createLevel(1, {
          allocations: [
            { rank: 4, skillId: 'skill:esconderse' },
            { rank: 1.5, skillId: 'skill:conocimientoconjuros' },
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
          skillId: 'skill:esconderse',
          spentPoints: 4,
        }),
        expect.objectContaining({
          costType: 'cross-class',
          skillId: 'skill:conocimientoconjuros',
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
          allocations: [{ rank: 2.5, skillId: 'skill:diplomacia' }],
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

  it('blocks compiled heavy-armor tumble restrictions when override is present', () => {
    // The extracted catalog does not include restriction overrides (those
    // require manual curation from server rules). This test verifies the
    // mechanism works by injecting the override into the catalog.
    const catalogWithOverride = {
      ...compiledSkillCatalog,
      restrictionOverrides: [
        {
          code: 'puerta.skill.tumble-heavy-armor',
          condition: { armorCategory: 'heavy' as const },
          description: 'Piruetas queda bloqueada mientras el personaje use armadura pesada.',
          outcome: 'blocked' as const,
          provenance: [{
            evidence: 'packages/overrides/skills/heavy-armor-tumble.json',
            note: 'Override curado del servidor para la restriccion de armadura pesada.',
            source: 'manual-override' as const,
          }],
          scope: 'equipment' as const,
          skillId: 'skill:piruetas',
        },
      ],
    };

    const evaluation = evaluateSkillSnapshot({
      catalog: catalogWithOverride,
      levels: [
        createLevel(1, {
          allocations: [{ rank: 2, skillId: 'skill:piruetas' }],
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

  it('carries forward up to 4 unspent skill points to the next legal level', () => {
    const evaluation = evaluateSkillSnapshot({
      catalog: compiledSkillCatalog,
      levels: [
        createLevel(1, {
          classId: 'class:fighter',
          intelligenceModifier: -1,
          skillPointsBase: 2,
        }),
        createLevel(2, {
          allocations: [{ rank: 5, skillId: 'skill:trepar' }],
          classId: 'class:fighter',
          intelligenceModifier: -1,
          skillPointsBase: 2,
        }),
      ],
    });

    expect(evaluation.levels[0]).toMatchObject({
      availablePoints: 4,
      remainingPoints: 4,
      spentPoints: 0,
      status: 'legal',
    });
    expect(evaluation.levels[1]).toMatchObject({
      availablePoints: 5,
      remainingPoints: 0,
      spentPoints: 5,
      status: 'legal',
    });
  });
});
