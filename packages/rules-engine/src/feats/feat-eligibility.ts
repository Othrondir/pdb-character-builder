import type {
  CompiledFeat,
  FeatCatalog,
} from '@data-extractor/contracts/feat-catalog';
import type { ClassCatalog } from '@data-extractor/contracts/class-catalog';
import type { CanonicalId } from '../contracts/canonical-id';
import {
  evaluateFeatPrerequisites,
  type BuildStateAtLevel,
  type PrerequisiteCheckResult,
} from './feat-prerequisite';

export interface FeatSlotsAtLevel {
  /** Whether this level grants a class bonus feat pick */
  classBonusFeatSlot: boolean;
  /** Whether this level grants a general feat pick */
  generalFeatSlot: boolean;
  /** Feat IDs auto-granted at this class level */
  autoGrantedFeatIds: string[];
}

export type FeatSlotType = 'class-bonus' | 'general';

export interface EligibleFeatSet {
  /** Feats eligible for the class bonus slot */
  classBonusFeats: CompiledFeat[];
  /** Feats eligible for the general slot */
  generalFeats: CompiledFeat[];
}

/**
 * Feats that may appear in cls_feat_* manual pools but should never be picked
 * by the player. They can still be auto-granted through list=3 entries.
 */
const MANUAL_SELECTION_BLOCKED_FEAT_IDS = new Set<string>([
  'feat:feat-dragon-dis-breath',
]);

/**
 * Curated class-scoped feats that should behave like normal selectable
 * general feats even though the source tables do not expose them through
 * `ALLCLASSESCANUSE` / `list=0,onMenu=true`.
 */
const RESTRICTED_GENERAL_FEAT_ALLOWLIST: Record<string, Set<string>> = {
  'class:warlock': new Set([
    'feat:feat-craft-wand',
    'feat:maximizaraptitud-sortilega',
    'feat:potenciaraptitud-sortilega',
    'feat:solturaaptitud-sortilega',
  ]),
};

export function isManualFeatSelectionBlocked(featId: string): boolean {
  return MANUAL_SELECTION_BLOCKED_FEAT_IDS.has(featId);
}

export function isSelectableRestrictedGeneralFeat(
  classId: CanonicalId | null,
  featId: string,
): boolean {
  if (!classId) {
    return false;
  }

  return RESTRICTED_GENERAL_FEAT_ALLOWLIST[classId]?.has(featId) ?? false;
}

/** General feat levels: character levels 1, 3, 6, 9, 12, 15 */
const GENERAL_FEAT_LEVELS = [1, 3, 6, 9, 12, 15];

/**
 * Standard NWN1 EE bonus feat schedules — class levels at which a class
 * grants a selectable bonus feat pick. Sourced from cls_feat_*.2da gain
 * tables. Only classes whose classFeatLists entries use grantedOnLevel=null
 * (pool-style) need an explicit schedule here; classes with per-level
 * grantedOnLevel entries are handled by the normal loop below.
 */
const CLASS_BONUS_FEAT_SCHEDULES: Record<string, number[]> = {
  'class:fighter': [1, 2, 4, 6, 8, 10, 12, 14, 16],
  'class:swashbuckler': [1, 2, 5, 9, 13],
  'class:caballero-arcano': [1, 3, 5, 7, 9, 11, 13, 15],
  // Phase 12.4-03 (OQ-3) — extended after RED fixture surfaced missing cadence.
  // NWN1 EE canon sourced from cls_feat_wiz.2da / cls_feat_monk.2da / cls_feat_rog.2da:
  'class:wizard': [1, 5, 10, 15],
  'class:monk': [1, 2, 6],
  'class:rogue': [10, 13, 16],
};

/**
 * Determine feat slots available at a given character level.
 *
 * Auto-granted feats (list=3 with grantedOnLevel) are collected.
 * General feat slot is available at character levels 1, 3, 6, 9, 12, 15.
 * Class bonus feat slot is detected from classFeatLists entries where
 * list=1/2 with grantedOnLevel matching classLevelInClass and onMenu=true,
 * OR from CLASS_BONUS_FEAT_SCHEDULES for classes that encode their bonus
 * feat pool with grantedOnLevel=null (e.g., Fighter).
 *
 * NOTE: Human bonus feat at level 1 is not modeled here (would need race data).
 * TODO: Add human bonus feat logic when race-aware feat selection is implemented.
 */
export function determineFeatSlots(
  characterLevel: number,
  classId: CanonicalId | null,
  classLevelInClass: number,
  classFeatLists: FeatCatalog['classFeatLists'],
): FeatSlotsAtLevel {
  const autoGrantedFeatIds: string[] = [];
  let classBonusFeatSlot = false;

  if (classId && classFeatLists[classId]) {
    for (const entry of classFeatLists[classId]) {
      // Auto-granted: list=3 with grantedOnLevel matching this class level
      if (entry.list === 3 && entry.grantedOnLevel === classLevelInClass) {
        autoGrantedFeatIds.push(entry.featId);
      }

      // Auto-granted silently: list=1/2 with grantedOnLevel matching and onMenu=false
      if (
        (entry.list === 1 || entry.list === 2) &&
        entry.grantedOnLevel === classLevelInClass &&
        entry.onMenu === false
      ) {
        autoGrantedFeatIds.push(entry.featId);
      }

      // Class bonus feat slot: list=1/2 with grantedOnLevel matching and onMenu=true
      if (
        (entry.list === 1 || entry.list === 2) &&
        entry.grantedOnLevel === classLevelInClass &&
        entry.onMenu === true
      ) {
        classBonusFeatSlot = true;
      }
    }

    // For classes with pool-style bonus feats, check the hardcoded schedule.
    // Puerta custom tables may encode pools as GrantedOnLevel=99 rather than
    // null, so the class schedule itself is the authoritative slot signal.
    if (!classBonusFeatSlot) {
      const schedule = CLASS_BONUS_FEAT_SCHEDULES[classId];
      if (schedule && schedule.includes(classLevelInClass)) {
        classBonusFeatSlot = true;
      }
    }
  }

  const generalFeatSlot = GENERAL_FEAT_LEVELS.includes(characterLevel);

  return { classBonusFeatSlot, generalFeatSlot, autoGrantedFeatIds };
}

export function getAutoGrantedFeatIdsThroughClassLevel(
  classId: CanonicalId | null,
  classLevelInClass: number,
  classFeatLists: FeatCatalog['classFeatLists'],
): Set<string> {
  const autoGrantedFeatIds = new Set<string>();

  if (!classId || !classFeatLists[classId]) {
    return autoGrantedFeatIds;
  }

  for (const entry of classFeatLists[classId]) {
    if (entry.grantedOnLevel == null || entry.grantedOnLevel > classLevelInClass) {
      continue;
    }

    if (entry.list === 3) {
      autoGrantedFeatIds.add(entry.featId);
      continue;
    }

    if ((entry.list === 1 || entry.list === 2) && entry.onMenu === false) {
      autoGrantedFeatIds.add(entry.featId);
    }
  }

  return autoGrantedFeatIds;
}

/**
 * Get eligible feats for a given level split into class bonus and general pools.
 *
 * - Excludes already-selected feats (per Pitfall 6: feats are one-time selections).
 * - Excludes epic feats (preReqEpic === true, unreachable at level 1-16).
 * - Only includes feats where all prerequisites are met (D-01: only eligible feats shown by default).
 */
export function getEligibleFeats(
  buildState: BuildStateAtLevel,
  classId: CanonicalId | null,
  classLevelInClass: number,
  featCatalog: FeatCatalog,
  classCatalog: ClassCatalog,
): EligibleFeatSet {
  const classBonusFeats: CompiledFeat[] = [];
  const generalFeats: CompiledFeat[] = [];
  const currentClassAutoGrantedFeatIds = getAutoGrantedFeatIdsThroughClassLevel(
    classId,
    classLevelInClass,
    featCatalog.classFeatLists,
  );

  // Build a set of class bonus feat IDs for the current class
  const classBonusFeatIds = new Set<string>();

  if (classId && featCatalog.classFeatLists[classId]) {
    for (const entry of featCatalog.classFeatLists[classId]) {
      if ((entry.list === 1 || entry.list === 2) && entry.onMenu) {
        classBonusFeatIds.add(entry.featId);
      }
    }
  }

  for (const feat of featCatalog.feats) {
    if (isManualFeatSelectionBlocked(feat.id)) {
      continue;
    }

    if (currentClassAutoGrantedFeatIds.has(feat.id)) {
      continue;
    }

    // Skip already-selected feats
    if (buildState.selectedFeatIds.has(feat.id)) {
      continue;
    }

    // Skip epic feats (unreachable at 1-16)
    if (feat.prerequisites.preReqEpic === true) {
      continue;
    }

    // Check prerequisites
    const result = evaluateFeatPrerequisites(
      feat,
      buildState,
      featCatalog,
      classCatalog,
    );

    if (!result.met) {
      continue;
    }

    // Classify into class bonus or general
    if (classBonusFeatIds.has(feat.id)) {
      classBonusFeats.push(feat);
    }

    // General feats: those with allClassesCanUse or in class list=0
    if (feat.allClassesCanUse) {
      generalFeats.push(feat);
    } else if (classId && featCatalog.classFeatLists[classId]) {
      const hasGeneralEntry = featCatalog.classFeatLists[classId].some(
        (entry) => entry.featId === feat.id && entry.list === 0 && entry.onMenu,
      );

      if (
        hasGeneralEntry ||
        isSelectableRestrictedGeneralFeat(classId, feat.id)
      ) {
        generalFeats.push(feat);
      }
    }
  }

  return { classBonusFeats, generalFeats };
}

/**
 * Evaluate all feats in the catalog against the current build state.
 * Returns each feat with its full prerequisite check result.
 * Used by the search feature (D-06) to show both eligible and blocked feats with reasons.
 */
export function evaluateAllFeatsForSearch(
  buildState: BuildStateAtLevel,
  featCatalog: FeatCatalog,
  classCatalog: ClassCatalog,
): Array<{ feat: CompiledFeat; prereqResult: PrerequisiteCheckResult }> {
  return featCatalog.feats.map((feat) => ({
    feat,
    prereqResult: evaluateFeatPrerequisites(
      feat,
      buildState,
      featCatalog,
      classCatalog,
    ),
  }));
}
