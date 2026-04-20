/**
 * Phase 12.6 (Plan 03, PROG-04 R5) — 20-row scan surface host.
 *
 * Swapped from the prior single-level ClassPicker + DetailPanel render
 * to an `<ol>` of 20 `LevelProgressionRow` children. Plan 04 will
 * populate the expanded-slot host inside each row (ClassPicker +
 * LevelEditorActionBar migrated verbatim from level-sheet.tsx). Plan 05
 * deletes the legacy level-rail.tsx + creation-stepper imports.
 *
 * The `<h2>` reads `shellCopyEs.progression.railHeading` which Plan 01
 * patched to `'Progresión 1-20'` (locked decision — no branching).
 */

import { LevelProgressionRow } from './level-progression-row';
import { PROGRESSION_LEVELS } from './progression-fixture';
import { shellCopyEs } from '@planner/lib/copy/es';

export function BuildProgressionBoard() {
  return (
    <section className="build-progression-board">
      <header className="build-progression-board__title-bar">
        <h2>{shellCopyEs.progression.railHeading}</h2>
      </header>
      <ol
        className="level-progression__list"
        data-testid="level-progression-list"
      >
        {PROGRESSION_LEVELS.map((level) => (
          <LevelProgressionRow key={level} level={level} />
        ))}
      </ol>
    </section>
  );
}
