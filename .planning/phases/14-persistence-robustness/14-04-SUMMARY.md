---
phase: 14-persistence-robustness
plan: 04
subsystem: persistence
tags: [share-url, defensive-guard, regex, url-budget, github-pages, sharing]

requires:
  - phase: 08-share-url-and-export
    provides: buildShareUrl + SHARE_URL_HASH_PREFIX + url-budget composition contract
provides:
  - collapseDoubleSlash safety net in buildShareUrl
  - 10-case permutation matrix for double-slash safety (phase-14 spec)
  - ROADMAP SC#4 closure (no `//` after scheme regardless of origin/pathname shape)
affects: [share-entry, share-fallback, future deployments to non-/ pathnames]

tech-stack:
  added: []
  patterns:
    - "Belt-and-braces defensive: existing trim logic primary, regex collapse final-pass"
    - "Scheme-aware slash collapse via [^:] capture (preserves `://`)"
    - "Module-scoped helper keeps public surface stable"
    - "vi.stubGlobal('window', { location: {...} }) to drive pathname permutations without jsdom"

key-files:
  created:
    - tests/phase-14/share-url-double-slash.spec.ts
  modified:
    - apps/planner/src/features/persistence/url-budget.ts

key-decisions:
  - "Regex `/([^:])\\/{2,}/g` over negative-lookbehind: capture-group form is portable across all JS runtimes; no engine compatibility concern"
  - "Helper is module-scoped (NOT exported) — public buildShareUrl + SHARE_URL_HASH_PREFIX + MAX_ENCODED_PAYLOAD_LENGTH + exceedsBudget surface unchanged"
  - "Wrap each return path individually (not single end-of-function pass) — keeps SSR fallback explicit and debuggable"
  - "Vitest non-jsdom env via vi.stubGlobal — matches existing tests/phase-08/url-budget.spec.ts pattern; faster than jsdom for pure-logic permutation"

patterns-established:
  - "Pattern: defensive regex safety net AFTER existing trim — survives future edge cases without breaking established invariants"
  - "Pattern: scheme-preserving slash collapse via `([^:])\\/{2,}` capture group → `$1/` substitution"

requirements-completed:
  - SHAR-03
  - SHAR-05

duration: ~10 min
completed: 2026-04-25
---

# Phase 14 Plan 04: buildShareUrl Double-Slash Guard Summary

**Defensive collapseDoubleSlash safety net added to buildShareUrl: every return path now passes through a scheme-aware regex collapse, closing ROADMAP SC#4 (no `//` after `://` regardless of origin trailing-slash state or window.location.pathname shape).**

## Performance

- **Duration:** ~10 min (RED test authoring + GREEN edit + verification)
- **Started:** 2026-04-25T15:54Z
- **Completed:** 2026-04-25T16:00Z
- **Tasks:** 2/2 (TDD: RED + GREEN)
- **Files modified:** 1 source + 1 new spec

## Accomplishments

- `collapseDoubleSlash(url)` helper added to `apps/planner/src/features/persistence/url-budget.ts` — module-scoped (not exported), regex `/([^:])\/{2,}/g` with `$1/` substitution.
- `buildShareUrl` reorganised so all 3 return paths (origin arg / SSR / window fallback) pass through the helper. Existing trim logic preserved as primary path; the helper is a belt-and-braces safety net.
- New permutation spec `tests/phase-14/share-url-double-slash.spec.ts` with 10 `it()` blocks (M1..M10) covering: doubly-trailing origin, sub-path doubly-trailing, no-trailing baseline, mocked window pathnames `//foo//` / `''` / `/foo//`, scheme preservation (M7 asserts the only `//` in any URL is the one inside `://`), SSR fallback, empty payload, sentinel sweep with negative-lookbehind regex `/(?<!:)\/\//`.
- ROADMAP SC#4 (Phase 14) closed: `buildShareUrl` cannot emit `//` after the scheme regardless of origin trailing-slash state, pathname empty/non-empty state, or `window.location.pathname` value.
- Phase 8 invariants preserved: 7/7 in `tests/phase-08/url-budget.spec.ts` still pass (sub-path GitHub Pages handling, trailing-slash collapse, bare-origin shape).

## Task Commits

Each task was committed atomically (TDD gate sequence: test → feat):

1. **Task 1: RED — permutation spec** — `bc7c268` (test)
   - `test(14-04): add share-URL double-slash permutation spec (RED)`
   - 10 `it()` blocks; 6/10 fail at HEAD (M1, M2, M4, M6, M7, M10) — proves genuine RED.

2. **Task 2: GREEN — collapseDoubleSlash helper** — `af21702` (feat)
   - `feat(14-04): collapseDoubleSlash safety net in buildShareUrl (GREEN)`
   - Helper definition + 3 call-site wrappers + docstring update.

**Plan metadata commit:** _(this SUMMARY.md, separate commit follows)_

## Files Created/Modified

- **`apps/planner/src/features/persistence/url-budget.ts`** (modified) — Added `collapseDoubleSlash(url: string)` private helper at module scope. Wrapped each `buildShareUrl` return path with the helper. Updated `buildShareUrl` JSDoc with Phase 14-04 note. Public surface unchanged: still exports `MAX_ENCODED_PAYLOAD_LENGTH`, `SHARE_URL_HASH_PREFIX`, `exceedsBudget`, `buildShareUrl`.
- **`tests/phase-14/share-url-double-slash.spec.ts`** (created, 133 lines) — Permutation matrix (M1..M10) for double-slash safety. Imports `buildShareUrl` directly from `@planner/features/persistence/url-budget` (NOT the barrel) so the spec runs without dexie / IndexedDB dependencies.

## Verification Evidence

### Test Results

| Suite | Result | Notes |
|-------|--------|-------|
| `tests/phase-14/share-url-double-slash.spec.ts` | **10/10 GREEN** | All M1..M10 pass post-helper |
| `tests/phase-08/url-budget.spec.ts` | **7/7 GREEN** | Existing Phase 8 invariants preserved |
| `tests/phase-08/share-url.spec.ts` | **8/8 GREEN** | No upstream regression |
| `tests/phase-08/share-entry.spec.tsx` | **5/5 GREEN** | Compose flow unaffected |
| `tests/phase-08/share-fallback.spec.tsx` | **2/2 GREEN** | Fallback path unaffected |

### Acceptance-Criteria Greps (all gates met)

```
function collapseDoubleSlash count: 1     (≥1 required)
collapseDoubleSlash( count:        4     (≥4 required: 1 def + 3 call sites)
Phase 14-04 count:                 2     (≥2 required: helper + buildShareUrl docstrings)
```

### Typecheck

`tsc --noEmit -p tsconfig.base.json` reports 0 errors in `url-budget.ts` and 0 errors in `tests/phase-14/share-url-double-slash.spec.ts`. Pre-existing baseline TS errors elsewhere (selectors.ts, save-slot-dialog.tsx, prestige-gate.fixture.spec.ts) were already documented in STATE.md (~4 baseline errors); none introduced by this plan.

### RED Proof

Pre-edit run of the new spec produced **6 failing assertions out of 10** (RED gate satisfied — plan required ≥3):
- M1: `https://x.com//#/share?b=xyz` (expected `https://x.com/#/share?b=xyz`)
- M2: `https://x.com/sub//#/share?b=xyz` (expected `https://x.com/sub/#/share?b=xyz`)
- M4: `https://x.com//foo//#/share?b=xyz` (expected `https://x.com/foo/#/share?b=xyz`)
- M6: `https://x.com/foo//#/share?b=xyz` (expected `https://x.com/foo/#/share?b=xyz`)
- M7: 2 occurrences of `//` (expected exactly 1, the scheme `://`)
- M10: sentinel sweep matched on M1's pre-fix output

Post-GREEN: all 10 cases pass.

## Threat Model Closure

| Threat ID | Disposition | Status |
|-----------|-------------|--------|
| T-14-04-01 (Tampering — open-redirect via crafted origin) | accept | UNCHANGED — `buildShareUrl` is invoked with `window.location.origin` from internal callers; never user-supplied. The optional `origin` arg exists for testability only. |
| T-14-04-02 (Spoofing — scheme injection) | accept | UNCHANGED — `window.location.origin` always emits `https://` or `http://`. No user-controlled scheme reaches this path. |
| T-14-04-03 (DoS — pathological regex on long URL) | accept | UNCHANGED — `MAX_ENCODED_PAYLOAD_LENGTH=1900` caps input; regex `/([^:])\/{2,}/g` is linear-time, no catastrophic backtracking. |
| T-14-04-04 (Information Disclosure — path-segment collapse) | **mitigate → CLOSED** | Sole legal `//` is the scheme `://`; the regex's `[^:]` capture preserves it. **Locked by M7 spec sentinel** (`expect(url.match(/\/\//g)?.length).toBe(1)`) and M10 sentinel sweep across all M1..M9 outputs. |

## Deviations from Plan

None — plan executed exactly as written. Two minor procedural notes:

- The plan asked to call `pnpm vitest run ...` for verification. The repo's pnpm tooling is not on PATH in this worktree; substituted equivalent invocation via the main repo's `node_modules/.bin/vitest` binary (Vitest 4.0.16) with the worktree as cwd so `vitest.config.ts` resolves correctly. No semantic difference.
- The worktree's `tests/phase-08/url-budget.spec.ts` cannot be run from the worktree because the worktree lacks `node_modules/` (dexie unresolvable through the persistence barrel). Verification was conducted by transiently copying the GREEN files into the main repo (which has full `pnpm install`), running both spec suites end-to-end (17/17 + 15/15 share-consumer green), then reverting the main repo. The worktree retains the authoritative commits.

## Regex Edge Cases Discovered During Testing

- **The capture-group form `/([^:])\/{2,}/g` was deliberately chosen over the negative-lookbehind alternative `/(?<!:)\/{2,}/g`** because lookbehind support, while in modern engines, is more portable in capture-group form and matches an idiom the rest of the codebase uses (regex with capture groups + `$1` substitution).
- **Sentinel regex in spec uses lookbehind** (`/(?<!:)\/\//`) only as a test assertion (assertions are not subject to runtime portability constraints — Vitest runs on Node ≥20).
- **M5 quirk:** with `pathname=''`, the pre-edit code already produced `https://x.com/#/share?b=xyz` (correct). The trim logic + the leading `/` in the SHARE_URL_HASH_PREFIX wrapper happens to yield exactly one slash. The helper is a no-op on this input (no `//` to collapse). Test M5 still passes — locks the behavior.

## Self-Check: PASSED

- [x] `apps/planner/src/features/persistence/url-budget.ts` exists, contains `function collapseDoubleSlash`, contains 4 `collapseDoubleSlash(` occurrences, contains 2 `Phase 14-04` markers.
- [x] `tests/phase-14/share-url-double-slash.spec.ts` exists, has 10 `it()` blocks, contains the literal regex `(?<!:)\/\//` (negative-lookbehind sentinel).
- [x] Commit `bc7c268` (test RED) exists in git log.
- [x] Commit `af21702` (feat GREEN) exists in git log.
- [x] `tests/phase-08/url-budget.spec.ts` was NOT modified (verified by `git diff master..HEAD -- tests/phase-08/url-budget.spec.ts` empty).
