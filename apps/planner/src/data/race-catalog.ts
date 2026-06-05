import {
  raceCatalogSchema,
  type CompiledSubrace,
  type RaceCatalog,
} from '@data-extractor/contracts/race-catalog';

import { compiledRaceCatalog } from './compiled-races';

const CURATED_HUMAN_SUBRACES: CompiledSubrace[] = [
  {
    description: 'Subraza aplicable a personajes humanos.',
    id: 'subrace:liche',
    isDeprecated: false,
    label: 'Liche',
    parentRaceId: 'race:human',
    sourceRow: 900001,
  },
  {
    description: 'Subraza aplicable a personajes humanos.',
    id: 'subrace:licantropo',
    isDeprecated: false,
    label: 'Licántropo',
    parentRaceId: 'race:human',
    sourceRow: 900002,
  },
  {
    description: 'Subraza aplicable a personajes humanos.',
    id: 'subrace:tumulario',
    isDeprecated: false,
    label: 'Tumulario',
    parentRaceId: 'race:human',
    sourceRow: 900003,
  },
  {
    description: 'Subraza aplicable a personajes humanos.',
    id: 'subrace:vampiro',
    isDeprecated: false,
    label: 'Vampiro',
    parentRaceId: 'race:human',
    sourceRow: 900004,
  },
  {
    description: 'Subraza aplicable a personajes humanos.',
    id: 'subrace:engendro-vampirico',
    isDeprecated: false,
    label: 'Engendro vampírico',
    parentRaceId: 'race:human',
    sourceRow: 900005,
  },
];

function mergeSubraces(
  extracted: readonly CompiledSubrace[],
  curated: readonly CompiledSubrace[],
): CompiledSubrace[] {
  const byId = new Map<string, CompiledSubrace>();
  for (const subrace of extracted) {
    byId.set(subrace.id, subrace);
  }
  for (const subrace of curated) {
    byId.set(subrace.id, subrace);
  }
  return [...byId.values()];
}

export const plannerRaceCatalog: RaceCatalog = raceCatalogSchema.parse({
  ...compiledRaceCatalog,
  subraces: mergeSubraces(
    compiledRaceCatalog.subraces,
    CURATED_HUMAN_SUBRACES,
  ),
});
