import { PlannerSectionView } from '@planner/components/shell/section-view';
import { getSectionById } from '@planner/lib/sections';

export function UtilitiesRouteView() {
  return <PlannerSectionView section={getSectionById('utilities')} />;
}
