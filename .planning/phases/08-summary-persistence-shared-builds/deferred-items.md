# Deferred Items — Phase 08-01

## Pre-existing typecheck warnings (out of scope)

Running `pnpm typecheck` surfaces three errors in `tests/phase-03/foundation-validation.spec.ts` that predate Phase 08 and are unrelated to the dataset-ID consolidation or persistence work:

- `tests/phase-03/foundation-validation.spec.ts(25,7)`
- `tests/phase-03/foundation-validation.spec.ts(38,7)`
- `tests/phase-03/foundation-validation.spec.ts(60,7)`

All three report the same `DeityRuleRecord[]` vs `{ id: 'deity:none'; allowedAlignmentIds: string[] }[]` mismatch. The string literal `'deity:none'` does not satisfy the branded `CanonicalId` template type because the regex guard is on the declared type, not the runtime string.

**Scope boundary rule:** These errors pre-exist the phase-8 worktree branch and should be fixed in a dedicated cleanup quick rather than smuggled into 08-01's atomic commits. The test suite passes (`pnpm test` exits 0 with 336 tests green) — the breakage is typecheck-only.

Assign owner: capture during the next phase-03 touch or a `/gsd:quick` cleanup.
