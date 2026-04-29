import { NwnFrame } from '@planner/components/ui/nwn-frame';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { computeFinalAttributeTotals } from '@planner/features/character-foundation/final-attributes';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { abilityModifier } from '@rules-engine/foundation';
import { computeHitPoints } from '@rules-engine/progression/compute-hit-points';
import { compiledClassCatalog } from '@planner/data/compiled-classes';
import { shellCopyEs } from '@planner/lib/copy/es';
import {
  ATTRIBUTE_KEYS,
  type AttributeKey,
} from '@planner/features/character-foundation/foundation-fixture';
import { computeTotalBab } from '@rules-engine/feats/bab-calculator';

const ATTRIBUTE_LABELS: Record<AttributeKey, string> = {
  str: 'Fuerza',
  dex: 'Destreza',
  con: 'Constitucion',
  int: 'Inteligencia',
  wis: 'Sabiduria',
  cha: 'Carisma',
};

const DERIVED_STAT_LABELS = {
  ac: 'CA',
  hp: 'PG',
  bab: 'BAB',
  attacksPerRound: 'Ataques/asalto',
  fortitude: 'Fortaleza',
  reflex: 'Reflejos',
  will: 'Voluntad',
} as const;

// Phase 14-05 — local `computeModifier(score)` (formerly inlined the
// magic-10 formula) deleted; all call sites below resolve to the
// canonical `abilityModifier` import from `@rules-engine/foundation`.

function formatModifier(mod: number): string {
  return mod >= 0 ? `(+${mod})` : `(${mod})`;
}

function formatSigned(value: number): string {
  return value >= 0 ? `+${value}` : String(value);
}

function buildClassLevels(
  levels: ReturnType<typeof useLevelProgressionStore.getState>['levels'],
): Record<string, number> {
  const classLevels: Record<string, number> = {};

  for (const level of levels) {
    if (!level.classId) {
      continue;
    }
    classLevels[level.classId] = (classLevels[level.classId] ?? 0) + 1;
  }

  return classLevels;
}

function formatAttackSequence(bab: number): string {
  const attacks = [bab];
  for (let attack = bab - 5; attack >= 1; attack -= 5) {
    attacks.push(attack);
  }

  return attacks.map(formatSigned).join(' / ');
}

function StatsPanel() {
  const foundationState = useCharacterFoundationStore();
  const progressionState = useLevelProgressionStore();
  const finalAttributes = computeFinalAttributeTotals(
    foundationState.baseAttributes,
    foundationState.racialModifiers,
    progressionState.levels,
  );
  const conModifier = abilityModifier(finalAttributes.con);
  const hitPoints = computeHitPoints(
    progressionState.levels,
    compiledClassCatalog,
    conModifier,
  );
  const hitPointsDisplay = hitPoints > 0 ? String(hitPoints) : '--';
  const classLevels = buildClassLevels(progressionState.levels);
  const hasAnyClass = Object.keys(classLevels).length > 0;
  const bab = hasAnyClass
    ? computeTotalBab(classLevels, compiledClassCatalog)
    : null;
  const babDisplay = bab === null ? '--' : formatSigned(bab);
  const attacksDisplay = bab === null ? '--' : formatAttackSequence(bab);

  return (
    <div>
      <div className="character-sheet__portrait" />

      <dl className="character-sheet__stat-grid">
        {ATTRIBUTE_KEYS.map((key) => {
          const value = finalAttributes[key];
          const mod = abilityModifier(value);
          return (
            <div key={key}>
              <dt>{ATTRIBUTE_LABELS[key]}</dt>
              <dd className="stat-value">{value}</dd>
              <dd className="stat-mod">{formatModifier(mod)}</dd>
            </div>
          );
        })}
      </dl>

      <dl className="character-sheet__derived">
        <div>
          <dt>{DERIVED_STAT_LABELS.ac}</dt>
          <dd>{10 + abilityModifier(finalAttributes.dex)}</dd>
        </div>
        <div>
          <dt>{DERIVED_STAT_LABELS.hp}</dt>
          <dd>{hitPointsDisplay}</dd>
        </div>
        <div>
          <dt>{DERIVED_STAT_LABELS.bab}</dt>
          <dd>{babDisplay}</dd>
        </div>
        <div>
          <dt>{DERIVED_STAT_LABELS.attacksPerRound}</dt>
          <dd>{attacksDisplay}</dd>
        </div>
        <div>
          <dt>{DERIVED_STAT_LABELS.fortitude}</dt>
          <dd>{abilityModifier(finalAttributes.con)}</dd>
        </div>
        <div>
          <dt>{DERIVED_STAT_LABELS.reflex}</dt>
          <dd>{abilityModifier(finalAttributes.dex)}</dd>
        </div>
        <div>
          <dt>{DERIVED_STAT_LABELS.will}</dt>
          <dd>{abilityModifier(finalAttributes.wis)}</dd>
        </div>
      </dl>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="character-sheet__empty">
      <h3>{shellCopyEs.stepper.emptySheetHeading}</h3>
      <p>{shellCopyEs.stepper.emptySheetBody}</p>
    </div>
  );
}

export function CharacterSheet() {
  const foundationState = useCharacterFoundationStore();
  const hasRace = foundationState.raceId !== null;

  return (
    <NwnFrame as="aside" className="character-sheet" aria-label="Hoja de personaje">
      <div className="character-sheet__title-bar">
        <h2>{shellCopyEs.stepper.characterSheetHeading}</h2>
      </div>
      <div className="character-sheet__content">
        {hasRace ? <StatsPanel /> : <EmptyState />}
      </div>
    </NwnFrame>
  );
}
