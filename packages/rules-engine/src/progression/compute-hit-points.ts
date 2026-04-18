import type { ClassCatalog } from '@data-extractor/contracts/class-catalog';

/**
 * Phase 12.3-04 (UAT B6, D-04) — pure NWN1 hit-point selector.
 *
 * Fixes UAT-FINDINGS-2026-04-18 B6 (HIGH): character sheet `PG` was
 * permanently rendered as `--`. The StatsPanel now reads this selector's
 * output against the live progression + foundation stores.
 *
 * Formula (Puerta de Baldur server convention, matching NWN1 Aurora):
 *   - First configured level: hitDie + conModifier (max roll — L1 convention).
 *   - Every subsequent configured level: floor(hitDie / 2) + 1 + conModifier
 *     (average roll rounded up — server rule, no random per-level rolls).
 *   - Each configured level uses its OWN class's hit die (multiclass-aware).
 *   - Each level's contribution floors at 1 (NWN per-level minimum; prevents
 *     nonsense negative HP with very low CON).
 *
 * Empty / gapped progression handling:
 *   - Unconfigured levels (classId === null) contribute 0.
 *   - A gap before the first configured level does NOT preserve the max-roll
 *     for that level — the L2+ formula applies once we're past position 1 in
 *     the ordinal progression. This matches how progression-revalidation
 *     treats inheritance from upstream configured levels.
 *
 * Framework-agnostic: no React, no store reads, no browser APIs.
 *
 * Regression coverage: tests/phase-12.3/hit-points-selector.spec.ts (15 cases).
 */
export interface ProgressionLevelRecordLike {
  classId: string | null;
  level: number;
}

export function computeHitPoints(
  levels: ProgressionLevelRecordLike[],
  classCatalog: ClassCatalog,
  conModifier: number,
): number {
  const sorted = [...levels].sort((a, b) => a.level - b.level);

  let total = 0;

  for (let index = 0; index < sorted.length; index += 1) {
    const record = sorted[index];
    if (!record || record.classId === null) {
      continue;
    }

    const classEntry = classCatalog.classes.find((c) => c.id === record.classId);
    if (!classEntry) {
      continue;
    }

    const hitDie = classEntry.hitDie;
    const isFirstOrdinalLevel = index === 0;
    const contribution = isFirstOrdinalLevel
      ? hitDie + conModifier
      : Math.floor(hitDie / 2) + 1 + conModifier;

    total += Math.max(1, contribution);
  }

  return total;
}
