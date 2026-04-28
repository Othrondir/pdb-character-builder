import { NwnFrame } from '@planner/components/ui/nwn-frame';
import { SheetTabs } from './sheet-tabs';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { computeFinalAttributeTotals } from '@planner/features/character-foundation/final-attributes';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import {
  selectAttributeBudgetSnapshot,
  selectFoundationSummary,
} from '@planner/features/character-foundation/selectors';
import { selectProgressionSummary } from '@planner/features/level-progression/selectors';
import { abilityModifier } from '@rules-engine/foundation';
import { computeHitPoints } from '@rules-engine/progression/compute-hit-points';
import { compiledClassCatalog } from '@planner/data/compiled-classes';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import { shellCopyEs } from '@planner/lib/copy/es';
import {
  ATTRIBUTE_KEYS,
  type AttributeKey,
} from '@planner/features/character-foundation/foundation-fixture';
import { FeatSheetTab } from '@planner/features/feats/feat-sheet-tab';

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

function StatsPanel() {
  const foundationState = useCharacterFoundationStore();
  const progressionState = useLevelProgressionStore();
  const budgetSnapshot = selectAttributeBudgetSnapshot(foundationState);
  const progressionSummary = selectProgressionSummary(progressionState, foundationState);
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

  return (
    <div role="tabpanel" id="sheet-panel-stats" aria-labelledby="sheet-tab-stats">
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
          <dd>{progressionSummary.highestConfiguredLevel > 0 ? progressionSummary.highestConfiguredLevel : '--'}</dd>
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

function SkillsPanel() {
  return (
    <div role="tabpanel" id="sheet-panel-skills" aria-labelledby="sheet-tab-skills">
      <p>Habilidades del personaje</p>
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
  const activeTab = usePlannerShellStore((state) => state.characterSheetTab);
  const foundationState = useCharacterFoundationStore();
  const hasRace = foundationState.raceId !== null;

  return (
    <NwnFrame as="aside" className="character-sheet" aria-label="Hoja de personaje">
      <div className="character-sheet__title-bar">
        <h2>{shellCopyEs.stepper.characterSheetHeading}</h2>
      </div>
      <SheetTabs />
      <div className="character-sheet__content">
        {hasRace ? (
          <>
            {activeTab === 'stats' && <StatsPanel />}
            {activeTab === 'skills' && <SkillsPanel />}
            {activeTab === 'feats' && <FeatSheetTab />}
          </>
        ) : (
          <EmptyState />
        )}
      </div>
    </NwnFrame>
  );
}
