import { CreationStepper } from '@planner/components/shell/creation-stepper';
import { CharacterSheet } from '@planner/components/shell/character-sheet';
import { shellCopyEs } from '@planner/lib/copy/es';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import { CenterContent } from './center-content';
import { MobileNavToggle } from './mobile-nav-toggle';
import { Toast } from '@planner/components/ui/toast';

export function PlannerShellFrame() {
  const mobileNavOpen = usePlannerShellStore((state) => state.mobileNavOpen);

  return (
    <div className="planner-shell">
      <MobileNavToggle />
      <div className="planner-layout">
        <div
          aria-label={shellCopyEs.stepper.heading}
          className={`planner-layout__stepper${mobileNavOpen ? ' is-open' : ''}`}
          id="planner-stepper-drawer"
          role={mobileNavOpen ? 'dialog' : undefined}
        >
          <CreationStepper />
        </div>
        <main className="planner-layout__center">
          <CenterContent />
        </main>
        <CharacterSheet />
      </div>
      <Toast />
    </div>
  );
}
