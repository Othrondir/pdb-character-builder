/**
 * Phase 12.6 (Plan 03, PROG-04 R5) — compact level progression row.
 *
 * Renders a single `<li>` in the 20-row scan surface. Header-only in this
 * plan — pills for class / feats / skills / legality plus a level number.
 * The expanded slot is an empty placeholder here; Plan 04 migrates the
 * level-sheet.tsx contents into that div.
 *
 * Performance contract (threat T-12.6-03-03): non-active rows render
 * header-only — they never mount ClassPicker or LevelEditorActionBar.
 * That is why the expanded `<div>` is conditional on `isActive`.
 *
 * Dispatch contract (12.4-09 atomic): on click we set sub-step first so
 * `setExpandedLevel` does not stomp the explicit 'class' choice via its
 * `activeLevelSubStep ?? 'class'` fallback.
 *
 * Legality source of truth: `selectLevelLegality` (see selectors.ts).
 * Precedence is locked > invalid > incomplete > legal (CONTEXT D-17).
 */

import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useFeatStore } from '@planner/features/feats/store';
import { useSkillStore } from '@planner/features/skills/store';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import { shellCopyEs } from '@planner/lib/copy/es';

import {
  selectLevelCompletionState,
  selectLevelLegality,
  type LevelLegality,
} from './selectors';
import { useLevelProgressionStore } from './store';
import type { ProgressionLevel } from './progression-fixture';

const LEGALITY_GLYPH: Record<LevelLegality, string> = {
  legal: '\u2713', // ✓
  incomplete: '\u26A0', // ⚠
  invalid: '\u2717', // ✗
  locked: '\uD83D\uDD12', // 🔒
};

interface Props {
  level: ProgressionLevel;
}

export function LevelProgressionRow({ level }: Props) {
  const progressionState = useLevelProgressionStore();
  const foundationState = useCharacterFoundationStore();
  const featState = useFeatStore();
  const skillState = useSkillStore();

  const setActiveLevel = useLevelProgressionStore((s) => s.setActiveLevel);
  const setExpandedLevel = usePlannerShellStore((s) => s.setExpandedLevel);
  const setActiveLevelSubStep = usePlannerShellStore((s) => s.setActiveLevelSubStep);

  const legality = selectLevelLegality(
    progressionState,
    foundationState,
    featState,
    skillState,
    level,
  );
  const completion = selectLevelCompletionState(
    progressionState,
    foundationState,
    featState,
    skillState,
    level,
  );

  const isActive = progressionState.activeLevel === level;
  const isLocked = legality === 'locked';
  const classLabel = completion.classLabel;

  const feats = shellCopyEs.progression.pillTemplate.feats
    .replace('{chosen}', String(completion.featSlots.chosen))
    .replace('{slots}', String(completion.featSlots.total));
  const skills = shellCopyEs.progression.pillTemplate.skills
    .replace('{spent}', String(completion.skillPoints.spent))
    .replace('{budget}', String(completion.skillPoints.budget));

  const rowAria = isLocked
    ? shellCopyEs.progression.lockedRowAriaTemplate.replace('{N}', String(level))
    : shellCopyEs.progression.rowAriaTemplate
        .replace('{N}', String(level))
        .replace(
          '{classLabel}',
          classLabel ?? shellCopyEs.progression.pillEmpty.class,
        )
        .replace(
          '{legalityLabel}',
          shellCopyEs.progression.legalityLabels[legality],
        );

  function handleClick() {
    if (isLocked) return;
    // Atomic dispatch — 12.4-09 invariant. Sub-step FIRST so the shell
    // store's `activeLevelSubStep ?? 'class'` fallback inside
    // setExpandedLevel does not overwrite our explicit 'class' choice.
    setActiveLevelSubStep('class');
    setActiveLevel(level);
    setExpandedLevel(level);
  }

  const className = [
    'level-progression-row',
    isActive ? 'level-progression-row--expanded' : null,
    isLocked ? 'level-progression-row--locked' : null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <li
      className={className}
      data-level-row=""
      data-level={level}
      data-legality={legality}
      data-testid={`level-row-${level}`}
    >
      <button
        aria-disabled={isLocked ? 'true' : undefined}
        aria-expanded={isActive ? 'true' : 'false'}
        aria-label={rowAria}
        className="level-progression-row__header"
        disabled={isLocked}
        onClick={handleClick}
        type="button"
      >
        <strong className="level-progression-row__level">{level}</strong>
        <span className="level-row__pill level-row__pill--class" data-pill="class">
          {classLabel ?? shellCopyEs.progression.pillEmpty.class}
        </span>
        <span className="level-row__pill level-row__pill--feats" data-pill="feats">
          {feats}
        </span>
        <span className="level-row__pill level-row__pill--skills" data-pill="skills">
          {skills}
        </span>
        <span
          aria-label={shellCopyEs.progression.legalityLabels[legality]}
          className={`level-row__pill level-row__pill--legality level-row__pill--legality-${legality}`}
          data-pill="legality"
        >
          {LEGALITY_GLYPH[legality]}
        </span>
      </button>
      {isActive && (
        <div
          className="level-progression-row__expanded"
          data-testid={`level-row-${level}-expanded`}
        >
          {/* Plan 04 migrates level-sheet.tsx contents here. */}
        </div>
      )}
    </li>
  );
}
