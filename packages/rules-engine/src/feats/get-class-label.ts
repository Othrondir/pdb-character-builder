import type { ClassCatalog } from '@data-extractor/contracts/class-catalog';

/**
 * Resolve a class canonical-id (e.g. `class:rogue`) to its Spanish display
 * label (e.g. `Pícaro`). Used by FEAT-02 class-level prereq rendering and by
 * the planner board/sheet to avoid leaking raw `class:*` IDs into the UI.
 *
 * Returns `null` when `classId` is `null` (e.g. the prereq is not set). When
 * the id is provided but missing from the catalog, returns the raw id string
 * so the UI surfaces the missing-data case rather than rendering `undefined`
 * — matches the pre-existing `classDef?.label ?? classId` fallback pattern in
 * feat-prerequisite.ts.
 *
 * Accepts `string | null` because `compiledClassSchema.id` is zod-typed as
 * `string` (regex-guarded) rather than the branded `CanonicalId`, so the
 * helper's input shape matches how class IDs actually flow through the code.
 */
export function getClassLabel(
  classId: string | null,
  classCatalog: ClassCatalog,
): string | null {
  if (classId == null) {
    return null;
  }

  const found = classCatalog.classes.find((c) => c.id === classId);

  return found?.label ?? classId;
}
