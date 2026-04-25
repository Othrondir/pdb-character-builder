// Phase 14-06 — Persistence docstring parity sentinel.
//
// Locks ROADMAP SC#6/SC#7: every file under apps/planner/src/features/persistence/*.ts(x)
// whose top-of-file JSDoc docstring mentions ANY of the four canonical version-header
// fields MUST mention ALL FOUR. Files whose top docstring is not version-aware are
// exempt.
//
// Canonical 4-field set (defined by build-document-schema.ts:30-33):
//   schemaVersion, plannerVersion, rulesetVersion, datasetId
//
// Background — v1.0-MILESTONE-AUDIT.md (2026-04-24) Phase 08 line 68 flagged
// "plannerVersion-excluded docstring drift": some persistence module top docstrings
// listed 3 of the 4 fields (e.g. schemaVersion + rulesetVersion + datasetId),
// giving developers a false impression that plannerVersion is not part of the
// fail-closed gate. The drift was documentation-only (the runtime gate compares
// the full set), but it could mislead a future maintainer into omitting the
// field from a new check.
//
// Per-file classification at audit time (Phase 14-06 Task 1, before Task 2 fixes):
//   Class A — top docstring is version-aware AND lists all 4 fields:
//     - build-document-schema.ts (canonical source)
//   Class B — top docstring is version-aware AND lists <=3 fields (NEEDS FIX):
//     - version-mismatch.ts (lines 12-19 mention schemaVersion + rulesetVersion +
//       datasetId, omit plannerVersion)
//   Class C — top docstring is NOT version-aware (exempt; field-name strings only
//   appear deeper in the file, in code or in non-top doc blocks):
//     - project-build-document.ts (top doc at lines 13-19 describes IncompleteBuildField)
//     - hydrate-build-document.ts (top doc at lines 10-31 describes Pattern 3 ordering)
//     - json-export.ts (top doc at lines 3-14 describes filename sanitize)
//     - json-import.ts (top doc at lines 12-18 describes JsonImportError)
//     - share-url.ts (top doc at lines 4-14 describes encode pipeline)
//     - share-entry.tsx (top doc at lines 26-34 describes route component)
//     - slot-api.ts (top doc at lines 4-7 describes saveSlot)
//     - url-budget.ts (top doc at lines 1-20 describes URL budget math)
//     - dexie-db.ts (top doc at lines 4-15 describes upgrade discipline)
//     - index.ts (no JSDoc block at all — barrel exports only)
//
// The spec is intentionally hermetic: it only reads files via fs.readFileSync so it
// can run in the default Node Vitest environment without bringing in jsdom.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const VERSION_FIELDS = [
  'schemaVersion',
  'plannerVersion',
  'rulesetVersion',
  'datasetId',
] as const;

const PERSISTENCE_FILES = [
  'apps/planner/src/features/persistence/build-document-schema.ts',
  'apps/planner/src/features/persistence/project-build-document.ts',
  'apps/planner/src/features/persistence/hydrate-build-document.ts',
  'apps/planner/src/features/persistence/json-export.ts',
  'apps/planner/src/features/persistence/json-import.ts',
  'apps/planner/src/features/persistence/share-url.ts',
  'apps/planner/src/features/persistence/share-entry.tsx',
  'apps/planner/src/features/persistence/slot-api.ts',
  'apps/planner/src/features/persistence/url-budget.ts',
  'apps/planner/src/features/persistence/version-mismatch.ts',
  'apps/planner/src/features/persistence/dexie-db.ts',
  'apps/planner/src/features/persistence/index.ts',
] as const;

/**
 * Returns the FIRST `/** ... *\/` block in the file, or '' when none exists.
 * The regex is non-greedy so it stops at the first closing `*\/`.
 */
function readTopDocstring(absPath: string): string {
  const content = readFileSync(absPath, 'utf8');
  const match = content.match(/\/\*\*[\s\S]*?\*\//);
  return match ? match[0] : '';
}

function countVersionFieldsIn(docstring: string): {
  present: string[];
  missing: string[];
} {
  const present: string[] = [];
  const missing: string[] = [];
  for (const field of VERSION_FIELDS) {
    if (docstring.includes(field)) {
      present.push(field);
    } else {
      missing.push(field);
    }
  }
  return { present, missing };
}

describe('Phase 14-06 — persistence docstring version-field parity (ROADMAP SC#6/SC#7)', () => {
  it('every persistence file with a version-aware top docstring lists all 4 canonical fields', () => {
    const drifters: Array<{
      file: string;
      present: string[];
      missing: string[];
    }> = [];

    for (const relPath of PERSISTENCE_FILES) {
      const abs = resolve(process.cwd(), relPath);
      const top = readTopDocstring(abs);
      // Empty top docstring (e.g., index.ts) -> Class C exempt.
      if (top.length === 0) continue;
      const { present, missing } = countVersionFieldsIn(top);
      // Class C: docstring exists but mentions zero version fields -> exempt.
      if (present.length === 0) continue;
      // Class B: 1..3 fields present -> drift.
      if (present.length < VERSION_FIELDS.length) {
        drifters.push({ file: relPath, present, missing });
      }
      // Class A: all 4 present -> compliant.
    }

    expect(
      drifters,
      `Persistence files with version-aware top docstrings MUST list all 4 canonical ` +
        `fields (schemaVersion, plannerVersion, rulesetVersion, datasetId). Drifters:\n` +
        drifters
          .map(
            (d) =>
              `  - ${d.file}\n      present: [${d.present.join(', ')}]\n      missing: [${d.missing.join(', ')}]`,
          )
          .join('\n'),
    ).toEqual([]);
  });

  it('build-document-schema.ts top docstring always lists all 4 canonical fields (source of truth)', () => {
    const abs = resolve(
      process.cwd(),
      'apps/planner/src/features/persistence/build-document-schema.ts',
    );
    const top = readTopDocstring(abs);
    expect(top).not.toBe('');
    const { missing } = countVersionFieldsIn(top);
    expect(
      missing,
      `build-document-schema.ts is the canonical source. Its top docstring must mention ` +
        `every version-header field. Missing: [${missing.join(', ')}]`,
    ).toEqual([]);
  });
});
