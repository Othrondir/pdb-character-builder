import { describe, expect, it } from 'vitest';
import { compiledSkillCatalog } from '@planner/features/skills/compiled-skill-catalog';
import {
  revalidateSkillSnapshotAfterChange,
} from '@rules-engine/skills/skill-revalidation';
import type { SkillLevelInput } from '@rules-engine/skills/skill-allocation';

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
          allocations: [{ rank: 4, skillId: 'skill:hide' }],
          classId: 'class:rogue',
          intelligenceModifier: 1,
        }),
        createLevel(2, {
          allocations: [
            { rank: 4, skillId: 'skill:hide' },
            { rank: 4, skillId: 'skill:move-silently' },
          ],
          classId: 'class:fighter',
          intelligenceModifier: -1,
          skillPointsBase: 2,
        }),
        createLevel(3, {
          allocations: [{ rank: 1, skillId: 'skill:listen' }],
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

  it('preserves downstream rows after a compiled restriction blocks an earlier level', () => {
    const revalidated = revalidateSkillSnapshotAfterChange({
      catalog: compiledSkillCatalog,
      levels: [
        createLevel(1, {
          allocations: [{ rank: 2, skillId: 'skill:tumble' }],
          armorCategory: 'heavy',
        }),
        createLevel(2, {
          allocations: [{ rank: 1, skillId: 'skill:listen' }],
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
