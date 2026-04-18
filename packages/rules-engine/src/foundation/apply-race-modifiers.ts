const ATTRIBUTE_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;
type AttributeKey = (typeof ATTRIBUTE_KEYS)[number];

export type BaseAttributes = Record<AttributeKey, number>;
export type RacialModifiers = Record<AttributeKey, number>;
export type FinalAttributes = Record<AttributeKey, number>;

/**
 * Phase 12.2-02 (D-02) — pure selector joining point-buy base attributes with
 * race-derived ability adjustments. Zero-fills when racial is null.
 *
 * Framework-agnostic: no React, no store reads, no browser APIs. Safe to
 * call from selectors, tests, and any future SSR/extractor context.
 */
export function applyRaceModifiers(
  base: BaseAttributes,
  racial: RacialModifiers | null,
): FinalAttributes {
  const result = {} as FinalAttributes;
  for (const key of ATTRIBUTE_KEYS) {
    result[key] = base[key] + (racial?.[key] ?? 0);
  }
  return result;
}
