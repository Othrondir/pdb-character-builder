import type {
  CompiledFeat,
  FeatCatalog,
} from '@data-extractor/contracts/feat-catalog';

/**
 * Snapshot of the character build at a specific level,
 * used to evaluate feat prerequisites.
 */
export interface BuildStateAtLevel {
  /** Final ability scores including base + racial + ability increases */
  abilityScores: Record<string, number>;
  /** Base Attack Bonus at this level */
  bab: number;
  /** Character level (1-16) */
  characterLevel: number;
  /** classId -> number of levels in that class at this point */
  classLevels: Record<string, number>;
  /** Fortitude saving throw total */
  fortitudeSave: number;
  /** All feats selected/auto-granted at levels <= current-1 */
  selectedFeatIds: Set<string>;
  /** skillId -> cumulative ranks at this level */
  skillRanks: Record<string, number>;
  /**
   * Per-class caster level map. Multiclass casters are tracked independently — a
   * cleric 5 / wizard 5 build is `{ 'class:cleric': 5, 'class:wizard': 5 }`, never
   * summed (07-RESEARCH Pitfall 3). Empty object when the build has no caster classes.
   */
  casterLevelByClass: Record<string, number>;
}

export interface PrerequisiteCheck {
  type:
    | 'ability'
    | 'bab'
    | 'feat'
    | 'skill'
    | 'level'
    | 'class-level'
    | 'spell-level'
    | 'fort-save'
    | 'or-feats'
    | 'max-level'
    | 'epic';
  label: string;
  met: boolean;
  required: string;
  current: string;
}

export interface PrerequisiteCheckResult {
  met: boolean;
  checks: PrerequisiteCheck[];
}

export const ABILITY_LABELS: Record<string, string> = {
  str: 'Fuerza',
  dex: 'Destreza',
  con: 'Constitucion',
  int: 'Inteligencia',
  wis: 'Sabiduria',
  cha: 'Carisma',
};

export const ABILITY_PREREQ_MAP: Record<string, string> = {
  minStr: 'str',
  minDex: 'dex',
  minCon: 'con',
  minInt: 'int',
  minWis: 'wis',
  minCha: 'cha',
};

/**
 * Maximum spell level accessible across a build's caster classes, using the full-caster
 * formula (class level L grants up to floor((L+1)/2) spell level, capped at 9). Used by
 * feat prerequisites (`minSpellLevel`) that derive the max from casterLevelByClass.
 *
 * Kept inline in feat-prerequisite.ts rather than imported from `../magic/caster-level.ts`
 * to avoid a module cycle (magic already imports BuildStateAtLevel from this file).
 */
export function getMaxSpellLevelFromBuildState(
  buildState: BuildStateAtLevel,
): number {
  let max = 0;
  for (const level of Object.values(buildState.casterLevelByClass)) {
    const accessLevel = Math.min(9, Math.floor((level + 1) / 2));
    if (accessLevel > max) max = accessLevel;
  }
  return max;
}

/**
 * Evaluate all prerequisites for a single feat against the current build state.
 * Returns a per-prerequisite pass/fail report with Spanish labels.
 */
export function evaluateFeatPrerequisites(
  feat: CompiledFeat,
  buildState: BuildStateAtLevel,
  featCatalog: FeatCatalog,
): PrerequisiteCheckResult {
  const checks: PrerequisiteCheck[] = [];
  const prereqs = feat.prerequisites;

  // Ability score checks
  for (const [prereqKey, abilityKey] of Object.entries(ABILITY_PREREQ_MAP)) {
    const value = prereqs[prereqKey as keyof typeof prereqs] as number | null | undefined;

    if (value != null && value > 0) {
      const currentScore = buildState.abilityScores[abilityKey] ?? 0;

      checks.push({
        type: 'ability',
        label: ABILITY_LABELS[abilityKey] ?? abilityKey,
        met: currentScore >= value,
        required: String(value),
        current: String(currentScore),
      });
    }
  }

  // BAB check
  if (prereqs.minBab != null && prereqs.minBab > 0) {
    checks.push({
      type: 'bab',
      label: 'BAB',
      met: buildState.bab >= prereqs.minBab,
      required: `+${prereqs.minBab}`,
      current: `+${buildState.bab}`,
    });
  }

  // Required feat 1 (AND)
  if (prereqs.requiredFeat1 != null) {
    const reqFeat = featCatalog.feats.find((f) => f.id === prereqs.requiredFeat1);
    const met = buildState.selectedFeatIds.has(prereqs.requiredFeat1);

    checks.push({
      type: 'feat',
      label: reqFeat?.label ?? prereqs.requiredFeat1,
      met,
      required: reqFeat?.label ?? prereqs.requiredFeat1,
      current: met ? '(tomada)' : '(no tomada)',
    });
  }

  // Required feat 2 (AND)
  if (prereqs.requiredFeat2 != null) {
    const reqFeat = featCatalog.feats.find((f) => f.id === prereqs.requiredFeat2);
    const met = buildState.selectedFeatIds.has(prereqs.requiredFeat2);

    checks.push({
      type: 'feat',
      label: reqFeat?.label ?? prereqs.requiredFeat2,
      met,
      required: reqFeat?.label ?? prereqs.requiredFeat2,
      current: met ? '(tomada)' : '(no tomada)',
    });
  }

  // OR-required feats
  if (prereqs.orReqFeats && prereqs.orReqFeats.length > 0) {
    const anyMet = prereqs.orReqFeats.some((id) =>
      buildState.selectedFeatIds.has(id),
    );
    const labels = prereqs.orReqFeats.map((id) => {
      const f = featCatalog.feats.find((ff) => ff.id === id);
      return f?.label ?? id;
    });

    checks.push({
      type: 'or-feats',
      label: labels.join(' o '),
      met: anyMet,
      required: 'una de las siguientes',
      current: anyMet ? '(cumplido)' : '(ninguna tomada)',
    });
  }

  // Required skill 1
  if (prereqs.requiredSkill != null) {
    const { id, minRanks } = prereqs.requiredSkill;
    const currentRanks = buildState.skillRanks[id] ?? 0;

    checks.push({
      type: 'skill',
      label: id,
      met: currentRanks >= minRanks,
      required: `${minRanks} rangos`,
      current: `${currentRanks} rangos`,
    });
  }

  // Required skill 2
  if (prereqs.requiredSkill2 != null) {
    const { id, minRanks } = prereqs.requiredSkill2;
    const currentRanks = buildState.skillRanks[id] ?? 0;

    checks.push({
      type: 'skill',
      label: id,
      met: currentRanks >= minRanks,
      required: `${minRanks} rangos`,
      current: `${currentRanks} rangos`,
    });
  }

  // Min level check (only if minLevelClass is NOT present, otherwise it's a class-level check)
  if (prereqs.minLevel != null && prereqs.minLevel > 0 && prereqs.minLevelClass == null) {
    checks.push({
      type: 'level',
      label: 'Nivel de personaje',
      met: buildState.characterLevel >= prereqs.minLevel,
      required: String(prereqs.minLevel),
      current: String(buildState.characterLevel),
    });
  }

  // Class level check (minLevelClass with minLevel as the required class level)
  if (prereqs.minLevelClass != null) {
    const classId = prereqs.minLevelClass;
    const requiredLevel = prereqs.minLevel ?? 1;
    const currentClassLevel = buildState.classLevels[classId] ?? 0;
    const classDef = featCatalog.feats.find((f) => f.id === classId);
    const classLabel = classDef?.label ?? classId;

    checks.push({
      type: 'class-level',
      label: `Nivel de ${classLabel}`,
      met: currentClassLevel >= requiredLevel,
      required: String(requiredLevel),
      current: String(currentClassLevel),
    });
  }

  // Spell level check
  if (prereqs.minSpellLevel != null && prereqs.minSpellLevel > 0) {
    const maxSpellLevel = getMaxSpellLevelFromBuildState(buildState);
    checks.push({
      type: 'spell-level',
      label: 'Nivel de conjuro',
      met: maxSpellLevel >= prereqs.minSpellLevel,
      required: String(prereqs.minSpellLevel),
      current: String(maxSpellLevel),
    });
  }

  // Fortitude save check
  if (prereqs.minFortSave != null && prereqs.minFortSave > 0) {
    checks.push({
      type: 'fort-save',
      label: 'Salvacion de Fortaleza',
      met: buildState.fortitudeSave >= prereqs.minFortSave,
      required: `+${prereqs.minFortSave}`,
      current: `+${buildState.fortitudeSave}`,
    });
  }

  // Epic prerequisite (unreachable at level 1-16)
  if (prereqs.preReqEpic === true) {
    checks.push({
      type: 'epic',
      label: 'Nivel epico',
      met: false,
      required: 'Nivel 21+',
      current: `Nivel ${buildState.characterLevel}`,
    });
  }

  // Max level check
  if (prereqs.maxLevel != null && prereqs.maxLevel > 0) {
    checks.push({
      type: 'max-level',
      label: 'Nivel maximo',
      met: buildState.characterLevel <= prereqs.maxLevel,
      required: `<= ${prereqs.maxLevel}`,
      current: String(buildState.characterLevel),
    });
  }

  return {
    met: checks.every((c) => c.met),
    checks,
  };
}
