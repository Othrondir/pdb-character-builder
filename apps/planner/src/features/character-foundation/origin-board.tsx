import type { ComponentPropsWithoutRef } from 'react';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';
import { shellCopyEs } from '@planner/lib/copy/es';
import {
  selectFoundationSummary,
  selectFoundationValidation,
  selectOriginOptions,
} from '@planner/features/character-foundation/selectors';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';

const BLOCKED_CHOICE_COPY: 'Elección bloqueada: completa el paso anterior o cambia la opción marcada para continuar.' =
  shellCopyEs.foundation.blockedChoice;

interface OriginStepProps {
  emptyLabel?: string;
  hint?: string;
  issue?: string | null;
  issueStatus?: 'blocked' | 'illegal' | 'legal' | null;
  onSelect: (id: CanonicalId) => void;
  options: Array<{
    blocked: boolean;
    disabled: boolean;
    id: CanonicalId;
    label: string;
    selected: boolean;
  }>;
  title: string;
}

function OriginOptionButton({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<'button'>) {
  return (
    <button
      className={`planner-chip foundation-option${className ? ` ${className}` : ''}`}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}

function OriginStep({
  emptyLabel,
  hint,
  issue,
  issueStatus,
  onSelect,
  options,
  title,
}: OriginStepProps) {
  return (
    <section className="planner-panel planner-panel--inner foundation-step">
      <h2>{title}</h2>
      {hint ? <p className="planner-section-view__description">{hint}</p> : null}
      {issue ? (
        <p
          className={`foundation-step__issue${
            issueStatus === 'illegal' ? ' is-illegal' : ''
          }`}
        >
          {issue}
        </p>
      ) : null}
      <div className="planner-section-view__highlights">
        {options.length > 0 ? (
          options.map((option) => (
            <OriginOptionButton
              aria-pressed={option.selected}
              className={[
                option.selected ? 'is-selected' : '',
                option.blocked ? 'is-blocked' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              disabled={option.disabled}
              key={option.id}
              onClick={() => onSelect(option.id)}
            >
              {option.label}
            </OriginOptionButton>
          ))
        ) : (
          <span className="planner-chip">{emptyLabel}</span>
        )}
      </div>
    </section>
  );
}

interface OriginBoardProps {
  embedded?: boolean;
}

export function OriginBoard({ embedded = false }: OriginBoardProps) {
  const foundationState = useCharacterFoundationStore();
  const foundationSummary = selectFoundationSummary(foundationState);
  const foundationValidation = selectFoundationValidation(foundationState);
  const originOptions = selectOriginOptions(foundationState);
  const setAlignment = useCharacterFoundationStore((state) => state.setAlignment);
  const setDeity = useCharacterFoundationStore((state) => state.setDeity);
  const setRace = useCharacterFoundationStore((state) => state.setRace);
  const setSubrace = useCharacterFoundationStore((state) => state.setSubrace);

  return (
    <section
      className={`planner-section-view foundation-board section-fade${
        embedded ? ' is-embedded' : ''
      }`}
    >
      {embedded ? null : (
        <header className="planner-panel planner-panel--inner">
          <p className="planner-section-view__eyebrow">{shellCopyEs.subtitle}</p>
          <h1>{shellCopyEs.sections.build.heading}</h1>
          <p className="planner-section-view__description">
            {shellCopyEs.sections.build.description}
          </p>
        </header>
      )}

      <div className="foundation-board__layout">
        <div className="foundation-board__steps">
          <OriginStep
            issue={foundationValidation.controlMessages.race}
            issueStatus={foundationValidation.controlStatuses.race}
            onSelect={setRace}
            options={originOptions.races}
            title={shellCopyEs.foundation.steps.race}
          />
          <OriginStep
            emptyLabel="No hay subrazas disponibles para esta raza."
            hint={
              originOptions.locks.subrace
                ? shellCopyEs.foundation.stepHints.subraceLocked
                : undefined
            }
            issue={foundationValidation.controlMessages.subrace}
            issueStatus={foundationValidation.controlStatuses.subrace}
            onSelect={setSubrace}
            options={originOptions.subraces}
            title={shellCopyEs.foundation.steps.subrace}
          />
          <OriginStep
            hint={
              originOptions.locks.alignment
                ? shellCopyEs.foundation.stepHints.alignmentLocked
                : undefined
            }
            issue={foundationValidation.controlMessages.alignment}
            issueStatus={foundationValidation.controlStatuses.alignment}
            onSelect={setAlignment}
            options={originOptions.alignments}
            title={shellCopyEs.foundation.steps.alignment}
          />
          <OriginStep
            hint={
              originOptions.locks.deity
                ? shellCopyEs.foundation.stepHints.deityLocked
                : undefined
            }
            issue={foundationValidation.controlMessages.deity}
            issueStatus={foundationValidation.controlStatuses.deity}
            onSelect={setDeity}
            options={originOptions.deities}
            title={shellCopyEs.foundation.steps.deity}
          />
        </div>

        <aside className="planner-panel planner-panel--inner foundation-sheet">
          <h2>{shellCopyEs.foundation.currentStateHeading}</h2>
          <p className="planner-section-view__description">
            {shellCopyEs.foundation.currentStateBody}
          </p>

          <dl className="planner-summary__grid">
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

          {foundationValidation.summaryStatus !== 'legal' ? (
            <p
              className={`foundation-step__issue${
                foundationValidation.summaryStatus === 'illegal'
                  ? ' is-illegal'
                  : ''
              }`}
            >
              {BLOCKED_CHOICE_COPY}
            </p>
          ) : null}

          <OriginOptionButton
            aria-disabled={foundationSummary.summaryStatus !== 'legal'}
            className="planner-shell__cta"
            disabled={foundationSummary.summaryStatus !== 'legal'}
          >
            {shellCopyEs.foundation.confirmOrigin}
          </OriginOptionButton>
        </aside>
      </div>
    </section>
  );
}
