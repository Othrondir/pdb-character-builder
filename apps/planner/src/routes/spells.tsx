import { PlannerSectionView } from '@planner/components/shell/section-view';
import { getSectionById } from '@planner/lib/sections';

export function SpellsRouteView() {
  return <PlannerSectionView section={getSectionById('spells')} />;
}
