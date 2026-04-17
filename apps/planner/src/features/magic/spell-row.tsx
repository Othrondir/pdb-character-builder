import type { MouseEvent } from 'react';

import { NwnButton } from '@planner/components/ui/nwn-button';
import { shellCopyEs } from '@planner/lib/copy/es';

import type { SpellOptionView } from './selectors';

interface SpellRowProps {
  focused: boolean;
  onAdd: () => void;
  onFocus: () => void;
  onRemove: () => void;
  option: SpellOptionView;
}

/**
 * Single spell row with +/- affordance. Applies state classes
 * (is-eligible / is-selected / is-ineligible-hard) per UI-SPEC, plus
 * `is-missing-source` when the underlying spell ships an empty description.
 * Inline block reason renders below the label when present.
 */
export function SpellRow({
  focused,
  onAdd,
  onFocus,
  onRemove,
  option,
}: SpellRowProps) {
  const magicCopy =
    (shellCopyEs as unknown as { magic?: Record<string, string> }).magic ?? {};

  const stateClass = option.selected
    ? 'is-selected'
    : option.blocked
      ? 'is-ineligible-hard'
      : 'is-eligible';

  const className = `magic-sheet__row ${stateClass}${focused ? ' is-focused' : ''}${option.missingData ? ' is-missing-source' : ''}`;

  const stopAnd = (fn: () => void) => (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    fn();
  };

  return (
    <article
      aria-disabled={option.blocked && !option.selected}
      aria-selected={option.selected}
      className={className}
      onClick={onFocus}
      role="option"
    >
      <span className="magic-sheet__row-label">{option.label}</span>
      <span className="magic-sheet__row-school">{option.schoolLabel}</span>
      {option.blockReason && (
        <span className="magic-sheet__row-reason" role="status">
          {magicCopy.rejectionPrefixHard ?? 'Requiere'}: {option.blockReason}
        </span>
      )}
      {!option.selected && !option.blocked && (
        <NwnButton onClick={stopAnd(onAdd)} variant="primary">
          +
        </NwnButton>
      )}
      {option.selected && (
        <NwnButton onClick={stopAnd(onRemove)} variant="secondary">
          {magicCopy.removeFromSpellbook ?? 'Eliminar del grimorio'}
        </NwnButton>
      )}
    </article>
  );
}
