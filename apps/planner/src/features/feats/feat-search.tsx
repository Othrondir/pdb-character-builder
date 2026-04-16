import { useMemo } from 'react';
import { OptionList, type OptionItem } from '@planner/components/ui/option-list';
import { shellCopyEs } from '@planner/lib/copy/es';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useSkillStore } from '@planner/features/skills/store';
import {
  evaluateAllFeatsForSearch,
} from '@rules-engine/feats/feat-eligibility';
import type { PrerequisiteCheck } from '@rules-engine/feats/feat-prerequisite';
import { compiledFeatCatalog } from './compiled-feat-catalog';
import { useFeatStore } from './store';
import { computeBuildStateAtLevel, type FeatBoardView } from './selectors';

interface FeatSearchProps {
  query: string;
  boardView: FeatBoardView;
  onSelectFeat: (featId: string) => void;
}

interface SearchResultItem extends OptionItem {
  failedChecks?: PrerequisiteCheck[];
}

function normalizeForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function renderSearchItem(item: OptionItem) {
  const searchItem = item as SearchResultItem;

  return (
    <>
      <span className="option-list__label">{searchItem.label}</span>
      {searchItem.blocked && searchItem.failedChecks && (
        <div className="feat-board__blocked-reason">
          {searchItem.failedChecks
            .filter((c) => !c.met)
            .map((check, i) => (
              <p key={i} className="is-failed">
                {shellCopyEs.feats.prereqPrefix} {check.label} {check.required}{' '}
                (tienes {check.current})
              </p>
            ))}
        </div>
      )}
    </>
  );
}

export function FeatSearch({ query, boardView, onSelectFeat }: FeatSearchProps) {
  const featState = useFeatStore();
  const progressionState = useLevelProgressionStore();
  const foundationState = useCharacterFoundationStore();
  const skillState = useSkillStore();

  const results = useMemo(() => {
    const normalizedQuery = normalizeForSearch(query);

    const buildState = computeBuildStateAtLevel(
      boardView.activeSheet.level,
      foundationState,
      progressionState,
      skillState,
      featState,
    );

    const allEvaluated = evaluateAllFeatsForSearch(buildState, compiledFeatCatalog);

    const matchingItems: SearchResultItem[] = [];

    for (const { feat, prereqResult } of allEvaluated) {
      const normalizedLabel = normalizeForSearch(feat.label);

      if (!normalizedLabel.includes(normalizedQuery)) {
        continue;
      }

      if (prereqResult.met) {
        matchingItems.push({
          id: feat.id,
          label: feat.label,
          secondary: feat.category,
        });
      } else {
        matchingItems.push({
          id: feat.id,
          label: feat.label,
          blocked: true,
          failedChecks: prereqResult.checks,
        });
      }
    }

    return matchingItems;
  }, [query, boardView.activeSheet.level, featState, progressionState, foundationState, skillState]);

  if (results.length === 0) {
    return <p className="detail-panel__body">{shellCopyEs.feats.noSearchResults}</p>;
  }

  return (
    <OptionList
      items={results}
      onSelect={onSelectFeat}
      renderItem={renderSearchItem}
    />
  );
}
