import { shellCopyEs } from '@planner/lib/copy/es';
import { SelectionScreen } from '@planner/components/ui/selection-screen';
import { DetailPanel } from '@planner/components/ui/detail-panel';
import { NwnButton } from '@planner/components/ui/nwn-button';
import { ActionBar } from '@planner/components/ui/action-bar';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import { applyRaceModifiers } from '@rules-engine/foundation/apply-race-modifiers';
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

const ATTRIBUTE_ABBREVS: Record<AttributeKey, string> = {
  cha: 'CAR',
  con: 'CON',
  dex: 'DES',
  int: 'INT',
  str: 'FUE',
  wis: 'SAB',
};

/**
 * Phase 12.2-02 — format a racial adjustment as a signed string (`+2`, `-1`, `0`).
 * Returns `—` for the null case (no race selected).
 */
function formatSignedMod(value: number | null): string {
  if (value === null) return '—';
  if (value > 0) return `+${value}`;
  return `${value}`;
}

export function AttributesBoard() {
  const foundationState = useCharacterFoundationStore();
  const attributeBudget = selectAttributeBudgetSnapshot(foundationState);
  const foundationValidation = selectFoundationValidation(foundationState);
  const racialModifiers = useCharacterFoundationStore(
    (state) => state.racialModifiers,
  );
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
  const finalAttributes = applyRaceModifiers(
    foundationState.baseAttributes,
    racialModifiers,
  );

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
        <div className="attributes-editor__column-headers" aria-hidden="true">
          <span className="attributes-editor__column-headers-label" />
          <span className="attributes-editor__column-headers-cell">Base</span>
          <span className="attributes-editor__column-headers-cell">Racial</span>
          <span className="attributes-editor__column-headers-cell">Final</span>
          <span className="attributes-editor__column-headers-mod" />
        </div>
        {ATTRIBUTE_KEYS.map((key) => {
          const baseValue = foundationState.baseAttributes[key];
          const racialValue = racialModifiers ? racialModifiers[key] : null;
          const finalValue = finalAttributes[key];
          const finalMod = Math.floor((finalValue - 10) / 2);
          return (
            <div className="attributes-editor__row" key={key}>
              <span className="attributes-editor__label">
                {ATTRIBUTE_ABBREVS[key]} — {ATTRIBUTE_LABELS[key]}
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
              <span
                aria-label={`Ajuste racial de ${ATTRIBUTE_LABELS[key]}`}
                className="attributes-editor__cell attributes-editor__cell--racial"
              >
                {formatSignedMod(racialValue)}
              </span>
              <span
                aria-label={`Caracteristica final de ${ATTRIBUTE_LABELS[key]}`}
                className="attributes-editor__cell attributes-editor__cell--final"
              >
                {finalValue}
              </span>
              <span className="attributes-editor__mod">
                ({finalMod >= 0 ? '+' : ''}{finalMod})
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
