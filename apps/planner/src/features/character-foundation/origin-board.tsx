import type { CanonicalId } from '@rules-engine/contracts/canonical-id';
import { shellCopyEs } from '@planner/lib/copy/es';
import { SelectionScreen } from '@planner/components/ui/selection-screen';
import { OptionList, type OptionItem } from '@planner/components/ui/option-list';
import { DetailPanel } from '@planner/components/ui/detail-panel';
import { ActionBar } from '@planner/components/ui/action-bar';
import {
  selectFoundationSummary,
  selectFoundationValidation,
  selectOriginOptions,
} from '@planner/features/character-foundation/selectors';
import { phase03FoundationFixture } from '@planner/features/character-foundation/foundation-fixture';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { usePlannerShellStore } from '@planner/state/planner-shell';

interface OriginBoardProps {
  activeStep?: 'race' | 'alignment';
}

type OriginRaceGroupKey = 'basic' | 'intermediate' | 'major' | 'minor';

interface OriginRaceGroup {
  heading: string;
  items: OptionItem[];
  key: OriginRaceGroupKey;
}

const ORIGIN_RACE_GROUPS: Array<{
  key: OriginRaceGroupKey;
  heading: string;
}> = [
  { key: 'basic', heading: shellCopyEs.foundation.raceGroups.basic },
  { key: 'minor', heading: shellCopyEs.foundation.raceGroups.minorSubraces },
  {
    key: 'intermediate',
    heading: shellCopyEs.foundation.raceGroups.intermediateSubraces,
  },
  { key: 'major', heading: shellCopyEs.foundation.raceGroups.majorSubraces },
];

const RACE_SOURCE_ROWS_BY_ID = new Map(
  phase03FoundationFixture.races.map((race) => [race.id, race.sourceRow]),
);

function getOriginRaceGroupKey(sourceRow: number): OriginRaceGroupKey {
  if (sourceRow >= 240) return 'major';
  if (sourceRow >= 220) return 'intermediate';
  if (sourceRow >= 160) return 'minor';
  return 'basic';
}

function groupOriginRaceItems(items: OptionItem[]): OriginRaceGroup[] {
  const groups = new Map<OriginRaceGroupKey, OriginRaceGroup>(
    ORIGIN_RACE_GROUPS.map((group) => [
      group.key,
      { heading: group.heading, items: [], key: group.key },
    ]),
  );

  for (const item of items) {
    const sourceRow = RACE_SOURCE_ROWS_BY_ID.get(item.id as CanonicalId);
    const groupKey =
      sourceRow === undefined ? 'minor' : getOriginRaceGroupKey(sourceRow);
    groups.get(groupKey)?.items.push(item);
  }

  return ORIGIN_RACE_GROUPS.map((group) => groups.get(group.key)).filter(
    (group): group is OriginRaceGroup => Boolean(group && group.items.length > 0),
  );
}

export function OriginBoard({ activeStep = 'race' }: OriginBoardProps) {
  const foundationState = useCharacterFoundationStore();
  const foundationValidation = selectFoundationValidation(foundationState);
  const originOptions = selectOriginOptions(foundationState);
  const setAlignment = useCharacterFoundationStore((state) => state.setAlignment);
  const setRace = useCharacterFoundationStore((state) => state.setRace);
  const setSubrace = useCharacterFoundationStore((state) => state.setSubrace);
  const setActiveOriginStep = usePlannerShellStore((state) => state.setActiveOriginStep);

  const stepConfig = {
    race: {
      title: shellCopyEs.stepper.stepTitles.race,
      options: originOptions.races,
      onSelect: (id: CanonicalId | null) => setRace(id),
      nextStep: 'alignment' as const,
      issue: foundationValidation.controlMessages.race,
      issueStatus: foundationValidation.controlStatuses.race,
    },
    alignment: {
      title: shellCopyEs.stepper.stepTitles.alignment,
      options: originOptions.alignments,
      onSelect: (id: CanonicalId | null) => setAlignment(id),
      nextStep: 'attributes' as const,
      issue: foundationValidation.controlMessages.alignment,
      issueStatus: foundationValidation.controlStatuses.alignment,
    },
  };

  const config = stepConfig[activeStep];
  const selectedOption = config.options.find((o) => o.selected);

  const selectedRaceDescription =
    activeStep === 'race' && selectedOption
      ? phase03FoundationFixture.races.find((r) => r.id === selectedOption.id)
          ?.description ?? null
      : null;
  const selectedSubrace =
    activeStep === 'race' && foundationState.subraceId
      ? phase03FoundationFixture.subraces.find(
          (s) => s.id === foundationState.subraceId,
        ) ?? null
      : null;

  const items: OptionItem[] = config.options.map((o) => ({
    blocked: o.blocked,
    disabled: o.disabled,
    id: o.id,
    label: o.label,
    selected: o.selected,
  }));

  const hasSubraces = activeStep === 'race' && originOptions.subraces.length > 0;

  return (
    <SelectionScreen
      title={config.title}
      actionBar={
        <ActionBar
          acceptDisabled={!selectedOption}
          acceptLabel="Aceptar"
          cancelLabel="Cancelar"
          onAccept={() => setActiveOriginStep(config.nextStep)}
          onCancel={() => config.onSelect(null)}
        />
      }
    >
      {activeStep === 'race' ? (
        <OriginRacePicker
          items={items}
          onSelect={(id) => config.onSelect(id as CanonicalId)}
        />
      ) : (
        <OptionList
          items={items}
          onSelect={(id) => config.onSelect(id as CanonicalId)}
        />
      )}
      <DetailPanel
        title={
          selectedSubrace && selectedOption
            ? `${selectedOption.label} · ${selectedSubrace.label}`
            : selectedOption?.label
        }
        body={
          config.issue
            ? config.issue
            : selectedSubrace?.description
              ? selectedSubrace.description
              : selectedRaceDescription
              ? selectedRaceDescription
              : selectedOption
                ? `${selectedOption.label} seleccionado.`
                : 'Selecciona una opcion para ver su descripcion.'
        }
      >
        {hasSubraces && (
          <div className="origin-subraces">
            <h4>{shellCopyEs.foundation.steps.subrace}</h4>
            <OptionList
              items={originOptions.subraces.map((s) => ({
                blocked: s.blocked,
                disabled: s.disabled,
                id: s.id,
                label: s.label,
                selected: s.selected,
              }))}
              onSelect={(id) => setSubrace(id as CanonicalId)}
            />
          </div>
        )}
      </DetailPanel>
    </SelectionScreen>
  );
}

interface OriginRacePickerProps {
  items: OptionItem[];
  onSelect: (id: string) => void;
}

function OriginRacePicker({ items, onSelect }: OriginRacePickerProps) {
  const groups = groupOriginRaceItems(items);

  return (
    <div
      aria-label={shellCopyEs.foundation.steps.race}
      className="origin-race-picker"
      role="listbox"
    >
      {groups.map((group) => {
        const headingId = `origin-race-picker-${group.key}`;

        return (
          <div
            aria-labelledby={headingId}
            className="origin-race-picker__group"
            key={group.key}
            role="group"
          >
            <h3 className="origin-race-picker__heading" id={headingId}>
              {group.heading}
            </h3>
            <div className="origin-race-picker__items">
              {group.items.map((item) => (
                <button
                  aria-disabled={item.disabled || undefined}
                  aria-selected={item.selected || undefined}
                  className={`option-list__item${
                    item.selected ? ' is-selected' : ''
                  }${item.blocked ? ' is-blocked' : ''}`}
                  disabled={item.disabled}
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  role="option"
                  type="button"
                >
                  <span className="option-list__label">{item.label}</span>
                  {item.secondary && (
                    <span className="option-list__secondary">
                      {item.secondary}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
