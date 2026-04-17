import { shellCopyEs } from '@planner/lib/copy/es';
import { formatDatasetLabel } from '@planner/data/ruleset-version';

/**
 * LANG-03 surface. Always-visible footer showing the dataset+ruleset label so players
 * can see at a glance which server rules a build targets.
 *
 * Paired with the Resumen header and the exported JSON header — three synchronized
 * surfaces, all driven by `formatDatasetLabel()` from `ruleset-version.ts`.
 */
export function PlannerFooter() {
  return (
    <footer className="planner-footer" aria-label={shellCopyEs.footer.datasetAria}>
      <span className="planner-footer__dataset">{formatDatasetLabel()}</span>
    </footer>
  );
}
