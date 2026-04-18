---
status: resolved
trigger: "Phase 08 Task 4 UAT: Guardar slot dialog fails with ZodError — projectBuildDocument reads raceId:null/alignmentId:null despite store holding race:human/alignment:lawful-neutral. Direct console call succeeds."
created: 2026-04-17T00:00:00Z
updated: 2026-04-18T00:00:00Z
resolved_by: commit 4f03865
resolved_in: Phase 11 (UAT + Open-Work Closure)
---

## Current Focus

reasoning_checkpoint:
  hypothesis: "projectBuildDocument() has a broken contract with the foundation store: store defaults raceId/alignmentId to null (CanonicalId | null), but buildDocumentSchema requires non-nullable canonicalId strings. Whenever projection runs while the store holds its default null state, Zod throws an opaque error. The symptom-with-UI-populated-values in the dev-server repro is almost certainly a DIFFERENT state than the user believes (likely StrictMode double-mount + HMR invalidating the store module and re-creating it to default state after UI-driven setters wrote to the pre-HMR instance). Regardless of the transient trigger, the schema/store contract is fundamentally fragile — ANY call path that projects when the build is incomplete surfaces a raw ZodError instead of a user-facing disabled-button or typed error."
  confirming_evidence:
    - "buildDocumentSchema.build.raceId = canonicalId (NON-nullable) — see build-document-schema.ts:37"
    - "buildDocumentSchema.build.alignmentId = canonicalId (NON-nullable) — see build-document-schema.ts:39"
    - "foundation store initial state: raceId: null, alignmentId: null — see store.ts:35-43"
    - "projectBuildDocument unconditionally projects foundation.raceId and foundation.alignmentId into the doc — see project-build-document.ts:40,42. No pre-validation."
    - "Zod error text 'expected string, received null' matches exactly what the schema would emit if raceId/alignmentId were null at parse time"
    - "Save button in ResumenBoard is always enabled regardless of build completeness — see resumen-board.tsx:120"
    - "SaveSlotDialog has no try/catch around projectBuildDocument — see save-slot-dialog.tsx:48-58. ZodError escapes as unhandled rejection → dialog stays open + no toast"
  falsification_test: "Add unit test: resetFoundation() → projectBuildDocument() should produce a build-error outcome that dialogs can handle (typed error, not raw ZodError). Current behavior throws raw ZodError. Test will FAIL on current code → confirm reproduction. Apply fix → test passes."
  fix_rationale: "Two-layer defense. (1) Gate: projectBuildDocument throws a typed IncompleteBuildError listing missing fields when store state is not projectable — NEVER a leaky ZodError. (2) UI guard: Guardar (and Exportar/Compartir) are disabled when the build is not projectable. Both layers are needed: UI disable prevents most error surfaces; typed error at the projection boundary catches remaining paths (HMR ghosts, programmatic misuse, future code paths) with a user-facing message. D-07/SHAR-05 preserved: the schema stays strict, we never emit a partial build doc."
  blind_spots: "Not reproducing the exact UI->dev-server->HMR timing that triggered the user's case. If there is a SECOND bug where setRace/setAlignment writes get lost (e.g. because OriginBoard's Cancel-as-reset calls setRace('') which is never used but subtly aliased), this fix will mask but not diagnose it. Mitigation: also audit OriginBoard Cancelar path and document known-ok behavior."

hypothesis: "Contract violation: store default null vs schema required string + no projection-boundary guard + no UI disabled-state guard"
test: "Write targeted failing Vitest that calls projectBuildDocument with default store state (race/alignment null) and expects a typed error, not a raw ZodError"
expecting: "Test FAILS on current code (raw ZodError) → confirms gap. After fix, test passes + UI Guardar button disabled when incomplete"
next_action: "Write regression test + implement IncompleteBuildError + UI disable guard + error-toast fallback in SaveSlotDialog"

## Symptoms

expected: "Click Guardar in SaveSlotDialog → doc is created → slot persisted in Dexie → toast shown"
actual: "ZodError: build.raceId expected string, received null; build.alignmentId expected string, received null. Dialog stays open. listSlots() returns 0."
errors: "ZodError: build.raceId expected string, received null; build.alignmentId expected string, received null"
reproduction: |
  1. Fresh tab localhost:5178
  2. Pick Humano race + Legal neutral alignment + Fuerza=15 via UI
  3. Navigate to Resumen
  4. Click Guardar
  5. Type 'mi-guerrero'
  6. Click Guardar inside dialog
  Direct console call projectBuildDocument('test') SUCCEEDS with the same store state.
started: "Phase 08 Task 4 UAT (new phase-08 work; was never working)"

## Eliminated

## Evidence

- timestamp: 2026-04-17T00:00:00Z
  checked: "buildDocumentSchema at build-document-schema.ts:37-41"
  found: |
    raceId: canonicalId  (NON-nullable, non-empty string regex)
    subraceId: canonicalId.nullable()
    alignmentId: canonicalId  (NON-nullable, non-empty string regex)
    deityId: canonicalId.nullable()
  implication: "Schema REQUIRES raceId and alignmentId to be non-null strings. If store ever holds null, projection always fails."

- timestamp: 2026-04-17T00:00:00Z
  checked: "foundation store.ts:35-43 createInitialFoundationState"
  found: |
    initial state has raceId: null, alignmentId: null, subraceId: null
  implication: "Store CAN legally hold null for raceId/alignmentId (default state). Schema cannot accept null. These two contracts contradict each other — schema assumes race/alignment are always set before projection."

- timestamp: 2026-04-17T00:00:00Z
  checked: "Vite alias in vite.config.ts + tsconfig.base.json paths"
  found: |
    Vite: '@planner' → apps/planner/src (via fileURLToPath)
    TS: '@planner/*' → apps/planner/src/*
    Both agree. No duplicate resolution detected.
  implication: "Hypothesis 3 (duplicate store via aliasing) is UNLIKELY. Every import of @planner/features/character-foundation/store should resolve to the same URL → same module instance → same store."

- timestamp: 2026-04-17T00:00:00Z
  checked: "save-slot-dialog.tsx handleConfirm and doSave"
  found: |
    handleConfirm reads name state → async slotExists → doSave
    doSave calls projectBuildDocument(finalName) which reads useCharacterFoundationStore.getState()
    The dialog uses useCharacterFoundationStore ZERO times (no subscription).
  implication: "Dialog does NOT subscribe to the foundation store. It only indirectly reads via projectBuildDocument → getState(). getState() is NOT closure-captured — it reads live singleton state. So hypothesis 4 (stale React closure) can be ELIMINATED for the getState path."

- timestamp: 2026-04-17T00:00:00Z
  checked: "origin-board.tsx onCancel handler"
  found: |
    onCancel: () => config.onSelect('' as CanonicalId)
    This calls setRace('') or setAlignment('') — setting them to empty string, NOT null.
  implication: "Cancel path sets empty string, not null. So the ZodError 'received null' did NOT come from the Cancel path."

## Resolution

root_cause: |
  Contract violation between useCharacterFoundationStore (raceId/alignmentId default to null)
  and buildDocumentSchema (raceId/alignmentId are non-nullable canonicalId strings).
  projectBuildDocument() projected nullable store fields directly into the strict schema,
  so any call path where the store held null → opaque ZodError with no typed surface for
  callers. Additionally, the Resumen action bar left Guardar/Exportar/Compartir enabled
  regardless of build completeness, allowing the error surface to be reached. The exact
  Vite-HMR-stale-store scenario reported in the UAT was a trigger, not the root: any
  projection-before-origin-complete hits the same failure.

fix: |
  Two-layer defense, no schema weakening (D-07 / SHAR-05 preserved):
  1. projectBuildDocument() now throws a typed IncompleteBuildError listing missing fields
     (['raceId'] | ['alignmentId'] | ['raceId','alignmentId']) BEFORE hitting Zod. Callers
     can catch + show a user-facing toast instead of a raw ZodError.
  2. isBuildProjectable() pure predicate exposed so the UI can disable action buttons.
  3. ResumenBoard subscribes to raceId/alignmentId and disables Guardar/Exportar/Compartir
     when either is null (title-tooltip explains why). Cargar/Importar stay enabled —
     they hydrate stores, so they're the recovery path for incomplete builds.
  4. Spanish copy key `persistence.incompleteBuild` added.
  5. SaveSlotDialog + ResumenBoard onExport/onShare wrap projection calls in try/catch,
     catch IncompleteBuildError → pushToast('warn'), and otherwise re-throw.

verification: |
  - RED: added tests/phase-08/project-build-document-incomplete.spec.ts with 8 cases
    covering the incomplete-build guard + the isBuildProjectable predicate. Before the
    fix, all 8 failed (IncompleteBuildError/isBuildProjectable did not exist). After
    the fix, all 8 pass.
  - GREEN: full test run — 376/376 passing (367 baseline + 8 guard tests + 1 new UAT
    disabled-button regression test in resumen-board.spec.tsx).
  - Existing resumen-board + share-fallback tests updated to seed the foundation store
    with race:human + alignment:lawful-good so the new UI guard does not disable the
    buttons they were exercising; this matches real-user flow (users select race and
    alignment before reaching Resumen).
  - corepack pnpm typecheck: no new type errors. Pre-existing 3 errors in
    tests/phase-03/foundation-validation.spec.ts (unrelated DeityRuleRecord type drift)
    remain; confirmed by running typecheck against HEAD with my changes stashed.
  - D-07 / SHAR-05: buildDocumentSchema is UNCHANGED. No partial BuildDocument can be
    emitted. Hydration path (hydrateBuildDocument) is untouched.
  - Awaiting human verification on the dev server: Resumen → Guardar with race+alignment
    set now persists a slot; Resumen without race+alignment shows the Guardar button
    disabled with the Spanish tooltip.

files_changed:
  - apps/planner/src/features/persistence/project-build-document.ts  (IncompleteBuildError, isBuildProjectable, pre-projection guard)
  - apps/planner/src/features/persistence/index.ts  (re-export)
  - apps/planner/src/features/summary/resumen-board.tsx  (disabled-state + try/catch)
  - apps/planner/src/features/summary/save-slot-dialog.tsx  (try/catch in doSave)
  - apps/planner/src/lib/copy/es.ts  (persistence.incompleteBuild key)
  - tests/phase-08/project-build-document-incomplete.spec.ts  (NEW, 8 regression tests)
  - tests/phase-08/resumen-board.spec.tsx  (seed store, new disabled-state test)
  - tests/phase-08/share-fallback.spec.tsx  (seed store in beforeEach)

## Closure — 2026-04-18 (Phase 11)

Fix shipped in commit **4f03865** — `fix(08): guard projectBuildDocument against
null race/alignment`. Phase 08 UAT confirmed: Guardar / Exportar / Compartir now
disabled when raceId or alignmentId are null; when both are set, the slot persists
in Dexie and a Spanish toast surfaces. Full test suite 376/376 at the time of the
fix; no regression since through Phases 09 and 10.

**Verification evidence** (checked 2026-04-18 against HEAD):
- `apps/planner/src/features/persistence/project-build-document.ts` exports
  `IncompleteBuildError` class and `isBuildProjectable()` predicate.
- `apps/planner/src/features/summary/resumen-board.tsx` gates Guardar / Exportar /
  Compartir on raceId + alignmentId being non-null and catches IncompleteBuildError
  on the action paths.
- `apps/planner/src/features/summary/save-slot-dialog.tsx` catches
  IncompleteBuildError in `doSave` and pushes a Spanish warn-toast instead of
  bubbling a raw ZodError.

Debug session closed and moved to `.planning/debug/resolved/`.
