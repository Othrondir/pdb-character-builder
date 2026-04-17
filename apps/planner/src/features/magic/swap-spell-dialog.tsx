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

  const magicCopy =
    (shellCopyEs as unknown as { magic?: Record<string, string> }).magic ?? {};

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
        body={magicCopy.swapStep1Body ?? 'Selecciona el conjuro que deseas olvidar.'}
        onCancel={onClose}
        onConfirm={onClose}
        open
        title={magicCopy.swapStep1Title ?? 'Paso 1: elige el conjuro a olvidar'}
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
        body={magicCopy.swapStep2Body ?? 'Selecciona el nuevo conjuro para aprender.'}
        onCancel={onClose}
        onConfirm={onClose}
        open
        title={magicCopy.swapStep2Title ?? 'Paso 2: elige el conjuro a aprender'}
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

  const body = (
    magicCopy.swapConfirmBody ??
    'Vas a olvidar {forget} y aprender {learn} en el nivel {level}. Esta acción se registra en el nivel activo.'
  )
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
      title={magicCopy.swapSpell ?? 'Cambiar conjuro conocido'}
    />
  );
}
