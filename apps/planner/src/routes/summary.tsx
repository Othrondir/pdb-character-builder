import { PlannerSectionView } from '@planner/components/shell/section-view';
import { getSectionById } from '@planner/lib/sections';

export function SummaryRouteView() {
  return <PlannerSectionView section={getSectionById('summary')} />;
}
