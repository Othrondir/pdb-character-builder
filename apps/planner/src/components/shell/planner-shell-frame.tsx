import { CreationStepper } from '@planner/components/shell/creation-stepper';
import { CharacterSheet } from '@planner/components/shell/character-sheet';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import { CenterContent } from './center-content';

export function PlannerShellFrame() {
  const mobileNavOpen = usePlannerShellStore((state) => state.mobileNavOpen);

  return (
    <div className="planner-shell">
      <div className="planner-layout">
        <div className={`planner-layout__stepper${mobileNavOpen ? ' is-open' : ''}`}>
          <CreationStepper />
        </div>
        <main className="planner-layout__center">
          <CenterContent />
        </main>
        <CharacterSheet />
      </div>
    </div>
  );
}
