import type { ReactNode } from 'react';

export interface OptionItem {
  blocked?: boolean;
  disabled?: boolean;
  id: string;
  label: string;
  selected?: boolean;
  secondary?: string;
}

interface OptionListProps {
  className?: string;
  items: OptionItem[];
  onSelect: (id: string) => void;
  renderItem?: (item: OptionItem) => ReactNode;
}

export function OptionList({ className, items, onSelect, renderItem }: OptionListProps) {
  return (
    <div
      className={`option-list${className ? ` ${className}` : ''}`}
      role="listbox"
    >
      {items.map((item) => (
        <button
          aria-disabled={item.disabled || undefined}
          aria-selected={item.selected || undefined}
          className={`option-list__item${
            item.selected ? ' is-selected' : ''
          }${item.blocked ? ' is-blocked' : ''}`}
          disabled={item.disabled}
          key={item.id}
          onClick={() => onSelect(item.id)}
          role="option"
          type="button"
        >
          {renderItem ? renderItem(item) : (
            <>
              <span className="option-list__label">{item.label}</span>
              {item.secondary && (
                <span className="option-list__secondary">{item.secondary}</span>
              )}
            </>
          )}
        </button>
      ))}
    </div>
  );
}
