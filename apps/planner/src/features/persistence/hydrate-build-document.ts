import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useSkillStore } from '@planner/features/skills/store';
import { useFeatStore } from '@planner/features/feats/store';
import type { BuildDocument } from './build-document-schema';
import type { AttributeKey } from '@planner/features/character-foundation/foundation-fixture';

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
 */
export function hydrateBuildDocument(doc: BuildDocument): void {
  // --- Foundation ---
  const foundation = useCharacterFoundationStore.getState();
  foundation.resetFoundation();
  foundation.setRace(doc.build.raceId);
  if (doc.build.subraceId !== null) {
    foundation.setSubrace(doc.build.subraceId);
  }
  foundation.setAlignment(doc.build.alignmentId);
  (Object.keys(doc.build.baseAttributes) as AttributeKey[]).forEach((key) => {
    foundation.setBaseAttribute(key, doc.build.baseAttributes[key]);
  });
  // deityId: no setter in current store — intentionally skipped.

  // --- Progression ---
  const progression = useLevelProgressionStore.getState();
  progression.resetProgression();
  for (const lv of doc.build.levels) {
    if (lv.classId !== null) progression.setLevelClassId(lv.level, lv.classId);
    if (lv.abilityIncrease !== null) {
      progression.setLevelAbilityIncrease(lv.level, lv.abilityIncrease);
    }
  }

  // --- Skills ---
  const skills = useSkillStore.getState();
  skills.resetSkillAllocations();
  for (const lvSkill of doc.build.skillAllocations) {
    for (const alloc of lvSkill.allocations) {
      skills.setLevelSkillRank(lvSkill.level, alloc.skillId, alloc.rank);
    }
  }

  // --- Feats ---
  const feats = useFeatStore.getState();
  feats.resetFeatSelections();
  for (const lvFeat of doc.build.featSelections) {
    if (lvFeat.classFeatId !== null) feats.setClassFeat(lvFeat.level, lvFeat.classFeatId);
    if (lvFeat.generalFeatId !== null) {
      feats.setGeneralFeat(lvFeat.level, lvFeat.generalFeatId);
    }
  }
}
