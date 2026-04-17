import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useSkillStore } from '@planner/features/skills/store';
import { useFeatStore } from '@planner/features/feats/store';
import { shellCopyEs } from '@planner/lib/copy/es';

import { selectMagicSheetTabView } from './selectors';
import { useMagicStore } from './store';

/**
 * Read-only magic summary tab. Mirrors apps/planner/src/features/feats/feat-sheet-tab.tsx.
 *
 * Displays the build's magic selections grouped per caster class / level with a
 * header totalling the number of spells. Derives its view via selectMagicSheetTabView
 * which filters out non-caster levels and empty caster levels automatically.
 */
const SLOT_LABELS: Record<string, string> = {
  spellbook: 'Grimorio',
  known: 'Conocido',
  'del-dominio': 'Del dominio',
  auto: 'Automático',
};

export function MagicSheetTab() {
  const magicState = useMagicStore();
  const featState = useFeatStore();
  const skillState = useSkillStore();
  const progressionState = useLevelProgressionStore();
  const foundationState = useCharacterFoundationStore();
  const sheetTabView = selectMagicSheetTabView(
    magicState,
    featState,
    skillState,
    progressionState,
    foundationState,
  );

  return (
    <div
      role="tabpanel"
      id="sheet-panel-spells"
      aria-labelledby="sheet-tab-spells"
      className="magic-sheet-tab"
    >
      <div className="magic-sheet-tab__header">
        <span>{`${sheetTabView.totalCount} conjuros`}</span>
        {sheetTabView.invalidCount > 0 && (
          <span>
            {' - '}
            {`${sheetTabView.invalidCount} ${shellCopyEs.magic.validationIllegal.toLowerCase()}`}
          </span>
        )}
      </div>
      {sheetTabView.groups.length === 0 ? (
        <p className="magic-sheet-tab__empty">
          Este personaje no lanza conjuros.
        </p>
      ) : (
        sheetTabView.groups.map((group) => (
          <section className="magic-sheet-tab__group" key={group.level}>
            <h3>{group.heading}</h3>
            {group.spells.map((spell) => (
              <article
                key={`${group.level}-${spell.spellId}`}
                className={`magic-sheet-tab__row is-${spell.status}`}
              >
                <span className="magic-sheet-tab__label">{spell.label}</span>
                <span className="magic-sheet-tab__slot">
                  {SLOT_LABELS[spell.slot] ?? spell.slot}
                </span>
                {spell.statusReason && (
                  <span className="magic-sheet-tab__reason">
                    {spell.statusReason}
                  </span>
                )}
              </article>
            ))}
          </section>
        ))
      )}
    </div>
  );
}
