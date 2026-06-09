import type { SkillCatalog } from '@data-extractor/contracts/skill-catalog';
import { compiledSkillCatalog as extractedSkillCatalog } from '@planner/data/compiled-skills';
import { getPlannerVariantIdsForDataId } from '@planner/features/level-progression/class-id-aliases';

function expandClassSkillIds(classIds: readonly string[]) {
  const expanded = new Set(classIds);
  for (const classId of classIds) {
    for (const variantId of getPlannerVariantIdsForDataId(classId)) {
      expanded.add(variantId);
    }
  }
  return Array.from(expanded);
}

export const compiledSkillCatalog: SkillCatalog = {
  ...extractedSkillCatalog,
  skills: extractedSkillCatalog.skills.map((skill) => ({
    ...skill,
    defaultClassIds: expandClassSkillIds(skill.defaultClassIds),
  })),
};

export function getCompiledSkillRecord(skillId: string) {
  return compiledSkillCatalog.skills.find((skill) => skill.id === skillId) ?? null;
}
