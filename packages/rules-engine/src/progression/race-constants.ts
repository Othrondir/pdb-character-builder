import type { CanonicalId } from '../contracts/canonical-id';

/**
 * Phase 16 — D-06 Mediano Fortecor scope expansion.
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
]);

/** Skill-point bonus side: kept for per-level-budget back-compat. */
export const HUMAN_BONUS_FEAT_AT_L1 = 1;
export const HUMAN_SKILL_POINT_PER_LEVEL = 1;
