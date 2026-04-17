// @vitest-environment node
import { describe, expect, it, beforeEach } from 'vitest';

import type { CanonicalId } from '@rules-engine/contracts/canonical-id';
import { compiledSpellCatalog } from '@planner/data/compiled-spells';
import {
  createInitialMagicState,
  useMagicStore,
} from '@planner/features/magic/store';
import { useFeatStore } from '@planner/features/feats/store';
import { useSkillStore } from '@planner/features/skills/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { selectMagicSheetTabView } from '@planner/features/magic/selectors';

describe('phase 07 selectMagicSheetTabView per-row validation (WR-02)', () => {
  beforeEach(() => {
    useMagicStore.setState(createInitialMagicState());
    useLevelProgressionStore.getState().resetProgression();
  });

  it('marks a spell with unmet prerequisites as illegal and increments invalidCount', () => {
    // Seed a cleric L1 build and then add a wizard-only spell to the cleric's
    // spellbookAdditions. The spell prerequisite evaluator will reject it
    // (cleric does not cast wizard spells at level 1), so the row must be
    // status: 'illegal' with a non-empty statusReason.
    const wizardOnlySpell = compiledSpellCatalog.spells.find(
      (s) =>
        s.classLevels['class:wizard'] != null &&
        s.classLevels['class:cleric'] == null,
    );
    expect(wizardOnlySpell).toBeDefined();

    // Seed Cleric-1 at level 1 via direct setState (same pattern as
    // paradigm-dispatch.spec.ts). If seeding silently failed, the unconditional
    // `expect(row).toBeDefined()` below would fail the test — no vacuous pass.
    useLevelProgressionStore.setState({
      ...useLevelProgressionStore.getState(),
      levels: useLevelProgressionStore.getState().levels.map((rec) =>
        rec.level === 1
          ? { ...rec, classId: 'class:cleric' as CanonicalId }
          : rec,
      ),
    });

    useMagicStore
      .getState()
      .addSpellbookEntry(1, 1, wizardOnlySpell!.id as CanonicalId);

    const view = selectMagicSheetTabView(
      useMagicStore.getState(),
      useFeatStore.getState(),
      useSkillStore.getState(),
      useLevelProgressionStore.getState(),
      useCharacterFoundationStore.getState(),
    );

    const row = view.groups
      .flatMap((g) => g.spells)
      .find((s) => s.spellId === wizardOnlySpell!.id);

    // UNCONDITIONAL assertion: row MUST exist. If the seeding or selector does
    // not produce the row, this test fails — no vacuous-pass escape hatch.
    expect(row).toBeDefined();
    expect(row!.status).not.toBe('legal');
    expect(view.invalidCount).toBeGreaterThanOrEqual(1);
  });
});
