/**
 * Phase 12.6 (Plan 04, PROG-04 R6) — compact level progression row with
 * migrated expanded slot.
 *
 * Renders a single `<li>` in the 20-row scan surface. Header-only rows
 * show pills for class / feats / skills / legality plus a level number.
 * The active row's expanded slot hosts the full level editor — migrated
 * verbatim from level-sheet.tsx (Plan 04): ClassPicker + requirement rows
 * + gains + AbilityIncreaseControl.
 *
 * Performance contract (threat T-12.6-04-01..-04): non-active rows render
 * header-only — they never mount ClassPicker. That is why the expanded
 * `<div>` is conditional on `isActive`.
 *
 * Dispatch contract (12.4-09 atomic): on click we set sub-step first so
 * `setExpandedLevel` does not stomp the explicit 'class' choice via its
 * `activeLevelSubStep ?? 'class'` fallback.
 *
 * Legality source of truth: `selectLevelLegality` (see selectors.ts).
 * Precedence is locked > invalid > incomplete > legal (CONTEXT D-17).
 *
 * Pitfall 2 guard (RESEARCH.md): we do NOT add an `activeLevelSubStep ===
 * 'class'` guard inside this row — `center-content.tsx` already gates
 * mounting of BuildProgressionBoard to the `class` sub-step; a redundant
 * guard here would break Habilidades/Dotes chip navigation.
 *
 * Phase 12.7-01 (F7 R1) note: the action bar used to render as the last
 * child of the expanded slot here. It is now hoisted to
 * creation-stepper.tsx (keyed on expandedLevel, stable across sub-steps)
 * so the advance affordance stays visible on Habilidades / Dotes too.
 */

import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useFeatStore } from '@planner/features/feats/store';
import { useSkillStore } from '@planner/features/skills/store';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import { shellCopyEs } from '@planner/lib/copy/es';

import { AbilityIncreaseControl } from './ability-increase-control';
import { ClassPicker } from './class-picker';
import {
  selectActiveLevelSheetView,
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

  // Plan 04: active-sheet view powers the expanded slot. `selectActiveLevelSheetView`
  // reads `progressionState.activeLevel` internally, so the view always corresponds
  // to the currently-active level (i.e. THIS row, when `isActive`). The value is
  // computed on every render but rendered only inside the `{isActive && ...}`
  // branch below — non-active rows pay zero UI cost from it.
  const activeSheet = selectActiveLevelSheetView(progressionState, foundationState);
  const selectedAbility = activeSheet.abilityIncrease;

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
          <div>
            <h2>{activeSheet.title}</h2>
            <p className="detail-panel__body">
              {shellCopyEs.progression.levelLabel} {activeSheet.level}
            </p>
          </div>

          <ClassPicker />

          {activeSheet.repairMessage ? (
            <p className="level-sheet__repair-callout">{activeSheet.repairMessage}</p>
          ) : null}

          {activeSheet.classId ? (
            <>
              <section className="level-sheet__requirements">
                <h3>{shellCopyEs.progression.requirementsHeading}</h3>
                <div className="level-sheet__rows">
                  {activeSheet.requirementRows.length > 0 ? (
                    activeSheet.requirementRows.map((row) => (
                      <p
                        className={`foundation-step__issue is-${row.status}`}
                        key={row.label}
                      >
                        {row.label}
                      </p>
                    ))
                  ) : (
                    <p className="detail-panel__body">
                      {shellCopyEs.progression.statuses.legal}
                    </p>
                  )}
                </div>
              </section>

              <section className="level-sheet__gains">
                <h3>{shellCopyEs.progression.gainsHeading}</h3>
                <div className="level-sheet__rows">
                  {[...activeSheet.gains, ...activeSheet.choicePrompts].length > 0 ? (
                    [...activeSheet.gains, ...activeSheet.choicePrompts].map((item) => (
                      <p className="detail-panel__body" key={item}>
                        {item}
                      </p>
                    ))
                  ) : (
                    <p className="detail-panel__body">
                      {activeSheet.placeholderBody}
                    </p>
                  )}
                </div>
              </section>
            </>
          ) : (
            <div className="level-sheet__placeholder">
              <p>{activeSheet.placeholderBody}</p>
            </div>
          )}

          {activeSheet.abilityIncreaseAvailable ? (
            <section className="level-sheet__ability">
              <h3>{shellCopyEs.progression.abilityHeading}</h3>
              <p className="detail-panel__body">
                {shellCopyEs.progression.abilityHelper}
              </p>
              <AbilityIncreaseControl
                level={activeSheet.level as ProgressionLevel}
                value={selectedAbility}
              />
            </section>
          ) : null}
        </div>
      )}
    </li>
  );
}
