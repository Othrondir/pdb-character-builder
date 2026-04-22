import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useSkillStore } from '@planner/features/skills/store';
import { useFeatStore } from '@planner/features/feats/store';
import type { BuildDocument } from './build-document-schema';
import type { AttributeKey } from '@planner/features/character-foundation/foundation-fixture';
import type { ProgressionLevel } from '@planner/lib/sections';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';

/**
 * Pattern 3 (RESEARCH.md): ordered, monotonic hydration. Resets each store and replays
 * setters in a wave-safe order so the existing revalidation cascades
 * (progression -> skills -> feats) see consistent state at every step.
 *
 * Order: foundation -> levels -> skills -> feats (08-RESEARCH.md Pitfall 2).
 *
 * Subrace MUST be set AFTER race, because setRace clears subrace if the existing subrace
 * does not belong to the new race.
 *
 * deityId is currently ignored (foundation store has no setter). Safe because projection
 * emits null today.
 *
 * Note on `as CanonicalId` casts: Zod's `z.string().regex(canonicalIdRegex)` infers to
 * `string`, not the branded `CanonicalId` template-literal type. The regex guard at the
 * schema boundary already rejects malformed IDs, so the cast is safe at runtime.
 */
export function hydrateBuildDocument(doc: BuildDocument): void {
  // --- Foundation ---
  const foundation = useCharacterFoundationStore.getState();
  foundation.resetFoundation();
  foundation.setRace(doc.build.raceId as CanonicalId);
  if (doc.build.subraceId !== null) {
    foundation.setSubrace(doc.build.subraceId as CanonicalId);
  }
  foundation.setAlignment(doc.build.alignmentId as CanonicalId);
  (Object.keys(doc.build.baseAttributes) as AttributeKey[]).forEach((key) => {
    foundation.setBaseAttribute(key, doc.build.baseAttributes[key]);
  });
  // deityId: no setter in current store — intentionally skipped.

  // --- Progression ---
  const progression = useLevelProgressionStore.getState();
  progression.resetProgression();
  for (const lv of doc.build.levels) {
    const level = lv.level as ProgressionLevel;
    if (lv.classId !== null) {
      progression.setLevelClassId(level, lv.classId as CanonicalId);
    }
    if (lv.abilityIncrease !== null) {
      progression.setLevelAbilityIncrease(level, lv.abilityIncrease);
    }
  }

  // --- Skills ---
  const skills = useSkillStore.getState();
  skills.resetSkillAllocations();
  for (const lvSkill of doc.build.skillAllocations) {
    const level = lvSkill.level as ProgressionLevel;
    for (const alloc of lvSkill.allocations) {
      skills.setLevelSkillRank(level, alloc.skillId as CanonicalId, alloc.rank);
    }
  }

  // --- Feats ---
  const feats = useFeatStore.getState();
  feats.resetFeatSelections();
  for (const lvFeat of doc.build.featSelections) {
    const level = lvFeat.level as ProgressionLevel;
    if (lvFeat.classFeatId !== null) {
      feats.setClassFeat(level, lvFeat.classFeatId as CanonicalId);
    }
    if (lvFeat.generalFeatId !== null) {
      feats.setGeneralFeat(level, lvFeat.generalFeatId as CanonicalId);
    }
    for (const [index, featId] of lvFeat.bonusGeneralFeatIds.entries()) {
      feats.setGeneralFeat(level, featId as CanonicalId, index + 1);
    }
  }
}
