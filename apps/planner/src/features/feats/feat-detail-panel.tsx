import { DetailPanel } from '@planner/components/ui/detail-panel';
import { shellCopyEs } from '@planner/lib/copy/es';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useSkillStore } from '@planner/features/skills/store';
import { evaluateFeatPrerequisites } from '@rules-engine/feats/feat-prerequisite';
import { compiledFeatCatalog } from './compiled-feat-catalog';
import { useFeatStore } from './store';
import { computeBuildStateAtLevel, type FeatBoardView } from './selectors';

interface FeatDetailPanelProps {
  boardView: FeatBoardView;
  focusedFeatId: string | null;
}

export function FeatDetailPanel({ boardView, focusedFeatId }: FeatDetailPanelProps) {
  const featState = useFeatStore();
  const progressionState = useLevelProgressionStore();
  const foundationState = useCharacterFoundationStore();
  const skillState = useSkillStore();

  if (!focusedFeatId) {
    return (
      <DetailPanel
        title={shellCopyEs.stepper.stepTitles.feats}
        body={shellCopyEs.feats.emptyStateBody}
      />
    );
  }

  const feat = compiledFeatCatalog.feats.find((f) => f.id === focusedFeatId);

  if (!feat) {
    return (
      <DetailPanel
        title={focusedFeatId}
        body={shellCopyEs.feats.emptyStateBody}
      />
    );
  }

  const buildState = computeBuildStateAtLevel(
    boardView.activeSheet.level,
    foundationState,
    progressionState,
    skillState,
    featState,
  );

  const prereqResult = evaluateFeatPrerequisites(
    feat,
    buildState,
    compiledFeatCatalog,
  );

  return (
    <DetailPanel title={feat.label} className="feat-detail-panel">
      <div className="detail-panel__body">{feat.description}</div>
      {prereqResult.checks.length > 0 && (
        <ul className="feat-board__prereq-list" role="list">
          {prereqResult.checks.map((check, i) => (
            <li
              key={`${check.type}-${i}`}
              className={`feat-board__prereq-item ${check.met ? 'is-met' : 'is-failed'}`}
              role="listitem"
              aria-label={
                check.met
                  ? `${check.label} cumplido`
                  : `${check.label} no cumplido`
              }
            >
              {check.met ? (
                <span>
                  {check.label} {check.required} &#10003;
                </span>
              ) : (
                <span>
                  {check.label} {check.required} ({shellCopyEs.feats.prereqPrefix}{' '}
                  {check.current}) &#10007;
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </DetailPanel>
  );
}
