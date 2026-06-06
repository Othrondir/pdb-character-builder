import type { CanonicalId } from '@rules-engine/contracts/canonical-id';
import type {
  CompiledRace,
  CompiledSubrace,
} from '@data-extractor/contracts/race-catalog';
import {
  plannerRaceCatalog,
  plannerSubraceMechanicsById,
} from '@planner/data/race-catalog';
import { CURRENT_DATASET_ID } from '@planner/data/ruleset-version';

export const ATTRIBUTE_KEYS = [
  'str',
  'dex',
  'con',
  'int',
  'wis',
  'cha',
] as const;

export type AttributeKey = (typeof ATTRIBUTE_KEYS)[number];
export type FoundationStatus = 'blocked' | 'illegal' | 'legal';

export interface FoundationRaceOption {
  allowedAlignmentIds: CanonicalId[];
  deityPolicy: 'optional' | 'required';
  description: string;
  id: CanonicalId;
  label: string;
  racialModifiers: Record<AttributeKey, number>;
  sourceRow: number;
}

export interface FoundationSubraceOption {
  allowedAlignmentIds: CanonicalId[];
  description: string;
  id: CanonicalId;
  label: string;
  parentRaceId: CanonicalId;
  racialModifiers: Record<AttributeKey, number>;
}

export interface FoundationAlignmentOption {
  description: string;
  goodEvil: 'evil' | 'good' | 'neutral';
  id: CanonicalId;
  label: string;
  lawChaos: 'chaotic' | 'lawful' | 'neutral';
}

export interface AttributeRules {
  baseScore: number;
  budget: number;
  costByScore: Record<string, number>;
  maximum: number;
  minimum: number;
}

export interface Phase03FoundationFixture {
  alignments: FoundationAlignmentOption[];
  attributeRules: AttributeRules;
  datasetId: string;
  races: FoundationRaceOption[];
  subraces: FoundationSubraceOption[];
}

const ALL_ALIGNMENT_IDS: CanonicalId[] = [
  'alignment:lawful-good',
  'alignment:neutral-good',
  'alignment:chaotic-good',
  'alignment:lawful-neutral',
  'alignment:true-neutral',
  'alignment:chaotic-neutral',
  'alignment:lawful-evil',
  'alignment:neutral-evil',
  'alignment:chaotic-evil',
];

/**
 * Phase 12.1 Plan 02 — projection adapters that bridge the compiled-extractor
 * race catalog (`CompiledRace` / `CompiledSubrace`) to the planner's
 * `FoundationRaceOption` / `FoundationSubraceOption` shape consumed by
 * `selectOriginOptions`.
 *
 * Per plan D-01 (compiled catalog has no alignment/deity fields):
 *  - `allowedAlignmentIds` defaults to ALL_ALIGNMENT_IDS. Alignment gating
 *    for PDB-custom races is upstream in extractor overrides (tracked in
 *    12.1-CONTEXT.md deferred section).
 *  - `deityPolicy` defaults to `'optional'` — CHAR-03 was descoped v1 → v2
 *    per REQUIREMENTS.md; `'optional'` is the safe no-op default that
 *    foundation selectors already treat as "no deity required".
 */
function projectCompiledRace(compiled: CompiledRace): FoundationRaceOption {
  return {
    allowedAlignmentIds: ALL_ALIGNMENT_IDS,
    deityPolicy: 'optional',
    description: compiled.description,
    id: compiled.id as CanonicalId,
    label: compiled.label,
    racialModifiers: projectRacialModifiers(compiled.abilityAdjustments),
    sourceRow: compiled.sourceRow,
  };
}

/**
 * Phase 12.2-02 — project the compiled race's `abilityAdjustments` (a partial
 * `Record<AttributeKey, number>` per Zod schema `z.record(z.enum(...), ...)`)
 * into a dense `Record<AttributeKey, number>`, zero-filling missing keys.
 * Defensive spread keeps the planner's zustand state isolated from the Zod-
 * parsed source object.
 */
function projectRacialModifiers(
  source: Partial<Record<AttributeKey, number>>,
): Record<AttributeKey, number> {
  return ATTRIBUTE_KEYS.reduce((acc, key) => {
    acc[key] = source[key] ?? 0;
    return acc;
  }, {} as Record<AttributeKey, number>);
}

function projectCompiledSubrace(
  compiled: CompiledSubrace,
): FoundationSubraceOption {
  const mechanics = plannerSubraceMechanicsById.get(compiled.id);
  return {
    allowedAlignmentIds: ALL_ALIGNMENT_IDS,
    description: compiled.description,
    id: compiled.id as CanonicalId,
    label: compiled.label,
    parentRaceId: compiled.parentRaceId as CanonicalId,
    racialModifiers: projectRacialModifiers(
      mechanics?.abilityAdjustments ?? {},
    ),
  };
}

/**
 * Phase 12.1 Plan 02 Rule 2 auto-fix — the compiled race catalog emitted by
 * the extractor on 2026-04-17 contains duplicate IDs (e.g. `race:drow`
 * appears at rows 196 + 676). The hand-authored 3-race fixture never
 * surfaced this because those IDs were not rendered. Projecting the full
 * catalog exposes the duplicates as React-key collisions in the picker.
 *
 * Dedupe at the projection boundary (first-wins) so the UI stays safe
 * regardless of when the extractor backlog lands a canonical-ID uniqueness
 * gate. Tracked as an extractor-side follow-up in 12.1-CONTEXT.md deferred.
 */
function dedupeByCanonicalId<T extends { id: CanonicalId }>(entries: T[]): T[] {
  const seen = new Set<CanonicalId>();
  const unique: T[] = [];
  for (const entry of entries) {
    if (seen.has(entry.id)) {
      continue;
    }
    seen.add(entry.id);
    unique.push(entry);
  }
  return unique;
}

const ALIGNMENT_DESCRIPTIONS: Record<string, string> = {
  'alignment:lawful-good':
    'Legal bueno; "el cruzado":\n\nUn personaje con este alineamiento actúa como se espera o exige que actúe. Combina la obligación de enfrentarse al mal con la disciplina para combatirlo. Dice la verdad, mantiene su palabra, ayuda a los necesitados y critica con claridad las injusticias. Los personajes legales buenos detestan que los culpables queden impunes.\n\nAlhandra, un paladín que se enfrenta al mal sin piedad y protege a los inocentes, es un personaje legal bueno. Es el mejor alineamiento si deseas combinar el honor y la compasión.',
  'alignment:neutral-good':
    'Neutral bueno; "el bienhechor":\n\nUn personaje neutral bueno hace lo mejor que una persona puede hacer. Le gusta ayudar a los demás y colabora con reyes y jueces, aunque no se siente obligado a ello.\n\nJozan, un clérigo que ayuda a los demás según sus necesidades, es un personaje neutral bueno. La forma más común de referirse a este alineamiento es la de "bueno auténtico". Es el mejor alineamiento si deseas hacer el bien sin tendencia al orden o contra él.',
  'alignment:chaotic-good':
    'Caótico bueno; "el rebelde":\n\nUn personaje caótico bueno actúa según los dictámenes de su conciencia, sin preocuparse apenas de lo que los demás puedan esperar de él. Sigue su propia senda, pero es una persona amable y benévola. Cree en el bien, pero no confía en las reglas ni en las leyes.\n\nSoveliss, un explorador que ataca por sorpresa a los agentes de un barón malvado, es un personaje caótico bueno. Es el mejor alineamiento si deseas combinar un buen corazón con un espíritu libre.',
  'alignment:lawful-neutral':
    'Legal neutral; "el juez":\n\nUn personaje legal neutral actúa según los dictámenes de la ley, la tradición y su código personal. Para él, lo más importante son el orden y la organización. Puede creer en el orden personal y vivir siguiendo un código particular, o bien puede creer en un mismo orden para todos.\n\nEmber es monje y sigue su propia disciplina sin dejarse influir por las exigencias de los necesitados ni por las tentaciones del mal; es un personaje legal neutral. La forma más común de referirse a este alineamiento es la de "legal auténtico". Es el mejor alineamiento si deseas ser honorable y de confianza sin caer en el fanatismo.',
  'alignment:true-neutral':
    'Neutral auténtico; "el indeciso":\n\nUn personaje neutral auténtico hace aquello que le parece la mejor idea. No siente atracción por un bando ni por otro en términos de bien, mal, ley o caos. Este tipo de personajes piensan que el bien es mejor que el mal; al fin y al cabo, preferirían tener buenos vecinos y gobernantes antes que estar rodeados de gente malvada. Sin embargo, no se sienten inclinados a defender el bien de modo abstracto y universal.\n\nMialee, una maga dedicada a sus artes y cansada de la retórica de los debates morales, es un personaje neutral. Es el mejor alineamiento si deseas que tu personaje actúe de forma natural, sin prejuicios ni obligaciones.',
  'alignment:chaotic-neutral':
    'Caótico neutral; "el espíritu libre":\n\nUn personaje caótico neutral hace lo que se le antoja. Se trata de una persona individualista de principio a fin, que valora su libertad pero no se esfuerza por defender la de los demás. Evita la autoridad, se queja de las restricciones y desafía la tradición.\n\nDevis, un bardo que viaja ganándose la vida gracias a su ingenio, es un personaje caótico neutral. La forma más común de referirse a este alineamiento es la de "caótico auténtico". Es el mejor alineamiento si deseas que tu personaje esté realmente libre tanto de las restricciones de la sociedad como del fanatismo de los bienhechores.',
  'alignment:lawful-evil':
    'Legal maligno; "el tirano":\n\nUn villano legal maligno toma metódicamente aquello que desea, siempre dentro de los límites de su código de conducta, pero sin preocuparse de a quién pueda hacer daño. Se trata de una persona preocupada por la tradición, la lealtad y el orden, pero no por la libertad, la dignidad o la vida. Es alguien que juega según las reglas, pero sin mostrar piedad ni compasión. Algunos villanos legales malignos poseen tabúes como no matar a sangre fría, ordenar tales muertes a sus subordinados o evitar que los niños sufran daño siempre que puedan evitarlo.\n\nUn barón conspirador que expande su poder y alcanza sus logros es un ejemplo de personaje legal maligno. A veces los personajes de este alineamiento son llamados "diabólicos", pues los diablos son la personificación de lo legal maligno. Este es el alineamiento más peligroso porque representa la maldad metódica e intencionada, que a menudo tiene éxito.',
  'alignment:neutral-evil':
    'Neutral maligno; "el dominador":\n\nUn personaje neutral maligno haría lo que fuera para salir impune. Solo se preocupa por sí mismo, simple y llanamente. No derrama lágrimas por aquellos a los que mata, ya sea por sacar provecho, por deporte o por conveniencia. No siente aprecio alguno por el orden y no cree que el respeto por la ley, la tradición o un código pudiera convertirlo en una persona más noble. Por otro lado, estos personajes carecen de la naturaleza inquieta o la afición por el conflicto que caracteriza a los personajes caóticos malignos.\n\nEl criminal que roba y mata para conseguir lo que desea es un personaje neutral maligno. Este es un alineamiento muy peligroso porque representa la maldad en estado puro, sin honor ni posibilidad de cambiar.',
  'alignment:chaotic-evil':
    'Caótico maligno; "el destructor":\n\nUn personaje caótico maligno hace lo que su codicia, odio o ansia de destrucción le obliguen a hacer. Es una persona de genio violento, cruel, arbitrariamente agresiva e impredecible. Busca todo aquello que pueda conseguir, y es despiadado y brutal.\n\nEl hechicero demente cuyos objetivos son el caos y la venganza es un personaje caótico maligno. A veces los personajes de este alineamiento son llamados "demoníacos", pues los demonios son la personificación de lo caótico maligno. Este es un alineamiento muy peligroso porque representa la destrucción, no solo de la belleza y la vida, sino también del orden del que ambas dependen.',
};

export const phase03FoundationFixture: Phase03FoundationFixture = {
  alignments: [
    {
      description: ALIGNMENT_DESCRIPTIONS['alignment:lawful-good'],
      goodEvil: 'good',
      id: 'alignment:lawful-good',
      label: 'Legal bueno',
      lawChaos: 'lawful',
    },
    {
      description: ALIGNMENT_DESCRIPTIONS['alignment:neutral-good'],
      goodEvil: 'good',
      id: 'alignment:neutral-good',
      label: 'Neutral bueno',
      lawChaos: 'neutral',
    },
    {
      description: ALIGNMENT_DESCRIPTIONS['alignment:chaotic-good'],
      goodEvil: 'good',
      id: 'alignment:chaotic-good',
      label: 'Caótico bueno',
      lawChaos: 'chaotic',
    },
    {
      description: ALIGNMENT_DESCRIPTIONS['alignment:lawful-neutral'],
      goodEvil: 'neutral',
      id: 'alignment:lawful-neutral',
      label: 'Legal neutral',
      lawChaos: 'lawful',
    },
    {
      description: ALIGNMENT_DESCRIPTIONS['alignment:true-neutral'],
      goodEvil: 'neutral',
      id: 'alignment:true-neutral',
      label: 'Neutral puro',
      lawChaos: 'neutral',
    },
    {
      description: ALIGNMENT_DESCRIPTIONS['alignment:chaotic-neutral'],
      goodEvil: 'neutral',
      id: 'alignment:chaotic-neutral',
      label: 'Caótico neutral',
      lawChaos: 'chaotic',
    },
    {
      description: ALIGNMENT_DESCRIPTIONS['alignment:lawful-evil'],
      goodEvil: 'evil',
      id: 'alignment:lawful-evil',
      label: 'Legal maligno',
      lawChaos: 'lawful',
    },
    {
      description: ALIGNMENT_DESCRIPTIONS['alignment:neutral-evil'],
      goodEvil: 'evil',
      id: 'alignment:neutral-evil',
      label: 'Neutral maligno',
      lawChaos: 'neutral',
    },
    {
      description: ALIGNMENT_DESCRIPTIONS['alignment:chaotic-evil'],
      goodEvil: 'evil',
      id: 'alignment:chaotic-evil',
      label: 'Caótico maligno',
      lawChaos: 'chaotic',
    },
  ],
  // Phase 12.6 (D-09) — TEST-ONLY FIXTURE. The runtime path uses the
  // per-race snapshot via `selectAbilityBudgetRulesForRace(raceId)`
  // (apps/planner/src/features/character-foundation/selectors.ts). Do not
  // thread this uniform curve back into the runtime selector — it is
  // preserved here only so pre-12.6 unit suites (phase-03 foundation
  // validation + phase-12.3 attributes-budget-gate) continue to exercise
  // the non-null branch of calculateAbilityBudgetSnapshot without racing
  // on Plan 06's per-race data delivery.
  attributeRules: {
    baseScore: 8,
    budget: 30,
    costByScore: {
      '10': 2,
      '11': 3,
      '12': 4,
      '13': 5,
      '14': 6,
      '15': 8,
      '16': 10,
      '17': 13,
      '18': 16,
      '8': 0,
      '9': 1,
    },
    maximum: 18,
    minimum: 8,
  },
  datasetId: CURRENT_DATASET_ID,
  races: dedupeByCanonicalId(plannerRaceCatalog.races.map(projectCompiledRace)),
  subraces: dedupeByCanonicalId(
    plannerRaceCatalog.subraces.map(projectCompiledSubrace),
  ),
};
