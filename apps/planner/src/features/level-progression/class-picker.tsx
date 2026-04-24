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
 * Prestige prereq enrichment is wired via planner-local overrides in
 * `prestige-prereq-data.ts` (`getPrestigeDecodedPrereqs`) — keeps the
 * rules-engine gate framework-agnostic per CLAUDE.md "Prescriptive Shape".
 * Runtime build state (bab / featIds / classLevels / skillRanks /
 * abilityScores / raceId / highestArcaneSpellLevel / highestSpellLevel) is
 * derived once per render via `buildPrestigeGateBuildState` and forwarded
 * to every row. Prestige classes without an override still fail-closed to
 * `Requisitos en revisión` (branch 3 of `reachableAtLevelN`).
 */

import type { CanonicalId } from '@rules-engine/contracts/canonical-id';
import {
  reachableAtLevelN,
  type ClassPrereqInput,
  type PrestigeGateResult,
} from '@rules-engine/progression/prestige-gate';

import { shellCopyEs } from '@planner/lib/copy/es';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useFeatStore } from '@planner/features/feats/store';
import { useSkillStore } from '@planner/features/skills/store';

import { selectClassOptionsForLevel, type ClassOptionView } from './selectors';
import { getPhase04ClassRecord } from './class-fixture';
import { openPlannerLevel } from './navigation';
import {
  buildPrestigeGateBuildState,
  type PrestigeGateBuildState,
} from './prestige-gate-build';
import { getPrestigeDecodedPrereqs } from './prestige-prereq-data';
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
// decodedPrereqs attached for prestige rows when planner-local overrides exist
// (see prestige-prereq-data.ts).
function toClassPrereqInput(option: ClassOptionView): ClassPrereqInput {
  const record = getPhase04ClassRecord(option.id);
  const isBase = (record?.kind ?? option.kind) === 'base';
  const decodedPrereqs = isBase
    ? undefined
    : getPrestigeDecodedPrereqs(option.id);
  return {
    id: option.id as string,
    isBase,
    ...(decodedPrereqs ? { decodedPrereqs } : {}),
  };
}

interface ClassPickerProps {
  level?: ProgressionLevel;
  onSelectComplete?: () => void;
}

export function ClassPicker({ level, onSelectComplete }: ClassPickerProps) {
  const progressionState = useLevelProgressionStore();
  const foundationState = useCharacterFoundationStore();
  const featState = useFeatStore();
  const skillState = useSkillStore();
  const setLevelClassId = useLevelProgressionStore(
    (state) => state.setLevelClassId,
  );

  const activeLevel = (level ?? progressionState.activeLevel) as ProgressionLevel;
  const gateBuildState = buildPrestigeGateBuildState(
    progressionState,
    foundationState,
    featState,
    skillState,
    activeLevel,
  );
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
              gateBuildState={gateBuildState}
              level={activeLevel}
              onSelect={(classId) => {
                onSelectComplete?.();
                setLevelClassId(activeLevel, classId);
                openPlannerLevel(activeLevel, 'skills');
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
              gateBuildState={gateBuildState}
              level={activeLevel}
              onSelect={(classId) => {
                onSelectComplete?.();
                setLevelClassId(activeLevel, classId);
                openPlannerLevel(activeLevel, 'skills');
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
  gateBuildState: PrestigeGateBuildState;
  level: ProgressionLevel;
  onSelect: (classId: CanonicalId) => void;
  option: ClassOptionView;
}

function ClassPickerRow({
  gateBuildState,
  level,
  onSelect,
  option,
}: ClassPickerRowProps) {
  const isPrestige = option.kind === 'prestige';

  // Gate 1 — prestige reachability (R1 / D-02). Base classes short-circuit to
  // { reachable: true }. enriched reflects whether planner-local overrides
  // supplied decodedPrereqs.
  const classRow = toClassPrereqInput(option);
  const gateResult: PrestigeGateResult = reachableAtLevelN({
    classRow,
    level,
    abilityScores: gateBuildState.abilityScores,
    bab: gateBuildState.bab,
    raceId: gateBuildState.raceId,
    skillRanks: gateBuildState.skillRanks,
    featIds: gateBuildState.featIds,
    classLevels: gateBuildState.classLevels,
    highestArcaneSpellLevel: gateBuildState.highestArcaneSpellLevel,
    highestSpellLevel: gateBuildState.highestSpellLevel,
    enriched: classRow.decodedPrereqs !== undefined,
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
