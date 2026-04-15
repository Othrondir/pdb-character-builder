import { describe, expect, it } from 'vitest';
import {
  skillCatalogSchema,
} from '@data-extractor/contracts/skill-catalog';
import { compiledSkillCatalog } from '@planner/features/skills/compiled-skill-catalog';

describe('phase 05 skill dataset contract', () => {
  it('keeps the runtime compiled catalog aligned with the extractor contract', () => {
    const parsedCatalog = skillCatalogSchema.parse(compiledSkillCatalog);

    // After Phase 05.1 extraction, the datasetId follows the puerta-ee-YYYY-MM-DD+hash format
    expect(parsedCatalog.datasetId).toMatch(/^puerta-ee-\d{4}-\d{2}-\d{2}\+[a-z0-9]+$/);
    // The extracted catalog has all 39 Puerta skills
    expect(parsedCatalog.skills.length).toBe(39);
  });

  it('has a tumble/piruetas skill in the extracted catalog', () => {
    // Skill IDs now use Spanish canonical names from the 2DA data.
    // skill:tumble is now skill:piruetas.
    const piruetasSkill = compiledSkillCatalog.skills.find(
      (skill) => skill.id === 'skill:piruetas',
    );

    expect(piruetasSkill).toBeDefined();
    expect(piruetasSkill?.label).toBe('Piruetas');
    expect(piruetasSkill?.trainedOnly).toBe(true);
  });

  it('has no restriction overrides in the extracted catalog (requires manual curation)', () => {
    // The extraction pipeline does not generate restriction overrides.
    // Those require manual curation from server rules and will be added
    // in a future plan when override files are integrated.
    expect(compiledSkillCatalog.restrictionOverrides).toEqual([]);
  });
});
