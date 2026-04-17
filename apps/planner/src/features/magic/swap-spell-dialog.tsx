import { useState } from 'react';

import { ConfirmDialog } from '@planner/components/ui/confirm-dialog';
import { OptionList, type OptionItem } from '@planner/components/ui/option-list';
import { shellCopyEs } from '@planner/lib/copy/es';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';
import type { ProgressionLevel } from '@planner/features/level-progression/progression-fixture';

import type { SpellOptionView } from './selectors';
import { useMagicStore } from './store';

interface SwapSpellDialogProps {
  activeSpellLevel: number;
  classId: CanonicalId | null;
  /** Eligible replacement spells at activeSpellLevel — source for step 2 (learn). */
  eligibleSpells: SpellOptionView[];
  /** Currently known spells at activeSpellLevel — source for step 1 (forget). */
  knownSpells: SpellOptionView[];
  level: ProgressionLevel;
  onClose: () => void;
}

/**
 * Two-step ConfirmDialog wrapper for sorcerer/bard spell swaps (D-15). Only
 * rendered when `sheet.swapAvailable === true` at the active level — gating
 * lives in MagicSheet. The dialog persists the swap via `applySwap` on confirm
 * and then closes.
 */
export function SwapSpellDialog({
  eligibleSpells,
  knownSpells,
  level,
  onClose,
}: SwapSpellDialogProps) {
  const [forgetId, setForgetId] = useState<CanonicalId | null>(null);
  const [learnId, setLearnId] = useState<CanonicalId | null>(null);
  const applySwap = useMagicStore((s) => s.applySwap);

  const magicCopy = shellCopyEs.magic;

  // Step 1 — pick a known spell to forget.
  if (!forgetId) {
    const items: OptionItem[] = knownSpells.map((sp) => ({
      id: String(sp.spellId),
      label: sp.label,
      secondary: sp.schoolLabel,
      selected: false,
    }));

    return (
      <ConfirmDialog
        body={magicCopy.swapStep1Body}
        confirmDisabled={!forgetId}
        onCancel={onClose}
        onConfirm={() => {
          /* No-op. Row click via OptionList.onSelect sets forgetId, which advances
             to step 2 on the next render. Aceptar stays disabled until forgetId set. */
        }}
        open
        title={magicCopy.swapStep1Title}
      >
        <OptionList
          items={items}
          onSelect={(id) => setForgetId(id as CanonicalId)}
        />
      </ConfirmDialog>
    );
  }

  // Step 2 — pick a replacement from the eligible spell pool.
  if (!learnId) {
    const items: OptionItem[] = eligibleSpells
      .filter((sp) => String(sp.spellId) !== String(forgetId))
      .map((sp) => ({
        blocked: Boolean(sp.blockReason),
        disabled: Boolean(sp.blockReason),
        id: String(sp.spellId),
        label: sp.label,
        secondary: sp.schoolLabel,
      }));

    return (
      <ConfirmDialog
        body={magicCopy.swapStep2Body}
        confirmDisabled={!learnId}
        onCancel={onClose}
        onConfirm={() => {
          /* No-op. Row click sets learnId. */
        }}
        open
        title={magicCopy.swapStep2Title}
      >
        <OptionList
          items={items}
          onSelect={(id) => setLearnId(id as CanonicalId)}
        />
      </ConfirmDialog>
    );
  }

  // Step 3 — confirmation. Confirm persists the swap and closes the dialog.
  const forgetLabel =
    knownSpells.find((sp) => String(sp.spellId) === String(forgetId))?.label ??
    String(forgetId);
  const learnLabel =
    eligibleSpells.find((sp) => String(sp.spellId) === String(learnId))
      ?.label ?? String(learnId);

  const body = magicCopy.swapConfirmBody
    .replace('{forget}', forgetLabel)
    .replace('{learn}', learnLabel)
    .replace('{level}', String(level));

  return (
    <ConfirmDialog
      body={body}
      onCancel={onClose}
      onConfirm={() => {
        applySwap(level, forgetId, learnId);
        onClose();
      }}
      open
      title={magicCopy.swapSpell}
    />
  );
}
