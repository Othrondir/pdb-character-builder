import { describe, expect, it } from 'vitest';
import { compiledSkillCatalog } from '@planner/features/skills/compiled-skill-catalog';
import {
  revalidateSkillSnapshotAfterChange,
} from '@rules-engine/skills/skill-revalidation';
import type { SkillLevelInput } from '@rules-engine/skills/skill-allocation';

// Skill IDs now use Spanish canonical names from the extracted 2DA data:
//   skill:hide -> skill:esconderse
//   skill:move-silently -> skill:moversesigilosamente
//   skill:listen -> skill:escuchar
//   skill:tumble -> skill:piruetas

function createLevel(
  level: number,
  overrides: Partial<SkillLevelInput> = {},
): SkillLevelInput {
  return {
    allocations: [],
    armorCategory: null,
    classId: 'class:rogue',
    intelligenceModifier: 0,
    level,
    skillPointsBase: 8,
    ...overrides,
  };
}

describe('phase 05 skill revalidation', () => {
  it('keeps later levels visible and inherited when an earlier level becomes overspent', () => {
    const revalidated = revalidateSkillSnapshotAfterChange({
      catalog: compiledSkillCatalog,
      levels: [
        createLevel(1, {
          allocations: [{ rank: 4, skillId: 'skill:esconderse' }],
          classId: 'class:rogue',
          intelligenceModifier: 1,
        }),
        createLevel(2, {
          allocations: [
            { rank: 4, skillId: 'skill:esconderse' },
            { rank: 4, skillId: 'skill:moversesigilosamente' },
          ],
          classId: 'class:fighter',
          intelligenceModifier: -1,
          skillPointsBase: 2,
        }),
        createLevel(3, {
          allocations: [{ rank: 1, skillId: 'skill:escuchar' }],
          classId: 'class:rogue',
        }),
      ],
    });

    expect(revalidated[1]).toMatchObject({
      inheritedFromLevel: null,
      level: 2,
      status: 'illegal',
    });
    expect(revalidated[2]).toMatchObject({
      inheritedFromLevel: 2,
      level: 3,
      status: 'blocked',
    });
  });

  it('preserves downstream rows after a restriction blocks an earlier level', () => {
    // The extracted catalog has no restriction overrides. To test the
    // blocking mechanism, inject the heavy-armor tumble override.
    const catalogWithOverride = {
      ...compiledSkillCatalog,
      restrictionOverrides: [
        {
          code: 'puerta.skill.tumble-heavy-armor',
          condition: { armorCategory: 'heavy' as const },
          description: 'Piruetas queda bloqueada con armadura pesada.',
          outcome: 'blocked' as const,
          provenance: [{
            evidence: 'packages/overrides/skills/heavy-armor-tumble.json',
            note: 'Override curado del servidor.',
            source: 'manual-override' as const,
          }],
          scope: 'equipment' as const,
          skillId: 'skill:piruetas',
        },
      ],
    };

    const revalidated = revalidateSkillSnapshotAfterChange({
      catalog: catalogWithOverride,
      levels: [
        createLevel(1, {
          allocations: [{ rank: 2, skillId: 'skill:piruetas' }],
          armorCategory: 'heavy',
        }),
        createLevel(2, {
          allocations: [{ rank: 1, skillId: 'skill:escuchar' }],
        }),
      ],
    });

    expect(revalidated[0]).toMatchObject({
      inheritedFromLevel: null,
      level: 1,
      status: 'blocked',
    });
    expect(revalidated[1]).toMatchObject({
      inheritedFromLevel: 1,
      level: 2,
      status: 'blocked',
    });
  });
});
