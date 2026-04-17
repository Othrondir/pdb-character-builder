import type { SlotStatus } from './selectors';

interface SpellLevelTabsProps {
  activeSpellLevel: number;
  onSelect: (spellLevel: number) => void;
  slotsByLevel: Record<number, SlotStatus>;
}

/**
 * Horizontal 0..9 spell-level tab list. Disabled tabs have `max === 0`.
 * Amber/red state classes are inherited from feat/.skill-sheet BEM selectors
 * per UI-SPEC (no new CSS added in this plan).
 */
export function SpellLevelTabs({
  activeSpellLevel,
  onSelect,
  slotsByLevel,
}: SpellLevelTabsProps) {
  const spellLevels = Array.from({ length: 10 }, (_, i) => i);

  return (
    <div
      aria-label="Niveles de conjuro"
      className="magic-board__level-tabs"
      role="tablist"
    >
      {spellLevels.map((lvl) => {
        const entry = slotsByLevel[lvl];
        const disabled = !entry || entry.max === 0;
        const isActive = lvl === activeSpellLevel;
        const stateClass =
          entry?.status === 'illegal'
            ? 'is-illegal'
            : entry?.status === 'repair_needed'
              ? 'is-repair-needed'
              : '';

        return (
          <button
            aria-disabled={disabled}
            aria-selected={isActive}
            className={`magic-board__level-tab${isActive ? ' is-active' : ''}${disabled ? ' is-disabled' : ''}${stateClass ? ` ${stateClass}` : ''}`}
            disabled={disabled}
            key={lvl}
            onClick={() => {
              if (!disabled) onSelect(lvl);
            }}
            role="tab"
            type="button"
          >
            <span>{`Nivel ${lvl}`}</span>
            {entry && entry.max > 0 && (
              <span className="magic-board__level-tab-counter">
                {entry.current}/{entry.max}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
