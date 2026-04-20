import type { CanonicalId } from '@rules-engine/contracts/canonical-id';
import { shellCopyEs } from '@planner/lib/copy/es';
import { SelectionScreen } from '@planner/components/ui/selection-screen';
import { DetailPanel } from '@planner/components/ui/detail-panel';
import { selectActiveLevelSheet } from './selectors';
import { getPhase04ClassRecord } from './class-fixture';
import { ClassPicker } from './class-picker';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from './store';

export function BuildProgressionBoard() {
  const progressionState = useLevelProgressionStore();
  const foundationState = useCharacterFoundationStore();
  const activeSheet = selectActiveLevelSheet(progressionState, foundationState);

  const selectedClass = activeSheet.classOptions.find(
    (c: { selected: boolean }) => c.selected,
  );

  const selectedClassRecord = selectedClass
    ? getPhase04ClassRecord(selectedClass.id as CanonicalId)
    : null;

  const title = `${shellCopyEs.stepper.stepTitles.class} ${activeSheet.level}`;

  return (
    <SelectionScreen title={title}>
      <ClassPicker />
      <DetailPanel
        title={selectedClass?.label}
        body={
          selectedClassRecord
            ? selectedClassRecord.description
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
