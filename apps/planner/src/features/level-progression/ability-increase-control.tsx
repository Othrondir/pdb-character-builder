import { ATTRIBUTE_KEYS, type AttributeKey } from '@planner/features/character-foundation/foundation-fixture';

import type { ProgressionLevel } from './progression-fixture';
import { useLevelProgressionStore } from './store';

const ATTRIBUTE_LABELS: Record<AttributeKey, 'CAR' | 'CON' | 'DES' | 'FUE' | 'INT' | 'SAB'> =
  {
    cha: 'CAR',
    con: 'CON',
    dex: 'DES',
    int: 'INT',
    str: 'FUE',
    wis: 'SAB',
  };

interface AbilityIncreaseControlProps {
  level: ProgressionLevel;
  value: AttributeKey | null;
}

export function AbilityIncreaseControl({
  level,
  value,
}: AbilityIncreaseControlProps) {
  const setLevelAbilityIncrease = useLevelProgressionStore(
    (state) => state.setLevelAbilityIncrease,
  );

  return (
    <div className="ability-increase-control">
      {ATTRIBUTE_KEYS.map((key) => (
        <button
          aria-pressed={value === key}
          className={`ability-increase-control__button${value === key ? ' is-selected' : ''}`}
          key={key}
          onClick={() => setLevelAbilityIncrease(level, key)}
          type="button"
        >
          {ATTRIBUTE_LABELS[key]}
        </button>
      ))}
    </div>
  );
}
