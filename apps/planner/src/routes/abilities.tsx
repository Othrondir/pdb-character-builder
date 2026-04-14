import { AttributesBoard } from '@planner/features/character-foundation/attributes-board';
import { LockedAbilitiesPanel } from '@planner/features/character-foundation/locked-abilities-panel';
import { selectOriginReadyForAbilities } from '@planner/features/character-foundation/selectors';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';

export function AbilitiesRouteView() {
  const originReadyForAbilities = useCharacterFoundationStore(
    selectOriginReadyForAbilities,
  );

  if (!originReadyForAbilities) {
    return <LockedAbilitiesPanel />;
  }

  return <AttributesBoard />;
}
