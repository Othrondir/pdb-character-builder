import { shellCopyEs } from '@planner/lib/copy/es';
import { SelectionScreen } from '@planner/components/ui/selection-screen';
import { DetailPanel } from '@planner/components/ui/detail-panel';
import { NwnButton } from '@planner/components/ui/nwn-button';
import { ActionBar } from '@planner/components/ui/action-bar';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import { canIncrementAttribute } from '@rules-engine/foundation/ability-budget';
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
    attributeRules: { costByScore, maximum, minimum },
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
          const baseValue = foundationState.baseAttributes[key];
          // UAT-2026-04-20 A2 — fold racial ability adjustments into the
          // visible total. `racialModifiers` is populated by the store lookup
          // against `compiledRaceCatalog.races[*].abilityAdjustments` (Phase
          // 12.2-02) and stays null until the user picks a race.
          const racialDelta = foundationState.racialModifiers?.[key] ?? 0;
          const totalValue = baseValue + racialDelta;
          const racialLabel =
            racialDelta === 0
              ? null
              : racialDelta > 0
                ? `+${racialDelta}`
                : `${racialDelta}`;
          return (
            <div className="attributes-editor__row" key={key}>
              <span className="attributes-editor__label">
                {ATTRIBUTE_LABELS[key]}
              </span>
              <div className="attributes-editor__cell attributes-editor__cell--base">
                <NwnButton
                  aria-label={`Reducir ${ATTRIBUTE_LABELS[key]}`}
                  disabled={baseValue <= minimum}
                  onClick={() => setBaseAttribute(key, baseValue - 1)}
                  variant="secondary"
                >
                  -
                </NwnButton>
                <span className="attributes-editor__value">{baseValue}</span>
                <NwnButton
                  aria-label={`Aumentar ${ATTRIBUTE_LABELS[key]}`}
                  disabled={
                    !canIncrementAttribute(
                      baseValue,
                      attributeBudget.remainingPoints,
                      costByScore,
                      maximum,
                    )
                  }
                  onClick={() => setBaseAttribute(key, baseValue + 1)}
                  variant="secondary"
                >
                  +
                </NwnButton>
              </div>
              {racialLabel ? (
                <span
                  aria-label={`Bonificador racial de ${ATTRIBUTE_LABELS[key]}`}
                  className={`attributes-editor__racial${
                    racialDelta > 0
                      ? ' attributes-editor__racial--positive'
                      : ' attributes-editor__racial--negative'
                  }`}
                >
                  {racialLabel}
                </span>
              ) : (
                <span className="attributes-editor__racial attributes-editor__racial--none">·</span>
              )}
              <span
                aria-label={`Total de ${ATTRIBUTE_LABELS[key]}`}
                className="attributes-editor__total"
              >
                {totalValue}
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
