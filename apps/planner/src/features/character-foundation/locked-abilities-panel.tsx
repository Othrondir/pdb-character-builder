import { shellCopyEs } from '@planner/lib/copy/es';

export function LockedAbilitiesPanel() {
  return (
    <section className="nwn-frame locked-abilities-panel">
      <header className="locked-abilities-panel__header">
        <p className="locked-abilities-panel__eyebrow">{shellCopyEs.subtitle}</p>
        <h1>{shellCopyEs.sections.abilities.heading}</h1>
        <p className="detail-panel__body">
          {shellCopyEs.sections.abilities.description}
        </p>
      </header>

      <div className="locked-abilities-panel__callout nwn-frame">
        <h2>{shellCopyEs.foundation.lockedAbilitiesHeading}</h2>
        <p>{shellCopyEs.foundation.lockedAbilitiesBody}</p>
      </div>
    </section>
  );
}
