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
 * Fields of the projected BuildDocument that the foundation store can legally hold as
 * `null` (default state), but that `buildDocumentSchema` requires as non-null
 * canonicalId strings. Projecting while any of these is null produces a raw ZodError
 * leaking schema internals to the user. `IncompleteBuildError` is the typed,
 * actionable alternative every call site can catch.
 */
export type IncompleteBuildField = 'raceId' | 'alignmentId';

/**
 * Thrown by `projectBuildDocument` when the foundation store is not yet in a
 * projectable state (race and/or alignment unset). Guards D-07 / SHAR-05 by refusing
 * to emit a partial BuildDocument AND giving dialogs a typed surface to react to —
 * instead of letting a raw `ZodError` escape.
 */
export class IncompleteBuildError extends Error {
  readonly missingFields: IncompleteBuildField[];

  constructor(missingFields: IncompleteBuildField[]) {
    super(
      `Build is incomplete: missing ${missingFields.join(', ')}. ` +
        `Pick a race and alignment before exporting or sharing.`,
    );
    this.name = 'IncompleteBuildError';
    this.missingFields = missingFields;
  }
}

/**
 * Pure predicate: returns `true` when `projectBuildDocument()` can succeed against
 * the current live store state. Used by the Resumen action bar to disable
 * Exportar / Compartir when the build is not projectable — preventing the
 * error surface rather than just handling it.
 */
export function isBuildProjectable(): boolean {
  const foundation = useCharacterFoundationStore.getState();
  return foundation.raceId !== null && foundation.alignmentId !== null;
}

/**
 * Pure selector: reads the 4 zustand stores and projects a validated BuildDocument.
 *
 * Throws:
 * - `IncompleteBuildError` — foundation store still has null raceId or alignmentId
 *   (user hasn't completed the origin step yet). Call sites SHOULD catch this and
 *   surface a user-facing toast instead of bubbling.
 * - `ZodError` — ONLY when the live store state is internally inconsistent (e.g. a
 *   past schema drift). Indicates a real bug.
 *
 * @param name optional build name stamped into `build.name` (used by Dexie save flow).
 *   When omitted/undefined, falls back to `foundation.buildName`. When both are absent,
 *   the field is omitted from the document — schema marks it optional. Phase 14-03.
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

  // Phase 14-03 — name resolution precedence:
  //   explicit `name` arg > foundation.buildName > undefined (field omitted).
  // Lets the Dexie save dialog override on-demand without losing the round-trip
  // identity that hydrate now persists into the store.
  //
  // Phase 14 REVIEW MR-02 — defend the projection boundary against an unbounded
  // store value: `setBuildName` accepts any string length (A5 spec); only callers
  // currently cap at 80 (hydrate via schema, SaveSlotDialog via maxLength). A
  // future Resumen rename UI could push >80 chars into the store; clamp here so
  // projection fails closed via IncompleteBuildError-or-omitted-field, never via
  // a raw ZodError leaking past SaveSlotDialog's typed catch.
  const storeName = foundation.buildName;
  const fallbackName =
    storeName !== null && storeName.length > 0 && storeName.length <= 80
      ? storeName
      : undefined;
  const resolvedName = name ?? fallbackName;

  // Pre-projection guard: fail with a typed error BEFORE Zod sees nulls. Preserves
  // schema strictness (D-07) while giving callers an actionable surface.
  const missing: IncompleteBuildField[] = [];
  if (foundation.raceId === null) missing.push('raceId');
  if (foundation.alignmentId === null) missing.push('alignmentId');
  if (missing.length > 0) {
    throw new IncompleteBuildError(missing);
  }

  const doc: unknown = {
    schemaVersion: BUILD_ENCODING_VERSION,
    plannerVersion: PLANNER_VERSION,
    rulesetVersion: RULESET_VERSION,
    datasetId: CURRENT_DATASET_ID,
    createdAt: new Date().toISOString(),
    build: {
      ...(resolvedName ? { name: resolvedName } : {}),
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
        bonusGeneralFeatIds: lv.bonusGeneralFeatIds,
        classFeatId: lv.classFeatId,
        generalFeatId: lv.generalFeatId,
      })),
    },
  };

  return buildDocumentSchema.parse(doc);
}
