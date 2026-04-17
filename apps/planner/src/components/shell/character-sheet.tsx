import { NwnFrame } from '@planner/components/ui/nwn-frame';
import { SheetTabs } from './sheet-tabs';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import {
  selectAttributeBudgetSnapshot,
  selectFoundationSummary,
} from '@planner/features/character-foundation/selectors';
import { selectProgressionSummary } from '@planner/features/level-progression/selectors';
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

function computeModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

function formatModifier(mod: number): string {
  return mod >= 0 ? `(+${mod})` : `(${mod})`;
}

function StatsPanel() {
  const foundationState = useCharacterFoundationStore();
  const progressionState = useLevelProgressionStore();
  const budgetSnapshot = selectAttributeBudgetSnapshot(foundationState);
  const progressionSummary = selectProgressionSummary(progressionState, foundationState);

  return (
    <div role="tabpanel" id="sheet-panel-stats" aria-labelledby="sheet-tab-stats">
      <div className="character-sheet__portrait" />

      <dl className="character-sheet__stat-grid">
        {ATTRIBUTE_KEYS.map((key) => {
          const value = foundationState.baseAttributes[key];
          const mod = computeModifier(value);
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
          <dd>{10 + computeModifier(foundationState.baseAttributes.dex)}</dd>
        </div>
        <div>
          <dt>{DERIVED_STAT_LABELS.hp}</dt>
          <dd>--</dd>
        </div>
        <div>
          <dt>{DERIVED_STAT_LABELS.bab}</dt>
          <dd>{progressionSummary.highestConfiguredLevel > 0 ? progressionSummary.highestConfiguredLevel : '--'}</dd>
        </div>
        <div>
          <dt>{DERIVED_STAT_LABELS.fortitude}</dt>
          <dd>{computeModifier(foundationState.baseAttributes.con)}</dd>
        </div>
        <div>
          <dt>{DERIVED_STAT_LABELS.reflex}</dt>
          <dd>{computeModifier(foundationState.baseAttributes.dex)}</dd>
        </div>
        <div>
          <dt>{DERIVED_STAT_LABELS.will}</dt>
          <dd>{computeModifier(foundationState.baseAttributes.wis)}</dd>
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
