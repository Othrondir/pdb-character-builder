import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent } from 'react';

import { shellCopyEs } from '@planner/lib/copy/es';
import type { FeatFamilyView } from './selectors';

/**
 * Phase 12.4-08 (SPEC R7 / CONTEXT D-05) — inline <fieldset> expander
 * for parameterized feat families (`Soltura con una habilidad`, etc.).
 *
 * Rendered immediately below the folded family row. NOT a modal and NOT
 * a focus-trap — user stays anchored to the feat list while picking a
 * target. Keyboard contract:
 *   - Esc closes the expander (onClose dispatched by FeatSheet).
 *   - Enter confirms the currently focused radio (native <input type="radio">
 *     fires change on Enter inside a radiogroup).
 * The fieldset auto-focuses itself on mount so Esc works without a prior
 * click on an internal element.
 */
export interface FeatFamilyExpanderProps {
  family: FeatFamilyView;
  onSelectTarget: (featId: string) => void;
  onClose: () => void;
}

export function FeatFamilyExpander({
  family,
  onSelectTarget,
  onClose,
}: FeatFamilyExpanderProps) {
  const fieldsetRef = useRef<HTMLFieldSetElement | null>(null);

  useEffect(() => {
    fieldsetRef.current?.focus();
  }, []);

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLFieldSetElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const radioGroupName = `feat-family-${family.groupKey}`;

  return (
    <fieldset
      ref={fieldsetRef}
      className="feat-family-expander"
      data-family-id={family.groupKey}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <legend className="feat-family-expander__legend">
        {shellCopyEs.feats.familyLegendPrefix} {family.paramLabel}
      </legend>
      <div className="feat-family-expander__options" role="radiogroup">
        {family.targets.map((target) => {
          const disabled = target.rowState !== 'selectable';
          const checked = target.isChosenAtLevel;
          return (
            <label
              key={target.featId}
              className={
                disabled
                  ? 'feat-family-expander__option feat-family-expander__option--blocked'
                  : 'feat-family-expander__option'
              }
            >
              <input
                type="radio"
                name={radioGroupName}
                value={target.featId}
                disabled={disabled}
                defaultChecked={checked}
                onChange={() => {
                  if (!disabled) onSelectTarget(target.featId);
                }}
              />
              <span className="feat-family-expander__option-label">
                {target.label}
              </span>
              {target.blockedReason?.pillLabel ? (
                <span className="feat-picker__pill">
                  {target.blockedReason.pillLabel}
                </span>
              ) : null}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
