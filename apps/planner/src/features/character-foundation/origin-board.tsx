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
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { usePlannerShellStore } from '@planner/state/planner-shell';

interface OriginBoardProps {
  activeStep?: 'race' | 'alignment';
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
      onSelect: (id: CanonicalId) => setRace(id),
      nextStep: 'alignment' as const,
      issue: foundationValidation.controlMessages.race,
      issueStatus: foundationValidation.controlStatuses.race,
    },
    alignment: {
      title: shellCopyEs.stepper.stepTitles.alignment,
      options: originOptions.alignments,
      onSelect: (id: CanonicalId) => setAlignment(id),
      nextStep: 'attributes' as const,
      issue: foundationValidation.controlMessages.alignment,
      issueStatus: foundationValidation.controlStatuses.alignment,
    },
  };

  const config = stepConfig[activeStep];
  const selectedOption = config.options.find((o) => o.selected);

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
          onCancel={() => config.onSelect('' as CanonicalId)}
        />
      }
    >
      <OptionList
        items={items}
        onSelect={(id) => config.onSelect(id as CanonicalId)}
      />
      <DetailPanel
        title={selectedOption?.label}
        body={
          config.issue
            ? config.issue
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
