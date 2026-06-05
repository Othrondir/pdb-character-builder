import type { CanonicalId } from '../contracts/canonical-id';

/**
 * Phase 16 — D-06 and quick 260606-g7h race-bonus scope expansions.
 * Races whose canon Puerta description includes
 * "Aprendizaje rápido: Ganan 1 dote adicional a 1.er nivel".
 *
 * Locked allowlist (RESEARCH § Anti-Patterns): do NOT auto-promote any race
 * whose description merely contains the marker. Vanilla NWN1 Halfling does
 * NOT grant a bonus feat at L1; this is the explicit Puerta-canon allowlist.
 */
export const HUMAN_RACE_ID = 'race:human' as const;

export const RACE_L1_BONUS_FEATS: ReadonlySet<string> = new Set<CanonicalId>([
  'race:human' as CanonicalId,
  'race:mediano-fortecor' as CanonicalId,
  'race:ogro-hechicero' as CanonicalId,
]);

/** Skill-point bonus side: kept for per-level-budget back-compat. */
export const HUMAN_BONUS_FEAT_AT_L1 = 1;
export const HUMAN_SKILL_POINT_PER_LEVEL = 1;

export interface RaceSkillPointBonus {
  firstLevel: number;
  laterLevels: number;
}

const NO_RACE_SKILL_POINT_BONUS: RaceSkillPointBonus = {
  firstLevel: 0,
  laterLevels: 0,
};

/**
 * Races with sourced skill-point bonuses.
 *
 * Humano and Semielfo receive +4 at level 1 and +1 on later levels.
 * Oni (`race:ogro-hechicero`) receives the Habilidoso +4 only at level 1.
 */
export const RACE_SKILL_POINT_BONUSES: ReadonlyMap<
  string,
  RaceSkillPointBonus
> = new Map<string, RaceSkillPointBonus>([
  [
    HUMAN_RACE_ID,
    {
      firstLevel: 4,
      laterLevels: HUMAN_SKILL_POINT_PER_LEVEL,
    },
  ],
  [
    'race:halfelf',
    {
      firstLevel: 4,
      laterLevels: HUMAN_SKILL_POINT_PER_LEVEL,
    },
  ],
  [
    'race:ogro-hechicero',
    {
      firstLevel: 4,
      laterLevels: 0,
    },
  ],
]);

export function getRaceSkillPointBonus(
  raceId: string | null | undefined,
): RaceSkillPointBonus {
  if (raceId == null) {
    return NO_RACE_SKILL_POINT_BONUS;
  }

  return RACE_SKILL_POINT_BONUSES.get(raceId) ?? NO_RACE_SKILL_POINT_BONUS;
}
