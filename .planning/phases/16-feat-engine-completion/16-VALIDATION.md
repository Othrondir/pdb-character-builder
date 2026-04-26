---
phase: 16
slug: feat-engine-completion
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-26
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Sourced from `16-RESEARCH.md` § Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.16 |
| **Config file** | `vitest.config.ts` (root) |
| **Quick run command** | `corepack pnpm exec vitest run tests/phase-16/<spec> --reporter=dot` |
| **Full suite command** | `corepack pnpm exec vitest run` |
| **Estimated runtime** | ~25 s for `tests/phase-16/**`; ~2 m full suite |

---

## Sampling Rate

- **After every task commit:** `corepack pnpm exec vitest run tests/phase-16/<changed-spec> --reporter=dot`
- **After every plan wave:** `corepack pnpm exec vitest run tests/phase-06 tests/phase-12.4 tests/phase-15 tests/phase-16`
- **Before `/gsd-verify-work`:** Full `corepack pnpm exec vitest run` green + `tsc --noEmit` exit 0
- **Max feedback latency:** ~30 s per task; ~2 m per wave

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 16-01-01 | 01 | 1 | FEAT-05 | — | Extractor reads `BonusFeatsTable` col, emits `bonusFeatSchedule: number[]` for fighter/wizard/monk/rogue/swashbuckler/caballero-arcano matching Puerta cadence | unit (extractor) | `corepack pnpm exec vitest run tests/phase-16/bonus-feat-schedule-extractor.spec.ts` | ❌ W0 | ⬜ pending |
| 16-01-02 | 01 | 1 | FEAT-05 | — | `compiledClass.bonusFeatSchedule === null` for classes whose `BonusFeatsTable` ref is `****` | unit (extractor) | same file | ❌ W0 | ⬜ pending |
| 16-01-03 | 01 | 1 | FEAT-05 | — | Phase 12.4-03 fixtures consume extractor-derived schedule (no silent breakage from PIT-01 cadence drift) | unit (rules-engine fixture sweep) | `corepack pnpm exec vitest run tests/phase-12.4` | ✅ exists | ⬜ pending |
| 16-02-01 | 02 | 2 | FEAT-05 | — | `determineFeatSlots` reads `compiledClass.bonusFeatSchedule` first, falls back to `LEGACY_CLASS_BONUS_FEAT_SCHEDULES` only on `null` | unit (rules-engine) | `corepack pnpm exec vitest run tests/phase-16/determine-feat-slots-race-aware.spec.ts` | ❌ W0 | ⬜ pending |
| 16-02-02 | 02 | 2 | FEAT-06 | — | Humano + Fighter L1 returns `featSlots = { classBonus: true, general: true, raceBonus: true }` | unit (rules-engine) | same file | ❌ W0 | ⬜ pending |
| 16-02-03 | 02 | 2 | FEAT-06 | — | Mediano Fortecor + Fighter L1 returns same shape (D-06 scope expansion) | unit (rules-engine) | same file | ❌ W0 | ⬜ pending |
| 16-02-04 | 02 | 2 | FEAT-06 | — | Elfo + Fighter L1 returns `raceBonus: false` (regression lock — non-Humano stays byte-identical) | unit (rules-engine) | same file | ❌ W0 | ⬜ pending |
| 16-02-05 | 02 | 2 | FEAT-06 | — | Humano + Wizard L1 returns 3 slots (class-wizard-bonus + general + race) | unit (rules-engine) | same file | ❌ W0 | ⬜ pending |
| 16-02-06 | 02 | 2 | FEAT-06 | — | `<FeatBoard>` renders dedicated "Dote racial: Humano" section between class-bonus and general | RTL (jsdom) | `corepack pnpm exec vitest run tests/phase-16/feat-board-race-bonus-section.spec.tsx` | ❌ W0 | ⬜ pending |
| 16-02-07 | 02 | 2 | FEAT-06 | — | `<FeatSummaryCard>` chip carries `data-slot-kind="race-bonus"` for Humano L1 race-bonus pick | RTL (jsdom) | same file | ❌ W0 | ⬜ pending |
| 16-02-08 | 02 | 2 | FEAT-06 | — | `<LevelEditorActionBar>` resolves `legal` (3 slots filled) at Humano L1 Fighter when class-bonus + general + race-bonus all picked | RTL (jsdom) | same file | ❌ W0 | ⬜ pending |
| 16-03-01 | 03 | 3 | FEAT-06 (D-05) | — | v1.0-shaped JSON build (Elfo Guerrero L1, no `bonusGeneralFeatIds`) round-trips identically through hydrate → project on v1.1; `schemaVersion` unchanged | unit (persistence) | `corepack pnpm exec vitest run tests/phase-16/humano-l1-build-roundtrip.spec.ts` | ❌ W0 | ⬜ pending |
| 16-03-02 | 03 | 3 | FEAT-06 (D-05) | — | Humano L1 build (with `bonusGeneralFeatIds: [feat:X]`) round-trips through hydrate → project preserving slot identity | unit (persistence) | same file | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/phase-16/bonus-feat-schedule-extractor.spec.ts` — covers FEAT-05 extractor shape
- [ ] `tests/phase-16/determine-feat-slots-race-aware.spec.ts` — covers FEAT-05 consumer + FEAT-06 rules-engine
- [ ] `tests/phase-16/feat-board-race-bonus-section.spec.tsx` — covers FEAT-06 UI surface
- [ ] `tests/phase-16/humano-l1-build-roundtrip.spec.ts` — covers FEAT-06 D-05 persistence regression
- [ ] **Existing fixture migration:** ~9 call sites in `tests/phase-06/feat-eligibility.spec.ts` + `tests/phase-06/feat-proficiency.spec.ts` migrate from `determineFeatSlots(level, classId, classLevelInClass, classFeatLists)` to `determineFeatSlots(buildState, classFeatLists, compiledClass)`. `createBuildState` test helper at L10-23 needs `raceId: null` + `activeClassIdAtLevel: classId`.
- [ ] `vitest.config.ts` glob extends `tests/phase-16/**/*.spec.{ts,tsx}` to `jsdom` (RTL specs) — mirror existing `tests/phase-12.7/**` glob.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Humano L1 Fighter UAT — pick class-bonus + general + race-bonus, advance bar enables, navigate to L2 | FEAT-06 | RTL covers DOM state but not user-perceived advance flow | Boot dev server (`corepack pnpm dev`), pick Humano + Guerrero L1, fill 3 slots, click `Continuar al nivel 2`, confirm L2 expands |
| Humano L1 Wizard UAT — wizard-bonus + general + race-bonus | FEAT-06 | Wizard list filtering interacts with race-bonus general pool | Boot dev server, pick Humano + Mago L1, confirm 3 chips render distinct slot-kind labels |
| Mediano Fortecor L1 UAT (D-06) — same as Humano | FEAT-06 / D-06 | New race scope expansion | Pick Mediano Fortecor + any class L1, confirm "Dote racial: Mediano Fortecor" section appears |
| Load v1.0 saved JSON build (Elfo L1 Guerrero) | FEAT-06 / D-05 | Cross-version compat — verify no migration prompt or data loss | Import existing v1.0 JSON saved during Phase 12.x, confirm 2 slots load identically |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30 s per task / 2 m per wave
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
