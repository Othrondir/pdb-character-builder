import { shellCopyEs } from '@planner/lib/copy/es';
import { SelectionScreen } from '@planner/components/ui/selection-screen';
import { DetailPanel } from '@planner/components/ui/detail-panel';
import { NwnButton } from '@planner/components/ui/nwn-button';
import { ActionBar } from '@planner/components/ui/action-bar';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import {
  ATTRIBUTE_KEYS,
  phase03FoundationFixture,
  type AttributeKey,
} from './foundation-fixture';
import {
  selectAttributeBudgetSnapshot,
  selectFoundationValidation,
} from './selectors';
import { useCharacterFoundationStore } from './store';

const ATTRIBUTE_LABELS: Record<AttributeKey, string> = {
  cha: 'Carisma',
  con: 'Constitucion',
  dex: 'Destreza',
  int: 'Inteligencia',
  str: 'Fuerza',
  wis: 'Sabiduria',
};

const ATTRIBUTE_ABBREVS: Record<AttributeKey, string> = {
  cha: 'CAR',
  con: 'CON',
  dex: 'DES',
  int: 'INT',
  str: 'FUE',
  wis: 'SAB',
};

export function AttributesBoard() {
  const foundationState = useCharacterFoundationStore();
  const attributeBudget = selectAttributeBudgetSnapshot(foundationState);
  const foundationValidation = selectFoundationValidation(foundationState);
  const resetFoundation = useCharacterFoundationStore(
    (state) => state.resetFoundation,
  );
  const setBaseAttribute = useCharacterFoundationStore(
    (state) => state.setBaseAttribute,
  );
  const setExpandedLevel = usePlannerShellStore((state) => state.setExpandedLevel);
  const setActiveLevelSubStep = usePlannerShellStore(
    (state) => state.setActiveLevelSubStep,
  );
  const {
    attributeRules: { maximum, minimum },
  } = phase03FoundationFixture;
  const canAdvance = attributeBudget.status === 'legal';

  return (
    <SelectionScreen
      title={shellCopyEs.stepper.stepTitles.attributes}
      actionBar={
        <ActionBar
          acceptDisabled={!canAdvance}
          acceptLabel="Aceptar"
          onAccept={() => {
            setExpandedLevel(1);
            setActiveLevelSubStep('class');
          }}
        />
      }
    >
      <div className="attributes-editor">
        <div className="attributes-editor__header">
          <span>{shellCopyEs.foundation.remainingPoints}: {attributeBudget.remainingPoints}</span>
        </div>
        {ATTRIBUTE_KEYS.map((key) => {
          const value = foundationState.baseAttributes[key];
          const modifier = Math.floor((value - 10) / 2);
          return (
            <div className="attributes-editor__row" key={key}>
              <span className="attributes-editor__label">
                {ATTRIBUTE_ABBREVS[key]} — {ATTRIBUTE_LABELS[key]}
              </span>
              <NwnButton
                aria-label={`Reducir ${ATTRIBUTE_LABELS[key]}`}
                disabled={value <= minimum}
                onClick={() => setBaseAttribute(key, value - 1)}
                variant="secondary"
              >
                -
              </NwnButton>
              <span className="attributes-editor__value">{value}</span>
              <NwnButton
                aria-label={`Aumentar ${ATTRIBUTE_LABELS[key]}`}
                disabled={value >= maximum}
                onClick={() => setBaseAttribute(key, value + 1)}
                variant="secondary"
              >
                +
              </NwnButton>
              <span className="attributes-editor__mod">
                ({modifier >= 0 ? '+' : ''}{modifier})
              </span>
            </div>
          );
        })}

        {foundationValidation.controlMessages.attributes ? (
          <p className={`foundation-step__issue${
            foundationValidation.controlStatuses.attributes === 'illegal' ? ' is-illegal' : ''
          }`}>
            {foundationValidation.controlMessages.attributes}
          </p>
        ) : null}

        <div className="attributes-editor__actions">
          <NwnButton onClick={resetFoundation} variant="secondary">
            Reiniciar base
          </NwnButton>
        </div>
      </div>
      <DetailPanel
        title="Caracteristicas iniciales"
        body="Ajusta la base inicial respetando el presupuesto del servidor. Los modificadores se calculan automaticamente."
      >
        <dl className="attributes-editor__summary">
          <div>
            <dt>{shellCopyEs.foundation.spentPoints}</dt>
            <dd>{attributeBudget.spentPoints}</dd>
          </div>
          <div>
            <dt>{shellCopyEs.foundation.remainingPoints}</dt>
            <dd>{attributeBudget.remainingPoints}</dd>
          </div>
        </dl>
      </DetailPanel>
    </SelectionScreen>
  );
}
