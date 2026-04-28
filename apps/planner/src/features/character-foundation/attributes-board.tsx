import { shellCopyEs } from '@planner/lib/copy/es';
import { SelectionScreen } from '@planner/components/ui/selection-screen';
import { DetailPanel } from '@planner/components/ui/detail-panel';
import { NwnButton } from '@planner/components/ui/nwn-button';
import { ActionBar } from '@planner/components/ui/action-bar';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { compiledRaceCatalog } from '@planner/data/compiled-races';
import { canIncrementAttribute } from '@rules-engine/foundation/ability-budget';
import { abilityModifier } from '@rules-engine/foundation';
import {
  ATTRIBUTE_KEYS,
  type AttributeKey,
} from './foundation-fixture';
import {
  selectAbilityBudgetRulesForRace,
  selectAttributeBudgetSnapshot,
  selectFoundationValidation,
} from './selectors';
import { computeFinalAttributeTotals } from './final-attributes';
import { useCharacterFoundationStore } from './store';

const ATTRIBUTE_LABELS: Record<AttributeKey, string> = {
  cha: 'Carisma',
  con: 'Constitucion',
  dex: 'Destreza',
  int: 'Inteligencia',
  str: 'Fuerza',
  wis: 'Sabiduria',
};

// Phase 12.6 (D-07, ATTR-01 R3) — fall-back numbers used only when the
// per-race point-buy curve is null (fail-closed state). All interactive
// controls are disabled via isBlockedForMissingCurve in that branch, so
// these values never drive a live calculation — they only prevent
// destructure-crashes on read.
const FAIL_CLOSED_CURVE_FALLBACK = {
  costByScore: {} as Record<string, number>,
  maximum: 8,
  minimum: 8,
} as const;

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
  const progressionLevels = useLevelProgressionStore((state) => state.levels);

  // Phase 12.6 (D-06, D-07) — per-race point-buy curve resolution. Null →
  // the fail-closed branch in calculateAbilityBudgetSnapshot emits
  // rule:point-buy-missing, which this component surfaces.
  const attributeRules = selectAbilityBudgetRulesForRace(foundationState.raceId);
  const isBlockedForMissingCurve =
    attributeBudget.status === 'blocked' &&
    attributeBudget.issues.some((issue) =>
      issue.affectedIds.includes('rule:point-buy-missing'),
    );

  // Race label for the fail-closed callout — falls back to '—' when raceId
  // is null (matches summaryValues.notAvailable convention).
  const raceLabel = foundationState.raceId
    ? (compiledRaceCatalog.races.find((r) => r.id === foundationState.raceId)
        ?.label ?? '—')
    : '—';

  // Pitfall 7 — destructure from either the resolved curve or the fallback
  // constants. The `+/-` buttons guard against fail-closed via
  // isBlockedForMissingCurve so these never participate in a live budget
  // calculation when the curve is missing.
  const { costByScore, maximum, minimum } =
    attributeRules ?? FAIL_CLOSED_CURVE_FALLBACK;
  const finalAttributes = computeFinalAttributeTotals(
    foundationState.baseAttributes,
    foundationState.racialModifiers,
    progressionLevels,
  );

  const canAdvance = attributeBudget.status === 'legal';

  return (
    <SelectionScreen
      title={shellCopyEs.stepper.stepTitles.attributes}
      actionBar={
        <ActionBar
          acceptDisabled={!canAdvance || isBlockedForMissingCurve}
          acceptLabel="Aceptar"
          onAccept={() => {
            setExpandedLevel(1);
            setActiveLevelSubStep('class');
          }}
        />
      }
    >
      <div className="attributes-editor" data-testid="attributes-board">
        {isBlockedForMissingCurve ? (
          <>
            <p
              className="attributes-editor__point-buy-missing foundation-step__issue is-illegal"
              data-testid="point-buy-missing-callout"
            >
              {shellCopyEs.attributes.pointBuyMissing(raceLabel)}
            </p>
            <p className="attributes-editor__point-buy-missing-body detail-panel__body">
              {shellCopyEs.attributes.pointBuyMissingBody}
            </p>
          </>
        ) : null}
        {!isBlockedForMissingCurve ? (
          <div className="attributes-editor__header">
            <span>{shellCopyEs.foundation.remainingPoints}: {attributeBudget.remainingPoints}</span>
          </div>
        ) : null}
        {ATTRIBUTE_KEYS.map((key) => {
          const baseValue = foundationState.baseAttributes[key];
          const totalValue = finalAttributes[key];
          // UAT-2026-04-20 — show D&D ability modifier alongside the
          // score. Phase 14-05: routed through the canonical
          // `abilityModifier` helper from `@rules-engine/foundation` so
          // the magic-10 baseline lives in exactly one place. Local name
          // is `mod` to avoid shadowing the imported helper.
          const mod = abilityModifier(totalValue);
          const modifierLabel = mod >= 0 ? `+${mod}` : `${mod}`;
          return (
            <div className="attributes-editor__row" key={key}>
              <span className="attributes-editor__label">
                {ATTRIBUTE_LABELS[key]}
              </span>
              <div className="attributes-editor__cell attributes-editor__cell--base">
                <NwnButton
                  aria-label={`Reducir ${ATTRIBUTE_LABELS[key]}`}
                  disabled={isBlockedForMissingCurve || baseValue <= minimum}
                  onClick={() => setBaseAttribute(key, baseValue - 1)}
                  variant="secondary"
                >
                  -
                </NwnButton>
                <span
                  aria-label={`Total de ${ATTRIBUTE_LABELS[key]}`}
                  className="attributes-editor__value"
                >
                  {totalValue}
                  <span
                    aria-label={`Modificador de ${ATTRIBUTE_LABELS[key]}`}
                    className={`attributes-editor__racial${
                      mod > 0
                        ? ' attributes-editor__racial--positive'
                        : mod < 0
                          ? ' attributes-editor__racial--negative'
                          : ' attributes-editor__racial--zero'
                    }`}
                  >
                    {modifierLabel}
                  </span>
                </span>
                <NwnButton
                  aria-label={`Aumentar ${ATTRIBUTE_LABELS[key]}`}
                  disabled={
                    isBlockedForMissingCurve ||
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
            </div>
          );
        })}

        {foundationValidation.controlMessages.attributes &&
        !isBlockedForMissingCurve ? (
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
        {!isBlockedForMissingCurve ? (
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
        ) : null}
      </DetailPanel>
    </SelectionScreen>
  );
}
