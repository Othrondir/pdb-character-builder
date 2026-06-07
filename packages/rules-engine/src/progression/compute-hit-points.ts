import type { ClassCatalog } from '@data-extractor/contracts/class-catalog';

/**
 * Phase 12.3-04 (UAT B6, D-04) — pure NWN1 hit-point selector.
 *
 * Fixes UAT-FINDINGS-2026-04-18 B6 (HIGH): character sheet `PG` was
 * permanently rendered as `--`. The StatsPanel now reads this selector's
 * output against the live progression + foundation stores.
 *
 * Formula (Puerta de Baldur server convention):
 *   - Every configured level: hitDie + conModifier (max roll on every level-up).
 *   - Each configured level uses its OWN class's hit die (multiclass-aware).
 *   - Each level's contribution floors at 1 (NWN per-level minimum; prevents
 *     nonsense negative HP with very low CON).
 *   - Dureza adds +1 HP per configured level and is retroactive.
 *   - Dureza epica adds +20 HP per selected epic toughness feat.
 *
 * Empty / gapped progression handling:
 *   - Unconfigured levels (classId === null) contribute 0.
 *   - A gap before the first configured level does not change the formula; the
 *     first configured class level still uses its class hit die at maximum.
 *
 * Framework-agnostic: no React, no store reads, no browser APIs.
 *
 * Regression coverage: tests/phase-12.3/hit-points-selector.spec.ts (18 cases).
 */
export interface ProgressionLevelRecordLike {
  classId: string | null;
  level: number;
}

export function computeHitPoints(
  levels: ProgressionLevelRecordLike[],
  classCatalog: ClassCatalog,
  conModifier: number,
  selectedFeatIds: readonly string[] = [],
): number {
  const sorted = [...levels].sort((a, b) => a.level - b.level);

  let total = 0;
  let configuredLevelCount = 0;

  for (const record of sorted) {
    if (!record || record.classId === null) {
      continue;
    }

    const classEntry = classCatalog.classes.find((c) => c.id === record.classId);
    if (!classEntry) {
      continue;
    }

    const hitDie = classEntry.hitDie;
    const contribution = hitDie + conModifier;

    total += Math.max(1, contribution);
    configuredLevelCount += 1;
  }

  const featIdSet = new Set(selectedFeatIds);
  if (featIdSet.has('feat:dureza')) {
    total += configuredLevelCount;
  }

  for (const featId of featIdSet) {
    if (/^feat:feat-epic-toughness-\d+$/.test(featId)) {
      total += 20;
    }
  }

  return total;
}
