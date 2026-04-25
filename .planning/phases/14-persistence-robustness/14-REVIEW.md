---
phase: 14-persistence-robustness
reviewed: 2026-04-25T19:15:00Z
depth: standard
files_reviewed: 17
findings:
  blocker: 0
  critical: 0
  high: 0
  medium: 3
  low: 4
  nit: 4
  total: 11
status: issues_found
---

# Phase 14 Code Review

**Reviewed:** 2026-04-25T19:15:00Z
**Depth:** standard
**Files reviewed:** 17

## Summary

Phase 14 ships a coherent, low-risk hardening pass. Toast FIFO queue, LoadSlotResult union, buildName round-trip, scheme-aware double-slash collapse, abilityModifier consolidation, and version-header docstring sentinel are all implemented as specified, with strong test coverage (48/48 phase-14 specs green, 0 new regressions).

No critical or high-severity issues. Three medium findings cover defense-in-depth gaps:
1. Dexie-rejection escape narrowly missed by 14-02 LoadSlotResult typing
2. ZodError leak via unbounded `foundation.buildName` if a future Resumen rename UI ships
3. Silent `subraceId` drop on parentage mismatch during hydrate

## Medium Findings

### MR-01: `LoadSlotDialog.onPick` lacks Dexie-rejection guard

**File:** `apps/planner/src/features/persistence/slot-api.ts:43-49` (interaction with `apps/planner/src/features/summary/save-slot-dialog.tsx:157-192`)

`await getPlannerDb().builds.get(name)` inside `loadSlot` is unwrapped — a Dexie rejection (transaction abort, IndexedDB quota error, browser storage revoked) bubbles past `safeParse`. `onPick` awaits `loadSlot` with no try/catch → unhandled promise rejection → silent UX failure with console error. Same shape Phase 14-02 set out to eliminate, just routed through Dexie instead of Zod.

**Fix:** wrap the Dexie await in `loadSlot` so the contract is uniform across all error paths.

### MR-02: `projectBuildDocument` can throw raw `ZodError` on unbounded `foundation.buildName`

**File:** `apps/planner/src/features/persistence/project-build-document.ts:80,122` (interaction with `apps/planner/src/features/character-foundation/store.ts:94`)

`setBuildName` is unbounded (Phase 14-03 A5 spec asserts setter accepts 200-char input). Today the only callers cap at 80 (hydrate via schema, SaveSlotDialog via `maxLength={80}`). A future Resumen rename UI calling `setBuildName(longName)` would silently succeed, then `projectBuildDocument(undefined)` falls through to `foundation.buildName` and throws raw ZodError at line 122. `SaveSlotDialog` only catches `IncompleteBuildError`.

**Fix:** coerce in `projectBuildDocument`:
```ts
const storeName = foundation.buildName;
const fallbackName = storeName !== null && storeName.length <= 80 ? storeName : undefined;
const resolvedName = name ?? fallbackName;
```

### MR-03: `hydrateBuildDocument` silently drops `subraceId` on parentage mismatch

**File:** `apps/planner/src/features/persistence/hydrate-build-document.ts:38-40` (interaction with `apps/planner/src/features/character-foundation/store.ts:103-106`)

`setSubrace(subraceId)` runs `subraceMatchesRace(state.raceId, subraceId) ? subraceId : null`. Schema `canonicalIdRegex` only validates string shape, not parentage. A migrated build (race table changed between datasets) hydrates with `subraceId=null` and no user feedback. Fail-quiet, not fail-closed.

**Fix:** add `superRefine` parentage check at the schema boundary OR surface a warning toast when the setter rejects.

## Low Findings

- **LR-01** `pushToast(body)` accepts unbounded `body` length; T-14-01-03 caps count not bytes.
- **LR-02** `__resetToastForTests` does not reset `nextId`; tests across files see ever-incrementing IDs.
- **LR-03** `Toast` 5s auto-dismiss timer rearms on every `msg.id` change; burst behavior keeps region populated longer than docstring implies.
- **LR-04** `MAX_ENCODED_PAYLOAD_LENGTH = 1900` budget does not account for collapsed slashes; documentation-only.

## Nit Findings

- **NT-01** Mixed barrel vs deep-path imports for `@rules-engine/foundation` symbols (character-sheet.tsx, attributes-board.tsx).
- **NT-02** `pushToast` queue cap uses `>=` (correct; confirmation only).
- **NT-03** `version-mismatch.ts` cites `:30-33` line range (drift-prone; symbol-name reference would be more durable).
- **NT-04** `resumen-selectors.ts` Phase 14-05 comment references "line ~184" which is now line 186.

## Threat-Register Spot-Check

| Threat | Status |
|---|---|
| T-14-01-02 XSS via toast body | Preserved (React auto-escape) |
| T-14-01-03 DoS via unbounded queue | Closed (length cap = 8) |
| T-14-02-01 Tampered Dexie row (Zod escape) | Closed |
| T-14-02-01 Tampered Dexie row (Dexie escape) | **Open — see MR-01** |
| T-14-02-02 Reason-string disclosure | Closed (curated copy used) |
| T-14-03-01 name >80 char at hydrate boundary | Closed at schema |
| T-14-03-01 name >80 char at projection boundary | **Open — see MR-02** |
| T-14-04-04 Path-segment leak via `//` | Closed (regex covers all 3 return paths) |
| T-14-05-01 abilityModifier drift | Closed (sentinel spec) |
| T-14-06-01 version-header docstring drift | Closed (parity sentinel) |

## Recommendation

Run `/gsd-code-review-fix 14` to auto-resolve MR-01 + MR-02 + MR-03. LOW + NIT items are optional polish.
