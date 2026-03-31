import { describe, expect, it } from 'vitest';
import {
  skillCatalogSchema,
  type SkillRestrictionOverride,
} from '@data-extractor/contracts/skill-catalog';
import { compiledSkillCatalog } from '@planner/features/skills/compiled-skill-catalog';

describe('phase 05 skill dataset contract', () => {
  it('keeps the runtime compiled catalog aligned with the extractor contract', () => {
    const parsedCatalog = skillCatalogSchema.parse(compiledSkillCatalog);

    expect(parsedCatalog.datasetId).toBe('puerta-ee-2026-03-31+skills05');
    expect(parsedCatalog.skills.length).toBeGreaterThan(5);
  });

  it('surfaces heavy-armor tumble restriction metadata through compiled overrides', () => {
    const tumbleSkill = compiledSkillCatalog.skills.find(
      (skill) => skill.id === 'skill:tumble',
    );
    const heavyArmorOverride = compiledSkillCatalog.restrictionOverrides.find(
      (override): override is SkillRestrictionOverride =>
        override.code === 'puerta.skill.tumble-heavy-armor',
    );

    expect(tumbleSkill?.restrictionMetadata).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'puerta.skill.tumble-heavy-armor',
          outcome: 'blocked',
          scope: 'equipment',
        }),
      ]),
    );
    expect(heavyArmorOverride).toMatchObject({
      code: 'puerta.skill.tumble-heavy-armor',
      outcome: 'blocked',
      scope: 'equipment',
      skillId: 'skill:tumble',
    });
  });
});
