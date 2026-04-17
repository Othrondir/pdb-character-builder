import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useSkillStore } from '@planner/features/skills/store';
import { useFeatStore } from '@planner/features/feats/store';
import {
  PLANNER_VERSION,
  RULESET_VERSION,
  BUILD_ENCODING_VERSION,
  CURRENT_DATASET_ID,
} from '@planner/data/ruleset-version';
import { buildDocumentSchema, type BuildDocument } from './build-document-schema';

/**
 * Pure selector: reads the 4 zustand stores and projects a validated BuildDocument.
 *
 * Throws ZodError if the live state is somehow invalid — that indicates a bug, not user
 * error. The projection always runs through `buildDocumentSchema.parse()` so callers can
 * rely on the returned value being strictly typed.
 *
 * @param name optional build name stamped into `build.name` (used by Dexie save flow).
 *
 * NOTE: `deityId` is always emitted as `null` until the foundation store exposes a deity
 * field. The schema accepts nullable so this is forward-compatible. Documented in
 * 08-01-PLAN.md known-stubs.
 */
export function projectBuildDocument(name?: string): BuildDocument {
  const foundation = useCharacterFoundationStore.getState();
  const progression = useLevelProgressionStore.getState();
  const skills = useSkillStore.getState();
  const feats = useFeatStore.getState();

  const doc: unknown = {
    schemaVersion: BUILD_ENCODING_VERSION,
    plannerVersion: PLANNER_VERSION,
    rulesetVersion: RULESET_VERSION,
    datasetId: CURRENT_DATASET_ID,
    createdAt: new Date().toISOString(),
    build: {
      ...(name ? { name } : {}),
      raceId: foundation.raceId,
      subraceId: foundation.subraceId,
      alignmentId: foundation.alignmentId,
      deityId: null,
      baseAttributes: foundation.baseAttributes,
      levels: progression.levels.map((lv) => ({
        level: lv.level,
        classId: lv.classId,
        abilityIncrease: lv.abilityIncrease,
      })),
      skillAllocations: skills.levels.map((lv) => ({
        level: lv.level,
        allocations: lv.allocations.map((a) => ({ skillId: a.skillId, rank: a.rank })),
      })),
      featSelections: feats.levels.map((lv) => ({
        level: lv.level,
        classFeatId: lv.classFeatId,
        generalFeatId: lv.generalFeatId,
      })),
    },
  };

  return buildDocumentSchema.parse(doc);
}
