# Deferred Items — Phase 12.1

## Out-of-scope findings from 12.1-02 execution

### Compiled class catalog: duplicate canonical IDs

**Discovered during:** Plan 12.1-02 full-suite vitest run (post-class-roster-wiring).

**Symptom:** React duplicate-key warnings in phase-04 JSX specs:
`Encountered two children with the same key, 'class:harper'.`
`Encountered two children with the same key, 'class:shadowadept'.`

**Scope boundary:** Caused by Plan 12.1-01 (class-roster projection), not by
12.1-02 (race-roster projection). 12.1-02 applied a first-wins dedupe guard
in `foundation-fixture.ts` for the analogous `race:drow` duplicate surfaced
in the race catalog (Rule 2 auto-fix scoped to this plan's files).

**Suggested follow-up:** Replicate the `dedupeByCanonicalId` pattern in
`apps/planner/src/features/level-progression/class-fixture.ts` projection
path, or (preferred) fix the extractor so `compiled-classes.ts` emits unique
IDs at the source. Track as an extractor backlog item alongside the
"subrace emission" gap.

**Not fixed in 12.1-02** because it modifies files outside the plan's scope
(`class-fixture.ts` is 12.1-01's territory).

### Prestige-filter false positives / negatives at L1

**Discovered during:** Plan 12.1-03 human-verify UAT (scripted MCP Chrome walk-through, 2026-04-18, http://localhost:5173 after commits b070f6a..d037b77 shipped).

**Symptom:** Humano + Legal bueno + FUE16/DES12/CON16/INT11 at L1 produces
41 classes in the picker: 15 enabled, 26 blocked.
- FALSE NEGATIVE: `Clérigo` is blocked at L1 (should be legal for Legal bueno alignment).
- FALSE POSITIVES: 5 prestige classes appear enabled at L1 despite unmet
  prereqs — `Alma Predilecta`, `Caballero de Luz`, `Paladin Oscuro`,
  `Paladin Vengador`, `Artífice`. These should require BAB / specific-class
  levels that a L1 character cannot possess.

**Root cause hypothesis:** `projectCompiledClass` adapter in
`class-fixture.ts` maps some PDB classes' `kind` or `prerequisites` fields
with defaults that don't match the rules-engine `collectVisibleClassOptions`
filter's expectations. Either compiled-classes.ts emits these with missing
`implementedRequirements` metadata, or the adapter strips/defaults a field
that the filter reads. Clérigo case: likely a deity/domain prereq in
`implementedRequirements` that now evaluates as blocked without the
hand-authored fixture's `minimumClassCommitment` overlay.

**Scope boundary:** Phase 12.1 SC1 is "roster renders the PDB-emitted set" —
that passes (all 41 visible). This prestige-filter correctness is downstream
of the roster wiring and orthogonal to 12.1's core goal.

**Suggested follow-up:** Phase 12.2 (or separate plan) — audit
`collectVisibleClassOptions` behavior against the projected catalog, extend
the class-fixture projection adapter to pass through any missing prereq
metadata, or fix the extractor to emit the relevant `implementedRequirements`
fields so prestige classes gate correctly and Clérigo unblocks for legal
alignments.

