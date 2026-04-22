import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useSkillStore } from '@planner/features/skills/store';
import { getGeneralFeatIds, useFeatStore } from '@planner/features/feats/store';
import { compiledClassCatalog } from '@planner/data/compiled-classes';
import { compiledRaceCatalog } from '@planner/data/compiled-races';
import { compiledSkillCatalog } from '@planner/data/compiled-skills';
import { compiledFeatCatalog } from '@planner/data/compiled-feats';
import { phase03FoundationFixture } from '@planner/features/character-foundation/foundation-fixture';
import { formatDatasetLabel } from '@planner/data/ruleset-version';
import { shellCopyEs } from '@planner/lib/copy/es';
import {
  computeTotalBab,
  computeFortSave,
  computeRefSave,
  computeWillSave,
} from '@rules-engine/feats/bab-calculator';
import type { AttributeKey } from '@planner/features/character-foundation/foundation-fixture';
import type { ProgressionLevel } from '@planner/lib/sections';

type AttributeRow = {
  key: AttributeKey;
  label: string;
  total: number;
  modifier: number;
};

type ProgressionRow = {
  level: ProgressionLevel;
  classLabel: string | null;
  // Derived-stat columns are `number | null`. `null` means the rules-engine helper is
  // missing and the table renders em-dash. Never substitute `0`.
  cumulativeBab: number | null;
  cumulativeFort: number | null;
  cumulativeRef: number | null;
  cumulativeWill: number | null;
  generalFeatLabel: string | null;
  classFeatLabel: string | null;
};

type SkillRow = {
  skillId: string;
  skillLabel: string;
  ranks: number;
  abilityMod: number;
  total: number;
};

export interface ResumenViewModel {
  identity: {
    name: string;
    raceLabel: string;
    subraceLabel: string | null;
    alignmentLabel: string;
    datasetLabel: string;
  };
  attributes: AttributeRow[];
  progression: ProgressionRow[];
  skills: SkillRow[];
}

const ATTRIBUTE_ORDER: AttributeKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

function findRaceLabel(raceId: string | null): string {
  if (!raceId) return shellCopyEs.resumen.notAvailable;
  const compiled = compiledRaceCatalog.races.find((r) => r.id === raceId);
  if (compiled) return compiled.label;
  // Fallback to foundation-fixture for race IDs that the compiled catalog lacks.
  const fixture = phase03FoundationFixture.races.find((r) => r.id === raceId);
  return fixture?.label ?? shellCopyEs.resumen.notAvailable;
}

function findSubraceLabel(subraceId: string | null): string | null {
  if (!subraceId) return null;
  const fixture = phase03FoundationFixture.subraces.find((s) => s.id === subraceId);
  return fixture?.label ?? null;
}

function findAlignmentLabel(alignmentId: string | null): string {
  if (!alignmentId) return shellCopyEs.resumen.notAvailable;
  const fixture = phase03FoundationFixture.alignments.find((a) => a.id === alignmentId);
  return fixture?.label ?? shellCopyEs.resumen.notAvailable;
}

function findClassLabel(classId: string | null): string | null {
  if (!classId) return null;
  return compiledClassCatalog.classes.find((c) => c.id === classId)?.label ?? null;
}

function findFeatLabel(featId: string | null): string | null {
  if (!featId) return null;
  return compiledFeatCatalog.feats.find((f) => f.id === featId)?.label ?? null;
}

/**
 * Build a { classId -> cumulative level count } map for the levels up to and including
 * the given level. Fed directly to rules-engine helpers.
 */
function computeCumulativeClassLevels(
  progressionLevels: { level: ProgressionLevel; classId: string | null }[],
  upTo: ProgressionLevel,
): Record<string, number> {
  const classLevels: Record<string, number> = {};
  for (const rec of progressionLevels) {
    if (rec.level <= upTo && rec.classId) {
      classLevels[rec.classId] = (classLevels[rec.classId] ?? 0) + 1;
    }
  }
  return classLevels;
}

/**
 * Hook: subscribes to all four planner stores and projects the Resumen view-model.
 * Component re-renders automatically when any underlying store changes.
 */
export function useResumenViewModel(): ResumenViewModel {
  const foundation = useCharacterFoundationStore();
  const progression = useLevelProgressionStore();
  const skills = useSkillStore();
  const feats = useFeatStore();

  // --- Identity block ---
  const raceLabel = findRaceLabel(foundation.raceId);
  const subraceLabel = findSubraceLabel(foundation.subraceId);
  const alignmentLabel = findAlignmentLabel(foundation.alignmentId);

  // --- Attributes: base attributes + (future) racial mods + level-up mods ---
  // Racial modifiers come from compiledRaceCatalog.races[*].abilityAdjustments.
  const racialAdj = compiledRaceCatalog.races.find((r) => r.id === foundation.raceId)
    ?.abilityAdjustments as Record<AttributeKey, number> | undefined;
  // Level-up ability increases are cumulative across all 16 levels (Phase 4 rules).
  const levelUpAdj: Record<AttributeKey, number> = {
    str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0,
  };
  for (const rec of progression.levels) {
    if (rec.abilityIncrease) {
      levelUpAdj[rec.abilityIncrease] += 1;
    }
  }
  const attributes: AttributeRow[] = ATTRIBUTE_ORDER.map((key) => {
    const base = foundation.baseAttributes[key];
    const racial = racialAdj?.[key] ?? 0;
    const total = base + racial + levelUpAdj[key];
    return {
      key,
      label: shellCopyEs.resumen.attributeLabels[key],
      total,
      modifier: abilityModifier(total),
    };
  });

  // --- Progression: 16 rows with derived stats at each level ---
  const progressionRows: ProgressionRow[] = progression.levels.map((lv) => {
    const classLevels = computeCumulativeClassLevels(
      progression.levels.map((r) => ({ level: r.level, classId: r.classId })),
      lv.level,
    );
    // Skip derived-stat calc when there's no class chain yet — render em-dash instead of 0.
    const hasAnyClass = Object.keys(classLevels).length > 0;
    const bab = hasAnyClass ? computeTotalBab(classLevels, compiledClassCatalog) : null;
    const fort = hasAnyClass ? computeFortSave(classLevels, compiledClassCatalog) : null;
    const ref = hasAnyClass ? computeRefSave(classLevels, compiledClassCatalog) : null;
    const will = hasAnyClass ? computeWillSave(classLevels, compiledClassCatalog) : null;

    const featRow = feats.levels.find((f) => f.level === lv.level);

    return {
      level: lv.level,
      classLabel: findClassLabel(lv.classId),
      cumulativeBab: bab,
      cumulativeFort: fort,
      cumulativeRef: ref,
      cumulativeWill: will,
      generalFeatLabel:
        getGeneralFeatIds(featRow)
          .map((featId) => findFeatLabel(featId) ?? featId)
          .join(', ') || null,
      classFeatLabel: findFeatLabel(featRow?.classFeatId ?? null),
    };
  });

  // --- Skills: total ranks across levels + ability modifier from final attribute total ---
  const abilityTotalByKey = new Map<AttributeKey, number>();
  for (const attr of attributes) abilityTotalByKey.set(attr.key, attr.total);

  const rankByskillId = new Map<string, number>();
  for (const lvSkill of skills.levels) {
    for (const alloc of lvSkill.allocations) {
      rankByskillId.set(alloc.skillId, (rankByskillId.get(alloc.skillId) ?? 0) + alloc.rank);
    }
  }

  const skillRows: SkillRow[] = compiledSkillCatalog.skills
    .slice()
    .sort((a, b) => a.label.localeCompare(b.label))
    .map((skill) => {
      const ranks = rankByskillId.get(skill.id) ?? 0;
      const abilityScore = abilityTotalByKey.get(skill.abilityKey as AttributeKey) ?? 10;
      const abilityMod = abilityModifier(abilityScore);
      return {
        skillId: skill.id,
        skillLabel: skill.label,
        ranks,
        abilityMod,
        total: ranks + abilityMod,
      };
    });

  return {
    identity: {
      name: shellCopyEs.resumen.emptyNamePlaceholder,
      raceLabel,
      subraceLabel,
      alignmentLabel,
      datasetLabel: formatDatasetLabel(),
    },
    attributes,
    progression: progressionRows,
    skills: skillRows,
  };
}
