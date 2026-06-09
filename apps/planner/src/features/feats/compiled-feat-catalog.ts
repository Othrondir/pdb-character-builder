import type { FeatCatalog } from '@data-extractor/contracts/feat-catalog';
import { compiledFeatCatalog as extractedFeatCatalog } from '@planner/data/compiled-feats';
import { plannerClassCatalog } from '@planner/features/level-progression/class-fixture';
import { getPlannerVariantIdsForDataId } from '@planner/features/level-progression/class-id-aliases';

function expandClassFeatLists(
  classFeatLists: FeatCatalog['classFeatLists'],
): FeatCatalog['classFeatLists'] {
  const expanded: FeatCatalog['classFeatLists'] = { ...classFeatLists };

  for (const [classId, entries] of Object.entries(classFeatLists)) {
    for (const variantId of getPlannerVariantIdsForDataId(classId)) {
      expanded[variantId] = [...entries];
    }
  }

  return expanded;
}

export const compiledFeatCatalog: FeatCatalog = {
  ...extractedFeatCatalog,
  classFeatLists: expandClassFeatLists(extractedFeatCatalog.classFeatLists),
};

export const compiledClassCatalog = plannerClassCatalog;
