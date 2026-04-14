import type { PlannerSectionDefinition } from '@planner/lib/sections';
import { shellCopyEs } from '@planner/lib/copy/es';

interface PlannerSectionViewProps {
  section: PlannerSectionDefinition;
}

export function PlannerSectionView({ section }: PlannerSectionViewProps) {
  return (
    <section className="planner-panel section-fade planner-section-view">
      <header className="planner-section-view__header">
        <p className="planner-section-view__eyebrow">
          {shellCopyEs.emptyStateHeading}
        </p>
        <h1>{section.heading}</h1>
        <p className="planner-section-view__description">{section.description}</p>
      </header>

      <div className="planner-section-view__highlights">
        {section.highlights.map((highlight) => (
          <span key={highlight} className="planner-chip">
            {highlight}
          </span>
        ))}
      </div>

      <div className="planner-section-view__callout planner-panel planner-panel--inner">
        <h2>{shellCopyEs.primaryAction}</h2>
        <p>{shellCopyEs.emptyStateBody}</p>
      </div>
    </section>
  );
}
