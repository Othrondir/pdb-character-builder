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

type PrestigeRequirementStatus = 'met' | 'pending' | 'unmet';

interface PrestigeRequirementView {
  key: string;
  label: string;
  status: PrestigeRequirementStatus;
  statusLabel: 'Cumple' | 'Falta' | 'Pendiente' | 'Bloquea';
  valueLabel: string | null;
}

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

function requirementLabel(
  status: PrestigeRequirementStatus,
  unmetLabel: PrestigeRequirementView['statusLabel'] = 'Falta',
): PrestigeRequirementView['statusLabel'] {
  if (status === 'met') return 'Cumple';
  if (status === 'pending') return 'Pendiente';
  return unmetLabel;
}

function addRequirement(
  requirements: PrestigeRequirementView[],
  input: {
    key: string;
    label: string;
    met: boolean;
    unmetLabel?: PrestigeRequirementView['statusLabel'];
    valueLabel?: string | null;
  },
) {
  const status: PrestigeRequirementStatus = input.met ? 'met' : 'unmet';
  requirements.push({
    key: input.key,
    label: input.label,
    status,
    statusLabel: requirementLabel(status, input.unmetLabel),
    valueLabel: input.valueLabel ?? null,
  });
}

function babLabel(amount: number): string {
  return `Requiere BAB ≥ ${amount}`;
}

function skillRankLabel(amount: number, skillName: string): string {
  return amount === 1
    ? `Requiere 1 rango de ${skillName}`
    : `Requiere ${amount} rangos de ${skillName}`;
}

function featLabel(featName: string): string {
  return `Requiere dote: ${featName}`;
}

function classLevelLabel(amount: number, className: string): string {
  return amount === 1
    ? `Requiere 1 nivel de ${className}`
    : `Requiere ${amount} niveles de ${className}`;
}

function arcaneSpellLevelLabel(amount: number): string {
  return amount === 1
    ? 'Requiere lanzar 1 nivel de conjuro arcano'
    : `Requiere lanzar conjuros arcanos de nivel ${amount}`;
}

function spellLevelLabel(amount: number): string {
  return amount === 1
    ? 'Requiere lanzar 1 nivel de conjuro'
    : `Requiere lanzar conjuros de nivel ${amount}`;
}

function anyFeatGroupLabel(featNames: string[]): string {
  if (featNames.length === 0) return 'Requiere al menos una dote del grupo';
  if (featNames.length === 1) return featLabel(featNames[0] ?? '');
  return `Requiere una de estas dotes: ${featNames.join(', ')}`;
}

function anyRaceLabel(raceNames: string[]): string {
  if (raceNames.length === 0) return 'Requiere una raza específica';
  return `Requiere raza: ${raceNames.join(' o ')}`;
}

function anyClassLevelLabel(
  entries: ReadonlyArray<{ className: string; amount: number }>,
): string {
  if (entries.length === 0) return 'Requiere niveles en una clase';
  const parts = entries.map((entry) =>
    entry.amount === 1
      ? `1 nivel de ${entry.className}`
      : `${entry.amount} niveles de ${entry.className}`,
  );
  return `Requiere ${parts.join(' o ')}`;
}

function buildPrestigeRequirementViews(
  classRow: ClassPrereqInput,
  gateBuildState: PrestigeGateBuildState,
): PrestigeRequirementView[] {
  if (classRow.isBase) {
    return [];
  }

  const prereqs = classRow.decodedPrereqs;
  if (!prereqs) {
    return [
      {
        key: `${classRow.id}:unvetted`,
        label: 'Requisitos en revisión',
        status: 'pending',
        statusLabel: 'Pendiente',
        valueLabel: null,
      },
    ];
  }

  const requirements: PrestigeRequirementView[] = [];

  if (prereqs.minBab !== undefined) {
    addRequirement(requirements, {
      key: `${classRow.id}:bab`,
      label: babLabel(prereqs.minBab),
      met: gateBuildState.bab >= prereqs.minBab,
      valueLabel: `${gateBuildState.bab}/${prereqs.minBab}`,
    });
  }

  for (const req of prereqs.minSkillRanks ?? []) {
    const current = gateBuildState.skillRanks[req.skillId] ?? 0;
    addRequirement(requirements, {
      key: `${classRow.id}:skill:${req.skillId}`,
      label: skillRankLabel(req.amount, req.skillName),
      met: current >= req.amount,
      valueLabel: `${current}/${req.amount}`,
    });
  }

  for (const req of prereqs.requiredFeats ?? []) {
    addRequirement(requirements, {
      key: `${classRow.id}:feat:${req.featId}`,
      label: featLabel(req.featName),
      met: gateBuildState.featIds.has(req.featId),
      valueLabel: null,
    });
  }

  if (prereqs.minClassLevel) {
    const current = gateBuildState.classLevels[prereqs.minClassLevel.classId] ?? 0;
    addRequirement(requirements, {
      key: `${classRow.id}:class:${prereqs.minClassLevel.classId}`,
      label: classLevelLabel(
        prereqs.minClassLevel.amount,
        prereqs.minClassLevel.className,
      ),
      met: current >= prereqs.minClassLevel.amount,
      valueLabel: `${current}/${prereqs.minClassLevel.amount}`,
    });
  }

  if (prereqs.minArcaneSpellLevel !== undefined) {
    addRequirement(requirements, {
      key: `${classRow.id}:arcane-spell`,
      label: arcaneSpellLevelLabel(prereqs.minArcaneSpellLevel),
      met: gateBuildState.highestArcaneSpellLevel >= prereqs.minArcaneSpellLevel,
      valueLabel: `${gateBuildState.highestArcaneSpellLevel}/${prereqs.minArcaneSpellLevel}`,
    });
  }

  if (prereqs.minSpellLevel !== undefined) {
    requirements.push({
      key: `${classRow.id}:spell`,
      label: spellLevelLabel(prereqs.minSpellLevel),
      status: 'unmet',
      statusLabel: 'Falta',
      valueLabel: null,
    });
  }

  for (const excluded of prereqs.excludedClassIds ?? []) {
    const current = gateBuildState.classLevels[excluded.classId] ?? 0;
    addRequirement(requirements, {
      key: `${classRow.id}:excluded:${excluded.classId}`,
      label: `Incompatible con ${excluded.className}`,
      met: current <= 0,
      unmetLabel: 'Bloquea',
      valueLabel: null,
    });
  }

  prereqs.requiredAnyFeatGroups?.forEach((group, index) => {
    const featNames = group.map((feat) => feat.featName);
    addRequirement(requirements, {
      key: `${classRow.id}:any-feat:${index}`,
      label: anyFeatGroupLabel(featNames),
      met: group.some((feat) => gateBuildState.featIds.has(feat.featId)),
      valueLabel: null,
    });
  });

  if (prereqs.requiredAnyRaceIds !== undefined && prereqs.requiredAnyRaceIds.length > 0) {
    addRequirement(requirements, {
      key: `${classRow.id}:race`,
      label: anyRaceLabel(prereqs.requiredAnyRaceIds.map((race) => race.raceName)),
      met: prereqs.requiredAnyRaceIds.some(
        (race) => race.raceId === gateBuildState.raceId,
      ),
      valueLabel: null,
    });
  }

  if (
    prereqs.requiredAnyClassLevels !== undefined &&
    prereqs.requiredAnyClassLevels.length > 0
  ) {
    addRequirement(requirements, {
      key: `${classRow.id}:any-class`,
      label: anyClassLevelLabel(prereqs.requiredAnyClassLevels),
      met: prereqs.requiredAnyClassLevels.some(
        (entry) =>
          (gateBuildState.classLevels[entry.classId] ?? 0) >= entry.amount,
      ),
      valueLabel: null,
    });
  }

  return requirements;
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

  // Gate 2 — class legality (CLAS-03 bridge + strict validation). If the
  // underlying selector marks this option blocked or illegal, the row MUST be
  // aria-disabled regardless of the prestige gate verdict.
  const validationBlocked =
    option.status === 'blocked' || option.status === 'illegal';

  const disabled = validationBlocked || !gateResult.reachable;
  const prestigeRequirements = isPrestige
    ? buildPrestigeRequirementViews(classRow, gateBuildState)
    : [];

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
        {prestigeRequirements.length > 0 ? (
          <span
            aria-label="Requisitos"
            className="class-picker__requirements"
            role="list"
          >
            {prestigeRequirements.map((requirement) => (
              <span
                className={`class-picker__requirement is-${requirement.status}`}
                data-requirement-status={requirement.status}
                key={requirement.key}
                role="listitem"
              >
                <span className="class-picker__requirement-status">
                  {requirement.statusLabel}
                </span>
                <span className="class-picker__requirement-label">
                  {requirement.label}
                </span>
                {requirement.valueLabel ? (
                  <span className="class-picker__requirement-value">
                    {requirement.valueLabel}
                  </span>
                ) : null}
              </span>
            ))}
          </span>
        ) : null}
      </button>
    </li>
  );
}
