import type { ClassCatalog } from '@data-extractor/contracts/class-catalog';

/**
 * BAB progression formulas per class type.
 * CRITICAL: Each class contribution is floored independently BEFORE summing (Pitfall 3).
 */
const BAB_PER_LEVEL: Record<string, (classLevel: number) => number> = {
  high: (level) => level,
  medium: (level) => Math.floor(level * 3 / 4),
  low: (level) => Math.floor(level / 2),
};

/**
 * Saving throw progression formulas per save type.
 * D&D 3.5 stacking: each class contributes independently, then sum.
 */
const SAVE_PER_LEVEL: Record<string, (classLevel: number) => number> = {
  high: (level) => 2 + Math.floor(level / 2),
  low: (level) => Math.floor(level / 3),
};

/**
 * Compute total BAB from multiclass progression.
 * Sums floored per-class contributions (NWN1 engine behavior).
 */
export function computeTotalBab(
  classLevels: Record<string, number>,
  classCatalog: ClassCatalog,
): number {
  let totalBab = 0;

  for (const [classId, level] of Object.entries(classLevels)) {
    const classDef = classCatalog.classes.find((c) => c.id === classId);

    if (!classDef) {
      continue;
    }

    const babFn = BAB_PER_LEVEL[classDef.attackBonusProgression];

    if (babFn) {
      totalBab += babFn(level);
    }
  }

  return totalBab;
}

/**
 * Compute fortitude save from multiclass progression.
 * Sums per-class fortitude contributions using D&D 3.5 save progression.
 */
export function computeFortSave(
  classLevels: Record<string, number>,
  classCatalog: ClassCatalog,
): number {
  let total = 0;

  for (const [classId, level] of Object.entries(classLevels)) {
    const classDef = classCatalog.classes.find((c) => c.id === classId);

    if (!classDef) {
      continue;
    }

    const saveFn = SAVE_PER_LEVEL[classDef.savingThrows.fortitude];

    if (saveFn) {
      total += saveFn(level);
    }
  }

  return total;
}

/**
 * Compute reflex save from multiclass progression.
 */
export function computeRefSave(
  classLevels: Record<string, number>,
  classCatalog: ClassCatalog,
): number {
  let total = 0;

  for (const [classId, level] of Object.entries(classLevels)) {
    const classDef = classCatalog.classes.find((c) => c.id === classId);

    if (!classDef) {
      continue;
    }

    const saveFn = SAVE_PER_LEVEL[classDef.savingThrows.reflex];

    if (saveFn) {
      total += saveFn(level);
    }
  }

  return total;
}

/**
 * Compute will save from multiclass progression.
 */
export function computeWillSave(
  classLevels: Record<string, number>,
  classCatalog: ClassCatalog,
): number {
  let total = 0;

  for (const [classId, level] of Object.entries(classLevels)) {
    const classDef = classCatalog.classes.find((c) => c.id === classId);

    if (!classDef) {
      continue;
    }

    const saveFn = SAVE_PER_LEVEL[classDef.savingThrows.will];

    if (saveFn) {
      total += saveFn(level);
    }
  }

  return total;
}
