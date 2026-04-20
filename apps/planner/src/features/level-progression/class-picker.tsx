/**
 * Phase 12.4-06 — ClassPicker (extracted from level-sheet.tsx L34-54).
 *
 * Renders a single scrollable picker column with two `<section>` blocks
 * (`Clases básicas` above, `Clases de prestigio` below), each with an `<h3>`
 * heading wired via `aria-labelledby` (SPEC R1 / D-01).
 *
 * Row disabled semantics drive from TWO independent surfaces:
 *   - `option.status === 'blocked'` (from `evaluateMulticlassLegality` in
 *     `selectClassOptionsForLevel`) → CLAS-03 regression bridge.
 *   - `reachableAtLevelN` (pure rules-engine helper) → prestige prereq gate
 *     (R1 / D-02). Emits `aria-disabled="true"` + inline italic reason copy
 *     from `result.blockers[0]?.label`.
 *
 * Extractor prereq enrichment for prestige is deferred to Phase 13.x
 * (CONTEXT.md <deferred>). Until then the picker passes `enriched: false`
 * so the gate fails-closed to `Requisitos en revisión` at L2+.
 */

import type { CanonicalId } from '@rules-engine/contracts/canonical-id';
import {
  reachableAtLevelN,
  type ClassPrereqInput,
  type PrestigeGateResult,
} from '@rules-engine/progression/prestige-gate';

import { shellCopyEs } from '@planner/lib/copy/es';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { usePlannerShellStore } from '@planner/state/planner-shell';

import { selectClassOptionsForLevel, type ClassOptionView } from './selectors';
import { getPhase04ClassRecord } from './class-fixture';
import type { ProgressionLevel } from './progression-fixture';
import { useLevelProgressionStore } from './store';

const STATUS_LABELS = {
  blocked: shellCopyEs.progression.statuses.blocked,
  illegal: shellCopyEs.progression.statuses.illegal,
  legal: shellCopyEs.progression.statuses.legal,
  pending: shellCopyEs.progression.statuses.pending,
} as const;

// Boundary adapter — translate the planner's class-fixture record into the
// minimal `ClassPrereqInput` the rules-engine helper expects. Keeps the gate
// framework-agnostic (no @data-extractor, no CompiledClass imports).
function toClassPrereqInput(option: ClassOptionView): ClassPrereqInput {
  const record = getPhase04ClassRecord(option.id);
  return {
    id: option.id as string,
    isBase: (record?.kind ?? option.kind) === 'base',
    // decodedPrereqs: extractor enrichment deferred to Phase 13.x. While
    // absent, callers pass `enriched: false` below so the gate fails-closed.
  };
}

export function ClassPicker() {
  const progressionState = useLevelProgressionStore();
  const foundationState = useCharacterFoundationStore();
  const setLevelClassId = useLevelProgressionStore(
    (state) => state.setLevelClassId,
  );
  // UAT-2026-04-20 P2 — after the user commits a class for the active
  // level, auto-advance the sub-step pointer to 'skills' so the planner
  // mirrors the NWN2DB flow. No-op for re-clicks on the same class.
  const setActiveLevelSubStep = usePlannerShellStore(
    (state) => state.setActiveLevelSubStep,
  );

  const activeLevel = progressionState.activeLevel as ProgressionLevel;
  const options = selectClassOptionsForLevel(
    progressionState,
    foundationState,
    activeLevel,
  );
  const baseOptions = options.filter((option) => option.kind === 'base');
  const prestigeOptions = options.filter((option) => option.kind === 'prestige');

  const baseHeadingId = 'class-picker__basic';
  const prestigeHeadingId = 'class-picker__prestige';

  return (
    <section className="class-picker">
      <section aria-labelledby={baseHeadingId}>
        <h3 id={baseHeadingId} className="class-picker__section-heading">
          {shellCopyEs.progression.classSectionBase}
        </h3>
        <ul className="class-picker__list">
          {baseOptions.map((option) => (
            <ClassPickerRow
              key={option.id}
              level={activeLevel}
              onSelect={(classId) => {
                setLevelClassId(activeLevel, classId);
                setActiveLevelSubStep('skills');
              }}
              option={option}
            />
          ))}
        </ul>
      </section>
      <section aria-labelledby={prestigeHeadingId}>
        <h3 id={prestigeHeadingId} className="class-picker__section-heading">
          {shellCopyEs.progression.classSectionPrestige}
        </h3>
        <ul className="class-picker__list">
          {prestigeOptions.map((option) => (
            <ClassPickerRow
              key={option.id}
              level={activeLevel}
              onSelect={(classId) => {
                setLevelClassId(activeLevel, classId);
                setActiveLevelSubStep('skills');
              }}
              option={option}
            />
          ))}
        </ul>
      </section>
    </section>
  );
}

interface ClassPickerRowProps {
  level: ProgressionLevel;
  onSelect: (classId: CanonicalId) => void;
  option: ClassOptionView;
}

function ClassPickerRow({ level, onSelect, option }: ClassPickerRowProps) {
  const isPrestige = option.kind === 'prestige';

  // Gate 1 — prestige reachability (R1 / D-02). Base classes short-circuit to
  // { reachable: true }. Enrichment is deferred (Phase 13.x); we always pass
  // `enriched: false` for prestige so the L2+ branch fails-closed to
  // 'Requisitos en revisión'. The L1 branch overrides with
  // 'Disponible a partir del nivel 2' regardless of enrichment.
  const gateResult: PrestigeGateResult = reachableAtLevelN({
    classRow: toClassPrereqInput(option),
    level,
    abilityScores: {},
    bab: 0,
    skillRanks: {},
    featIds: new Set<string>(),
    classLevels: {},
    enriched: false,
  });

  // Gate 2 — multiclass legality (CLAS-03 bridge). If the underlying selector
  // marks this option blocked via evaluateMulticlassLegality, the row MUST be
  // aria-disabled regardless of the prestige gate verdict.
  const multiclassBlocked = option.status === 'blocked';

  const disabled = multiclassBlocked || !gateResult.reachable;
  const prestigeReasonLabel = isPrestige ? gateResult.blockers[0]?.label : null;

  const rowClass = [
    'class-picker__row',
    `is-${option.status}`,
    disabled ? 'class-picker__row--blocked' : null,
    option.selected ? 'class-picker__row--active is-selected' : null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <li>
      <button
        aria-disabled={disabled ? 'true' : 'false'}
        aria-label={`${option.label} ${STATUS_LABELS[option.status]}`}
        aria-pressed={option.selected}
        className={rowClass}
        data-class-id={option.id}
        disabled={disabled}
        onClick={disabled ? undefined : () => onSelect(option.id)}
        type="button"
      >
        <span className="class-picker__label">{option.label}</span>
        {prestigeReasonLabel ? (
          <em className="class-picker__reason">{prestigeReasonLabel}</em>
        ) : null}
      </button>
    </li>
  );
}
