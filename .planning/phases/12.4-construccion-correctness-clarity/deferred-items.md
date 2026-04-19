# Phase 12.4 — Deferred Items

Pre-existing issues observed during plan execution. Logged per executor
scope-boundary rule: out-of-scope failures are NOT auto-fixed, but are
recorded here so the verifier / later phases can triage them.

---

## DEF-12.4-01: Worktree node_modules hydration gap (pnpm test full-suite)

**Discovered during:** Plan 12.4-02 (Wave 1, worktree `agent-aa1567a6`).

**Symptom:** `pnpm test -- --run` reports 25 file-level FAIL entries with
`Failed to resolve import "dexie"` and `Cannot find package 'better-sqlite3'`
from `apps/planner/src/features/persistence/dexie-db.ts` and
`packages/data-extractor/src/readers/nwsync-reader.ts`.

**Proof it is pre-existing, not caused by 12.4-02:**

Ran `git stash --include-untracked` (reverting to the plan's start-of-task
state) and re-ran `pnpm test tests/phase-02/layout-shell.spec.ts -- --run`
— same `dexie` resolution error reproduces against the untouched baseline.

**Scope assessment:** out of scope for 12.4-02. 12.4-02's CSS / spec / diff
touches zero dependency surface.

**Remediation owner:** whichever executor runs `corepack pnpm install`
in this worktree before the next full-suite gate (likely the verifier or
plan 12.4-03 startup task).

---

## DEF-12.4-02: Pre-existing `font-weight: 700` in app.css

**Discovered during:** Plan 12.4-02 (theme-contract.spec.ts assertion).

**Symptom:** `tests/phase-05.2/theme-contract.spec.ts > 'does NOT contain
font-weight: 700'` fails — app.css contains `font-weight: 700` somewhere.

**Evidence it is pre-existing:** documented in the phase UI contract:

> UI-SPEC.md L66 (12.4-UI-SPEC.md):
> "the single `font-weight: 700` in `app.css:113` is an existing token
> violation flagged in STATE.md session notes; 12.4 MUST NOT introduce
> new 700 weights."

12.4-02's diff introduces zero new `font-weight` rules (only `overflow-y`
declarations). `git diff apps/planner/src/styles/app.css` confirms.

**Scope assessment:** out of scope for 12.4-02. 12.4 is explicitly told
not to introduce new 700 weights, but is not tasked with removing the
existing one.

**Remediation owner:** future hygiene plan or the existing token-cleanup
backlog referenced in UI-SPEC.md L66.

---
