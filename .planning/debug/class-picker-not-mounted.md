---
slug: class-picker-not-mounted
status: fixed
trigger: "L1 class picker renders single flat <section> 'Selecciona la clase del nivel N' with 39 classes intermingled, legacy .option-list__item className, ZERO .class-picker__* namespace in live DOM. <ClassPicker> component at apps/planner/src/features/level-progression/class-picker.tsx exists but is NOT mounted in the live shell. Phase 12.4-06 R1 (CLAS-01) regression — Phase 12.4-06 mounted <ClassPicker /> in level-sheet.tsx, but the shell route bypasses LevelSheet entirely and renders BuildProgressionBoard instead. User reported perceived 'clases básicas oscuras' — in reality all font-weight:400 uniform; 4 rows opacity:1 (eligible) vs 35 rows is-blocked opacity:0.6 driving perceived contrast. Blocks milestone v1.0 audit."
created: "2026-04-20T11:00:00Z"
updated: "2026-04-20T11:35:00Z"
phase_context: "post Phase 12.4 (construccion-correctness-clarity) — all 9 plans functionally complete"
severity: high
blocks_milestone: "v1.0"
---

# Debug Session: class-picker-not-mounted

## Symptoms

- **Expected behavior:** At any level N (L1..L16), the class picker renders two `<section>` elements: "Clases básicas" (11 NWN base classes + Puerta base classes when extractor enriched) and "Clases de prestigio" (all others) with `aria-labelledby` wiring. DOM carries `.class-picker__*` CSS namespace. Prestige rows marked blocked with reason "Disponible a partir del nivel 2" or "Requisitos en revisión". Contract from Phase 12.4-06 R1 (CLAS-01).

- **Actual behavior (live, tab 761726329 @ http://127.0.0.1:5173/ on 2026-04-20):**
  - Click L2 in level-rail → `document.querySelectorAll('[class*=class-picker__]').length === 0`
  - `document.querySelectorAll('.option-list__item').length === 39`
  - Single `<section class="nwn-frame selection-screen">` with heading "Selecciona la clase del nivel 2" containing 39 flat items.
  - Base + prestige intermingled alphabetically.

- **Error messages:** None in console (no exception). Silent wiring gap.

- **Timeline:** Phase 12.4-06 extracted `<ClassPicker>` and mounted it in `level-sheet.tsx`, but the shell's `center-content.tsx` routes `activeLevelSubStep === 'class'` to `<BuildProgressionBoard />` (not `<LevelSheet />`). `BuildProgressionBoard` still renders legacy `<SelectionScreen>` + `<OptionList>` + `<DetailPanel>`. The 12.4-06 SUMMARY Self-Check asserted `<ClassPicker />` mount in `level-sheet.tsx` but never checked `build-progression-board.tsx` — which is the only component actually mounted by `center-content.tsx:33`. `LevelSheet` is effectively dead code in the current route graph.

- **Reproduction:**
  1. `cd apps/planner && npx vite --host 127.0.0.1` (already running as background task `bsh4vivcr` on port 5173)
  2. Open `http://127.0.0.1:5173/`
  3. Persisted state loads: Raza Humano / Alineamiento Legal neutral / Atributos complete / L1 Guerrero is-legal
  4. Click level-rail button `2`
  5. Inspect right panel → single flat class list, no base/prestige split

## Current Focus

```yaml
hypothesis: "Fix applied — BuildProgressionBoard refactored to mount <ClassPicker /> inside its <SelectionScreen> slot, replacing the legacy <OptionList>. <DetailPanel> retained for selected-class description + gains."
test: "Re-run vitest full suite; expect 629/630 baseline (only DEF-12.4-02 font-weight:700 deferred). Phase-04 tests that queried role='option' migrated to data-class-id targeting."
expecting: "Post-fix: full suite 629/630 green + tests/phase-12.4/class-picker-grouping.spec.tsx + tests/phase-12.4/prestige-gate.fixture.spec.ts + tests/phase-12.4/feat-picker-scroll.spec.tsx 22/22 green + tsc --noEmit -p apps/planner exit 0. Live DOM at L2 picker shows .class-picker__section-heading × 2, .option-list__item × 0 inside center panel."
next_action: "Verification complete — session closed. User to confirm live DOM post-HMR. Follow-up: add an integration RTL spec that asserts BuildProgressionBoard includes 'Clases básicas'/'Clases de prestigio' headings so future merges can't silently drop the wiring again."
```

## Evidence

- 2026-04-20T10:55:00Z · live DOM (tab 761726329, L2 picker open) · `[class*=class-picker__]` = 0 matches · `.option-list__item` = 39 matches · 1 section "Selecciona la clase del nivel 2"
- 2026-04-20T10:55:00Z · STATE.md session-continuity block names `<ClassPicker>` at `apps/planner/src/features/level-progression/class-picker.tsx` as EXISTS but NOT mounted
- 2026-04-20T11:15:00Z · Read `apps/planner/src/features/level-progression/level-sheet.tsx`: `<ClassPicker />` IS imported (line 10) + mounted (line 28). Initial hypothesis refuted — level-sheet.tsx does hold the ClassPicker mount.
- 2026-04-20T11:17:00Z · Grep for `BuildProgressionBoard|LevelSheet` + read `apps/planner/src/components/shell/center-content.tsx`: the shell routes `activeLevelSubStep === 'class'` to `<BuildProgressionBoard />` on line 33. `<LevelSheet />` is NEVER imported by any shell file — it is dead code in the live route graph.
- 2026-04-20T11:18:00Z · Read `apps/planner/src/features/level-progression/build-progression-board.tsx`: component renders `<SelectionScreen title={shellCopyEs.stepper.stepTitles.class + " " + level}>` (→ "Selecciona la clase del nivel N") + `<OptionList items={classItems} />` (→ 39 flat `.option-list__item`) + `<DetailPanel>`. Zero references to `ClassPicker`. THIS IS THE ACTUAL ROOT CAUSE.
- 2026-04-20T11:19:00Z · Read `.planning/phases/12.4-construccion-correctness-clarity/12.4-06-SUMMARY.md` line 152: Self-Check only verified `<ClassPicker />` mount in `level-sheet.tsx`. No check for `build-progression-board.tsx` — the file the shell actually mounts.
- 2026-04-20T11:27:00Z · Applied fix to `build-progression-board.tsx` (swap OptionList → ClassPicker, drop unused imports, keep DetailPanel for description + gains).
- 2026-04-20T11:27:30Z · `tsc --noEmit -p apps/planner` → exit 0, zero type errors.
- 2026-04-20T11:28:00Z · `vitest run tests/phase-12.4/class-picker-grouping.spec.tsx tests/phase-12.4/prestige-gate.fixture.spec.ts tests/phase-12.4/feat-picker-scroll.spec.tsx` → 22/22 green.
- 2026-04-20T11:30:00Z · First full-suite run → 626/630. Regressions: `phase-04/level-sheet-gains.spec.tsx` (2 tests) + `phase-04/progression-revalidation.spec.tsx` (1 test) still queried `role='option'` / `.is-blocked` (OptionList contract). Expected consequence — those tests target the shell-mounted picker and must follow the new ClassPicker DOM contract.
- 2026-04-20T11:32:00Z · Migrated the three tests to `[data-class-id=…]` + `aria-disabled="true"` (ClassPicker contract). Re-ran scoped suite → 4/4 green.
- 2026-04-20T11:34:00Z · Full suite → **629/630**. Remaining single failure: `phase-05.2/theme-contract.spec.ts > does NOT contain font-weight: 700` = DEF-12.4-02 (pre-existing, tracked in 12.4-06-SUMMARY line 137 + deferred-items.md). Baseline restored.

## Eliminated

- "level-sheet.tsx dropped the <ClassPicker /> JSX during -X ours merge" — false. `level-sheet.tsx:10,28` still import + mount `<ClassPicker />`. The merge didn't drop anything there; the plan simply targeted the wrong file.

## Resolution

- **root_cause:** `<BuildProgressionBoard>` (the component actually mounted by `center-content.tsx:33` for `activeLevelSubStep === 'class'`) renders the legacy `<SelectionScreen>` + `<OptionList>` combo, not `<ClassPicker>`. Phase 12.4-06 extracted `<ClassPicker>` and mounted it in `<LevelSheet>`, which is dead code (never imported by the shell). The Self-Check in 12.4-06-SUMMARY verified the `LevelSheet` mount point but did not audit the shell's actual class-step component. Result: the extracted picker existed and unit-tested correctly, but was never on the live route.
- **fix:** Refactored `apps/planner/src/features/level-progression/build-progression-board.tsx` to import `<ClassPicker>` and render it inside the `<SelectionScreen>` slot in place of `<OptionList>`. Retained `<DetailPanel>` for the selected-class description + "Ganancias del nivel" block so no information is lost from the existing layout. Removed the now-unused `OptionList` / `OptionItem` / `classItems` construction. `setLevelClassId` is now wired internally by `<ClassPicker>` (it reads the store directly), so `BuildProgressionBoard` no longer destructures that action. Follow-up test migration for three phase-04 specs that targeted the legacy `role='option'` / `.is-blocked` OptionList contract — now target `[data-class-id]` + `aria-disabled` per the ClassPicker contract. No production-code regressions. Dev server (background task `bsh4vivcr`) still serving 200 OK at http://127.0.0.1:5173/ — HMR picks up the edit automatically.
- **verification:**
  - (a) Live DOM re-check at `http://127.0.0.1:5173/` L2 picker expected to show `[class*=class-picker__]` > 0 AND `.option-list__item` == 0 inside the center panel + two `.class-picker__section-heading` ("Clases básicas" + "Clases de prestigio"). User must confirm in persisted browser tab 761726329 (HMR-applied, no reload needed).
  - (b) `tests/phase-12.4/class-picker-grouping.spec.tsx` + `prestige-gate.fixture.spec.ts` + `feat-picker-scroll.spec.tsx` — **22/22 green**.
  - (c) Full test suite — **629/630**, exact baseline restored. Single remaining failure is DEF-12.4-02 (pre-existing font-weight:700, deferred).
  - (d) `tsc --noEmit -p apps/planner` — **exit 0**, zero new type errors.
- **files_changed:**
  - `apps/planner/src/features/level-progression/build-progression-board.tsx` — swap `<OptionList>` for `<ClassPicker>`; drop unused imports (`OptionList`, `OptionItem`, `ProgressionLevel`, `setLevelClassId`); keep `<SelectionScreen>` wrapper + `<DetailPanel>` for selected-class description and `gains` block.
  - `tests/phase-04/level-sheet-gains.spec.tsx` — migrated two tests from `getByRole('option', { name: /Guerrero/ })` / `getByRole('option', { name: /Danzarín sombrío/ })` to `document.querySelector('[data-class-id=…]')` + `aria-disabled="true"`. Kept the behavioral assertion (`sheet.abilityIncreaseAvailable === true` and shadowdancer blocked status).
  - `tests/phase-04/progression-revalidation.spec.tsx` — migrated one test from `getByRole('option', { name: /Guerrero/ })` to `document.querySelector('[data-class-id="class:fighter"]')`. Downstream rail-status assertions unchanged.

## Follow-ups (non-blocking)

1. Add an RTL integration spec for `BuildProgressionBoard` that asserts both `Clases básicas` + `Clases de prestigio` headings render, so a future merge dropping the `<ClassPicker />` mount fails loudly.
2. Consider deleting `apps/planner/src/features/level-progression/level-sheet.tsx` if it is truly dead code, or document its intended future mount point. Having two near-identical level-step components is the gap that enabled this silent regression.
3. Phase 12.4-06 Self-Check template should assert mount presence in the shell-reachable component, not the file named in the plan's SUMMARY — adopt a grep that walks `center-content.tsx` and all components it imports.
