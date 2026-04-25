---
phase: 14-persistence-robustness
plan: 02
subsystem: persistence
tags: [persistence, dexie, zod, discriminated-union, fail-closed, lang-01, vitest, rtl]

requires:
  - phase: 08-persistence-share
    provides: loadSlot Dexie API + buildDocumentSchema + LoadSlotDialog onPick
  - phase: 10-fail-closed-load
    provides: diffRuleset gate that this plan must NOT regress (load-slot-version-mismatch.spec.tsx)
provides:
  - LoadSlotResult discriminated union ({kind:'ok'|'not-found'|'invalid'}) replaces BuildDocument | null
  - safeParse-based loadSlot that no longer throws ZodError to the caller
  - Spanish loadInvalid toast surfaced on tampered Dexie row reads
  - Two regression specs locking the union shape (pure-logic + RTL toast)
affects: [14-03-onwards, milestone-v1.0-tech-debt, share-entry, json-import]

tech-stack:
  added: []
  patterns:
    - "Zod safeParse + ZodError.message captured into discriminated-union 'reason' field — typed error projection at trust boundary (Pitfall 6 mitigation)"
    - "Discriminated-union with switch (result.kind) caller wiring — exhaustive case branches, no `if (!doc)` truthy-null pattern"
    - "Curated user-visible Spanish copy in toast; raw Zod reason kept for developer console only (T-14-02-02 information-disclosure accept)"
    - "Test harness composes <LoadSlotDialog /> + <Toast /> in a sibling div so pushToast text is observable via RTL findByText"

key-files:
  created:
    - tests/phase-14/load-slot-noop-result.spec.ts
    - tests/phase-14/load-slot-dialog-invalid-toast.spec.tsx
  modified:
    - apps/planner/src/features/persistence/slot-api.ts
    - apps/planner/src/features/persistence/index.ts
    - apps/planner/src/features/summary/save-slot-dialog.tsx
    - apps/planner/src/lib/copy/es.ts
    - tests/phase-08/slot-api.spec.ts

key-decisions:
  - "loadSlot signature flipped from Promise<BuildDocument | null> to Promise<LoadSlotResult> instead of adding an out-parameter or callback — caller migration is a localized switch, not a refactor across the persistence surface"
  - "ZodError.message exposed as result.reason for developer debugging but DELIBERATELY NOT surfaced to the user-visible toast — curated `loadInvalid` copy interpolates only `{name}` (slot name capped at 80 chars by buildDocumentSchema), avoiding schema-internal leak (T-14-02-02 accept)"
  - "Caller's `not-found` arm is silent (no toast, dialog stays open) — preserves pre-Phase-14-02 behaviour for the listSlots-then-pick race; only `invalid` adds a toast"
  - "Phase-08 slot-api spec updated as Rule-3 auto-fix (blocking issue caused directly by the LoadSlotResult signature change in Task 1) — same coverage, new contract"
  - "RTL spec creates a Harness component that mounts <Toast /> alongside <LoadSlotDialog /> so pushToast output is observable; pattern reusable for any future dialog spec that needs to verify toast surfacing"

patterns-established:
  - "loadSlot now models Dexie-row trust boundary in the type system — three explicit outcomes, exhaustive switch enforced by the type checker"
  - "Sibling-mount harness for dialog+toast specs (Phase 14-02 RTL convention)"
  - "Spanish-first user copy + English/raw developer reason — consistent split for fail-closed surfaces"

requirements-completed:
  - SHAR-02
  - SHAR-05

duration: ~16min
completed: 2026-04-25
---

# Phase 14 Plan 02: loadSlot LoadSlotResult Discriminated Union Summary

Hardens `loadSlot` so a tampered Dexie row produces a typed `{kind:'invalid', reason}` projection of the ZodError instead of bubbling an unhandled rejection through `LoadSlotDialog.onPick`; closes ROADMAP SC#2 (Phase 14) and partially closes SC#7 (UI path).

## Objective

Pre-Phase-14-02 `loadSlot` returned `Promise<BuildDocument | null>` and called `buildDocumentSchema.parse(row.payload)` with no try/catch. A tampered Dexie row (extension manipulation, cross-version drift after a downgrade) caused Zod to throw, the error bubbled up through `LoadSlotDialog.onPick` as an unhandled rejection, and the user saw nothing while the console accumulated a ZodError stack. This plan replaces the nullable return with a typed `LoadSlotResult` discriminated union, switches the load path to `buildDocumentSchema.safeParse`, and surfaces a curated Spanish toast on the `invalid` arm.

## What Changed

### Source files

- **`apps/planner/src/features/persistence/slot-api.ts`** — Added `LoadSlotResult` discriminated union with three arms (`ok` / `not-found` / `invalid`); replaced the throwing `parse(row.payload)` call with `safeParse` and projected the failure onto `{kind:'invalid', reason: parsed.error.message}`. Updated the docstring to reflect the new contract and the Phase 14-02 hardening rationale.
- **`apps/planner/src/features/persistence/index.ts`** — Re-exported `type LoadSlotResult` from the persistence barrel so callers can refer to the type without reaching past the barrel.
- **`apps/planner/src/features/summary/save-slot-dialog.tsx`** — Replaced `LoadSlotDialog.onPick`'s `if (!doc)` truthy-null guard with an exhaustive `switch (result.kind)`. The `not-found` arm silently returns (preserves the listSlots/pick race behaviour). The `invalid` arm pushes a `warn` toast with the new `loadInvalid` copy and intentionally does NOT call `setMismatch`, `hydrateBuildDocument`, or `onClose` so the dialog stays open. The `ok` arm preserves the existing `diffRuleset` gate + `hydrateBuildDocument` + `loadSuccess` toast + `onClose` flow.
- **`apps/planner/src/lib/copy/es.ts`** — Added `shellCopyEs.persistence.loadInvalid`: `'No se pudo cargar la build "{name}": archivo dañado o de una versión incompatible. Usa Importar JSON con un archivo válido.'`. Mirrors the existing `loadSuccess` template's `{name}` interpolation contract.

### Tests

- **`tests/phase-14/load-slot-noop-result.spec.ts` (NEW, pure-logic)** — 5 assertions: B1 not-found arm (no row), B2 ok arm with round-trip identity at `result.doc.build.raceId`, B3 invalid arm via direct Dexie put with `schemaVersion: 99` (violates `z.literal(2)`), B4 sentinel that resolved value is never null/undefined, B5 type-only sentinel (`const _typeCheck: LoadSlotResult = await loadSlot('foo')`) proving the barrel exports the type.
- **`tests/phase-14/load-slot-dialog-invalid-toast.spec.tsx` (NEW, RTL)** — 2 assertions: C1 ok-arm hydrate + onClose for a valid slot, C2 invalid-arm `loadInvalid` Spanish toast surfaced + `raceId` still null + `onClose` NOT called for a tampered row. Mounts `<LoadSlotDialog />` and `<Toast />` as siblings via a small `Harness` component.
- **`tests/phase-08/slot-api.spec.ts` (MODIFIED — Rule 3)** — Two pre-existing assertions against the old `Promise<null> | BuildDocument` shape were updated to the new union (`expect(loaded.kind).toBe('ok')` + `expect(loaded).toEqual({ kind: 'not-found' })`). Same coverage, new contract.

## Verification

| Suite | Result | Notes |
|---|---|---|
| `tests/phase-14/load-slot-noop-result.spec.ts` | 5/5 PASS | Locks the union shape in a pure-node env |
| `tests/phase-14/load-slot-dialog-invalid-toast.spec.tsx` | 2/2 PASS | Locks the caller switch + Spanish toast |
| `tests/phase-14/toast-clobber-race.spec.tsx` | 6/6 PASS | Untouched (Phase 14-01 invariant) |
| `tests/phase-10/load-slot-version-mismatch.spec.tsx` | 2/2 PASS | Phase 10 fail-closed gate still green |
| `tests/phase-08/slot-api.spec.ts` | 7/7 PASS | Rule-3 update; same coverage |
| `tests/phase-08/save-slot-dialog.spec.tsx` | 5/5 PASS | Untouched |
| `tsc --noEmit` | 0 NEW errors | Baseline of 4 pre-existing errors preserved |

### Acceptance gates (greps)

| Gate | Expected | Actual |
|---|---|---|
| `grep -c "export type LoadSlotResult" slot-api.ts` | 1 | 1 |
| `grep -cE "kind: 'ok'\|kind: 'not-found'\|kind: 'invalid'" slot-api.ts` | ≥3 | 9 |
| `grep -c "buildDocumentSchema.safeParse" slot-api.ts` | 1 | 1 |
| `grep -c "buildDocumentSchema.parse(row.payload)" slot-api.ts` | 0 | 0 |
| `grep -c "type LoadSlotResult" persistence/index.ts` | 1 | 1 |
| `grep -c "loadInvalid:" copy/es.ts` | 1 | 1 |
| `grep -c "No se pudo cargar la build" copy/es.ts` | 1 | 1 |
| `grep -c "switch (result.kind)" save-slot-dialog.tsx` | 1 | 1 |
| `grep -c "case 'invalid':" save-slot-dialog.tsx` | 1 | 1 |
| `grep -cE "^\s*if \(\!doc\) return;" save-slot-dialog.tsx` | 0 | 0 |
| `grep -c "^  it(" load-slot-dialog-invalid-toast.spec.tsx` | 2 | 2 |

## Threat Register Disposition

| Threat ID | Category | Disposition | Outcome |
|---|---|---|---|
| T-14-02-01 | Tampering | mitigate | Closed — tampered Dexie row produces `{kind: 'invalid'}` instead of unhandled rejection; locked by B3 + C2 |
| T-14-02-02 | Information Disclosure | accept | Raw Zod reason kept for developer console only; user-visible toast uses curated `loadInvalid` copy with `{name}` interpolation only |
| T-14-02-03 | Denial of Service | accept | Browser-enforced IndexedDB quota caps payload size; safeParse does not allocate proportional to input |
| T-14-02-04 | Repudiation / SHAR-05 | mitigate | `kind: 'invalid'` arm short-circuits BEFORE `diffRuleset` and BEFORE `hydrateBuildDocument`; locked by C2 spec assertion `raceId === null` |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking issue] phase-08/slot-api.spec.ts asserted against the old `Promise<null> | BuildDocument` shape**

- **Found during:** Task 2 verification (pnpm vitest run tests/phase-08/slot-api.spec.ts).
- **Issue:** The spec uses `expect(loaded?.build.raceId).toBe(...)` and `expect(loaded).toBeNull()` — both fail typecheck after Task 1 because `loaded` is now `LoadSlotResult` (no `build` property; never null). Plan-text mentioned tests/phase-08/save-slot-dialog.spec.tsx in the Task 2 acceptance batch but did NOT mention this slot-api.spec.ts file.
- **Fix:** Updated the two affected `it()` blocks in tests/phase-08/slot-api.spec.ts to switch on `loaded.kind` and use `expect(loaded).toEqual({kind:'not-found'})`. Same coverage, new contract.
- **Files modified:** tests/phase-08/slot-api.spec.ts.
- **Commit:** Bundled into Task 2 commit (67f64e2).

**2. [Rule 3 - Blocking issue] Worktree had no installed node_modules; vitest could not resolve `dexie`**

- **Found during:** First spec run inside the worktree (`pnpm vitest run tests/phase-14/load-slot-noop-result.spec.ts`).
- **Issue:** The worktree was created from `git worktree add` without a workspace install; Vite reported `Failed to resolve import "dexie" from apps/planner/src/features/persistence/dexie-db.ts`. Tests cannot run.
- **Fix:** `corepack pnpm install --offline` resolved 145 packages from the existing pnpm store and added them to the worktree's node_modules. Spec then ran 5/5 GREEN.
- **Files modified:** none (only node_modules side-effect).
- **Commit:** none (install is local to the worktree filesystem).

### Authentication Gates

None.

### Architectural Changes

None — the plan was a localized API contract change; no new tables, new layers, or breaking schema bumps. `buildDocumentSchema.schemaVersion` literal preserved at `2`; SHAR-05 share-URL invariant untouched.

## Commits

| Step | Hash | Message |
|---|---|---|
| Task 1 (RED + GREEN, slot-api + barrel + pure-logic spec) | e456730 | feat(14-02): typed LoadSlotResult discriminated union (test+impl) |
| Task 2 (caller migration + Spanish copy + RTL spec + phase-08 Rule-3 update) | 67f64e2 | feat(14-02): wire LoadSlotResult into LoadSlotDialog with Spanish loadInvalid toast |

## Self-Check: PASSED

Files verified to exist on disk:

- `apps/planner/src/features/persistence/slot-api.ts` — FOUND (LoadSlotResult union + safeParse loadSlot)
- `apps/planner/src/features/persistence/index.ts` — FOUND (exports `type LoadSlotResult`)
- `apps/planner/src/features/summary/save-slot-dialog.tsx` — FOUND (switch on result.kind)
- `apps/planner/src/lib/copy/es.ts` — FOUND (loadInvalid Spanish copy)
- `tests/phase-14/load-slot-noop-result.spec.ts` — FOUND (5 it() blocks)
- `tests/phase-14/load-slot-dialog-invalid-toast.spec.tsx` — FOUND (2 it() blocks)
- `tests/phase-08/slot-api.spec.ts` — FOUND (Rule-3 updated assertions)

Commits verified in `git log` of branch `worktree-agent-a954060b4dd2faf5f`:

- e456730 — FOUND
- 67f64e2 — FOUND
