import { shellCopyEs } from '@planner/lib/copy/es';

export function LockedAbilitiesPanel() {
  return (
    <section className="planner-panel section-fade planner-section-view">
      <header className="planner-section-view__header">
        <p className="planner-section-view__eyebrow">{shellCopyEs.subtitle}</p>
        <h1>{shellCopyEs.sections.abilities.heading}</h1>
        <p className="planner-section-view__description">
          {shellCopyEs.sections.abilities.description}
        </p>
      </header>

      <div className="planner-section-view__callout planner-panel planner-panel--inner">
        <h2>{shellCopyEs.foundation.lockedAbilitiesHeading}</h2>
        <p>{shellCopyEs.foundation.lockedAbilitiesBody}</p>
      </div>
    </section>
  );
}
