import { shellCopyEs } from '@planner/lib/copy/es';

import {
  ATTRIBUTE_KEYS,
  phase03FoundationFixture,
  type AttributeKey,
} from './foundation-fixture';
import {
  selectAttributeBudgetSnapshot,
  selectFoundationSummary,
  selectFoundationValidation,
} from './selectors';
import { useCharacterFoundationStore } from './store';

const ATTRIBUTE_LABELS: Record<AttributeKey, 'CAR' | 'CON' | 'DES' | 'FUE' | 'INT' | 'SAB'> =
  {
    cha: 'CAR',
    con: 'CON',
    dex: 'DES',
    int: 'INT',
    str: 'FUE',
    wis: 'SAB',
  };

const SPENT_POINTS_LABEL: 'Puntos gastados' = shellCopyEs.foundation.spentPoints;
const REMAINING_POINTS_LABEL: 'Puntos restantes' =
  shellCopyEs.foundation.remainingPoints;

export function AttributesBoard() {
  const foundationState = useCharacterFoundationStore();
  const attributeBudget = selectAttributeBudgetSnapshot(foundationState);
  const foundationSummary = selectFoundationSummary(foundationState);
  const foundationValidation = selectFoundationValidation(foundationState);
  const resetFoundation = useCharacterFoundationStore(
    (state) => state.resetFoundation,
  );
  const setBaseAttribute = useCharacterFoundationStore(
    (state) => state.setBaseAttribute,
  );
  const {
    attributeRules: { maximum, minimum },
  } = phase03FoundationFixture;

  return (
    <section className="planner-section-view foundation-board section-fade">
      <header className="planner-panel planner-panel--inner">
        <p className="planner-section-view__eyebrow">{shellCopyEs.subtitle}</p>
        <h1>{shellCopyEs.sections.abilities.heading}</h1>
        <p className="planner-section-view__description">
          {shellCopyEs.sections.abilities.description}
        </p>
      </header>

      <div className="foundation-board__layout">
        <div className="foundation-board__steps">
          <section className="planner-panel planner-panel--inner foundation-step attribute-budget">
            <h2>{shellCopyEs.sections.abilities.heading}</h2>
            <p className="planner-section-view__description">
              Ajusta la base inicial respetando el presupuesto del servidor.
            </p>

            {ATTRIBUTE_KEYS.map((key) => {
              const label = ATTRIBUTE_LABELS[key];
              const value = foundationState.baseAttributes[key];

              return (
                <div className="attribute-control" key={key}>
                  <div>
                    <p>{label}</p>
                    <strong>{value}</strong>
                  </div>
                  <div className="attribute-control__buttons">
                    <button
                      aria-label={`Reducir ${label}`}
                      disabled={value <= minimum}
                      onClick={() => setBaseAttribute(key, value - 1)}
                      type="button"
                    >
                      -
                    </button>
                    <button
                      aria-label={`Aumentar ${label}`}
                      disabled={value >= maximum}
                      onClick={() => setBaseAttribute(key, value + 1)}
                      type="button"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}

            <dl className="planner-summary__grid">
              <div>
                <dt>{SPENT_POINTS_LABEL}</dt>
                <dd>{attributeBudget.spentPoints}</dd>
              </div>
              <div>
                <dt>{REMAINING_POINTS_LABEL}</dt>
                <dd>{attributeBudget.remainingPoints}</dd>
              </div>
            </dl>

            {foundationValidation.controlMessages.attributes ? (
              <p
                className={`foundation-step__issue${
                  foundationValidation.controlStatuses.attributes === 'illegal'
                    ? ' is-illegal'
                    : ''
                }`}
              >
                {foundationValidation.controlMessages.attributes}
              </p>
            ) : null}

            <div className="attribute-control__buttons">
              <button
                className="planner-shell__cta"
                onClick={resetFoundation}
                title={shellCopyEs.foundation.resetBase}
                type="button"
              >
                Reiniciar base
              </button>
            </div>
          </section>
        </div>

        <aside className="planner-panel planner-panel--inner foundation-sheet">
          <h2>{shellCopyEs.foundation.currentStateHeading}</h2>
          <p className="planner-section-view__description">
            {shellCopyEs.foundation.currentStateBody}
          </p>

          <dl className="planner-summary__grid">
            <div>
              <dt>{shellCopyEs.summaryFields.character}</dt>
              <dd>{foundationSummary.characterLabel}</dd>
            </div>
            <div>
              <dt>{shellCopyEs.foundation.steps.race}</dt>
              <dd>{foundationSummary.selectedRaceLabel ?? 'Sin elegir'}</dd>
            </div>
            <div>
              <dt>{shellCopyEs.foundation.steps.subrace}</dt>
              <dd>{foundationSummary.selectedSubraceLabel ?? 'Sin elegir'}</dd>
            </div>
            <div>
              <dt>{shellCopyEs.foundation.steps.alignment}</dt>
              <dd>{foundationSummary.selectedAlignmentLabel ?? 'Sin elegir'}</dd>
            </div>
            <div>
              <dt>{shellCopyEs.foundation.steps.deity}</dt>
              <dd>{foundationSummary.selectedDeityLabel ?? 'Sin elegir'}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  );
}
