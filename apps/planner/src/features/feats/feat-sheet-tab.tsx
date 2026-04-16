import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useSkillStore } from '@planner/features/skills/store';
import { shellCopyEs } from '@planner/lib/copy/es';
import { selectFeatSheetTabView } from './selectors';
import { useFeatStore } from './store';

const SLOT_LABELS: Record<string, string> = {
  'class-bonus': 'Dote de clase',
  'general': 'Dote general',
  'auto': shellCopyEs.feats.autoGrantedLabel,
};

export function FeatSheetTab() {
  const featState = useFeatStore();
  const progressionState = useLevelProgressionStore();
  const foundationState = useCharacterFoundationStore();
  const skillState = useSkillStore();

  const sheetTabView = selectFeatSheetTabView(
    featState,
    progressionState,
    foundationState,
    skillState,
  );

  return (
    <div
      role="tabpanel"
      id="sheet-panel-feats"
      aria-labelledby="sheet-tab-feats"
      className="feat-sheet-tab"
    >
      <div className="feat-sheet-tab__header">
        <span>
          {shellCopyEs.feats.sheetTabTotal.replace(
            '{count}',
            String(sheetTabView.totalCount),
          )}
        </span>
        {sheetTabView.invalidCount > 0 && (
          <span>
            {' - '}
            {shellCopyEs.feats.sheetTabInvalid.replace(
              '{count}',
              String(sheetTabView.invalidCount),
            )}
          </span>
        )}
      </div>

      {sheetTabView.groups.map((group) => (
        <section className="feat-sheet-tab__group" key={group.level}>
          <h3>{group.heading}</h3>
          {group.feats.map((feat) => (
            <article
              key={feat.featId}
              className={`feat-sheet-tab__row is-${feat.status}${feat.auto ? ' is-auto' : ''}`}
            >
              <span className="feat-sheet-tab__label">{feat.label}</span>
              <span className="feat-sheet-tab__slot">
                {SLOT_LABELS[feat.slot] ?? feat.slot}
              </span>
              {feat.statusReason && (
                <span className="feat-sheet-tab__reason">{feat.statusReason}</span>
              )}
            </article>
          ))}
        </section>
      ))}
    </div>
  );
}
