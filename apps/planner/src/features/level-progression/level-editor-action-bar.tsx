/**
 * Phase 12.4-09 — <LevelEditorActionBar> sticky footer (SPEC R2 / CONTEXT D-06).
 *
 * Single-button sticky footer rendered inside the `.level-sheet` container.
 * Label + disabled state derive from `selectLevelCompletionState` +
 * `computeAdvanceLabel` (both pure, exported from `./selectors`). Three
 * mutually-exclusive label states:
 *
 *   - `Continuar al nivel {N+1}`                (enabled) — all slots filled
 *   - `Faltan {N} dotes que asignar en este nivel` (disabled) — feat deficit
 *   - `Faltan {N} puntos de habilidad por gastar`  (disabled) — skill deficit
 *
 * Deficit priority: feat deficit > skill deficit (UI-SPEC.md R2 table).
 *
 * At L16 the component returns `null` — the planner is at its final
 * supported level and there is nothing to advance to.
 *
 * Enabled click dispatches atomically (mirrors Phase 12.3-02 LevelRail):
 *   - `useLevelProgressionStore.setActiveLevel(N+1)`
 *   - `usePlannerShellStore.setExpandedLevel(N+1)`
 *   - `usePlannerShellStore.setActiveLevelSubStep('class')`
 *
 * data-testid attributes exposed for deterministic E2E / RTL selection:
 *   - `level-editor-action-bar` on the <footer>
 *   - `advance-to-level-{N+1}` on the <button>
 */

import { NwnButton } from '@planner/components/ui/nwn-button';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useFeatStore } from '@planner/features/feats/store';
import { useSkillStore } from '@planner/features/skills/store';
import { usePlannerShellStore } from '@planner/state/planner-shell';

import {
  PROGRESSION_LEVEL_CAP,
  type ProgressionLevel,
} from './progression-fixture';
import { computeAdvanceLabel, selectLevelCompletionState } from './selectors';
import { useLevelProgressionStore } from './store';

export function LevelEditorActionBar() {
  const progressionState = useLevelProgressionStore();
  const foundationState = useCharacterFoundationStore();
  const featState = useFeatStore();
  const skillState = useSkillStore();
  const setActiveLevel = useLevelProgressionStore((s) => s.setActiveLevel);
  const setExpandedLevel = usePlannerShellStore((s) => s.setExpandedLevel);
  const setActiveLevelSubStep = usePlannerShellStore(
    (s) => s.setActiveLevelSubStep,
  );

  const level = progressionState.activeLevel as ProgressionLevel;
  // UAT-2026-04-20 P6 — terminal level lifted 16 → 20.
  if (level >= PROGRESSION_LEVEL_CAP) return null;

  const completion = selectLevelCompletionState(
    progressionState,
    foundationState,
    featState,
    skillState,
    level,
  );
  const { label, disabled } = computeAdvanceLabel(completion);
  const nextLevel = (level + 1) as ProgressionLevel;

  function handleClick() {
    if (disabled) return;
    // Atomic dispatch — mirrors Phase 12.3-02 LevelRail.onClick pattern.
    // Set sub-step BEFORE expanded-level so the shell store's
    // `activeLevelSubStep ?? 'class'` fallback inside setExpandedLevel
    // never overwrites our explicit 'class' choice.
    setActiveLevelSubStep('class');
    setActiveLevel(nextLevel);
    setExpandedLevel(nextLevel);
  }

  return (
    <footer
      className="level-editor__action-bar"
      data-testid="level-editor-action-bar"
    >
      <NwnButton
        data-testid={`advance-to-level-${nextLevel}`}
        disabled={disabled}
        onClick={handleClick}
        variant="primary"
      >
        {label}
      </NwnButton>
    </footer>
  );
}
