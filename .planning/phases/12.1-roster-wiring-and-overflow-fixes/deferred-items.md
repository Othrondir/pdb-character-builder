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
