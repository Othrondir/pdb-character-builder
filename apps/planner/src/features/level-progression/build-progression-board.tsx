import type { CanonicalId } from '@rules-engine/contracts/canonical-id';
import type { ProgressionLevel } from '@planner/lib/sections';
import { shellCopyEs } from '@planner/lib/copy/es';
import { SelectionScreen } from '@planner/components/ui/selection-screen';
import { OptionList, type OptionItem } from '@planner/components/ui/option-list';
import { DetailPanel } from '@planner/components/ui/detail-panel';
import { selectActiveLevelSheet } from './selectors';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from './store';

export function BuildProgressionBoard() {
  const progressionState = useLevelProgressionStore();
  const foundationState = useCharacterFoundationStore();
  const activeSheet = selectActiveLevelSheet(progressionState, foundationState);
  const setLevelClassId = useLevelProgressionStore((s) => s.setLevelClassId);

  const classItems: OptionItem[] = activeSheet.classOptions.map((c: { id: string; label: string; selected: boolean; status: string }) => ({
    blocked: c.status === 'blocked' || c.status === 'illegal',
    id: c.id,
    label: c.label,
    selected: c.selected,
  }));

  const selectedClass = activeSheet.classOptions.find((c: { selected: boolean }) => c.selected);

  const title = `${shellCopyEs.stepper.stepTitles.class} ${activeSheet.level}`;

  return (
    <SelectionScreen title={title}>
      <OptionList
        items={classItems}
        onSelect={(id) => {
          setLevelClassId(activeSheet.level as ProgressionLevel, id as CanonicalId);
        }}
      />
      <DetailPanel
        title={selectedClass?.label}
        body={
          selectedClass
            ? `Clase seleccionada: ${selectedClass.label}`
            : activeSheet.placeholderBody
        }
      >
        {activeSheet.gains.length > 0 && (
          <div className="level-gains">
            <h4>Ganancias del nivel</h4>
            <ul>
              {activeSheet.gains.map((gain: string, i: number) => (
                <li key={i}>{gain}</li>
              ))}
            </ul>
          </div>
        )}
      </DetailPanel>
    </SelectionScreen>
  );
}
