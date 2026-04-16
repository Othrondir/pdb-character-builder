---
phase: 7
slug: magic-full-legality-engine
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-16
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.16 |
| **Config file** | `vitest.config.ts` (repo root) — include pattern `tests/**/*.spec.ts(x)` only |
| **Quick run command** | `pnpm test -- tests/phase-07 --reporter=dot --bail=1` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~20-40 seconds for phase-07 scope; ~2-3 min full suite |
| **Setup file** | `tests/setup.ts` (loads `@testing-library/jest-dom/vitest`) |
| **Test extension** | `.spec.ts` / `.spec.tsx` (not `.test.ts`) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test -- tests/phase-07 --reporter=dot --bail=1`
- **After every plan wave:** Run `pnpm test -- tests/phase-07`
- **Before `/gsd-verify-work`:** Full suite `pnpm test` must be green
- **Max feedback latency:** ~60 seconds for phase-scoped run

---

## Per-Task Verification Map

> Populated by planner during PLAN.md authoring. Each plan task links back to a requirement + an automated command.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 07-01-* | 01 | 1 | MAGI-01..04, VALI-02 | — | catalog fail-closed on missing source | unit | `pnpm test -- tests/phase-07/catalog-fail-closed.spec.ts` | ❌ W0 | ⬜ pending |
| 07-01-* | 01 | 1 | MAGI-02, MAGI-03 | — | spell eligibility respects class + level caps | unit | `pnpm test -- tests/phase-07/spell-eligibility.spec.ts` | ❌ W0 | ⬜ pending |
| 07-01-* | 01 | 1 | VALI-02 | — | spell prereq produces per-prereq pass/fail + Spanish labels | unit | `pnpm test -- tests/phase-07/spell-prerequisite.spec.ts` | ❌ W0 | ⬜ pending |
| 07-01-* | 01 | 1 | MAGI-01, VALI-01 | — | domain legality (cap + alignment + grantedFeatIds) | unit | `pnpm test -- tests/phase-07/domain-rules.spec.ts` | ❌ W0 | ⬜ pending |
| 07-02-* | 02 | 2 | VALI-03 | — | magic cascade re-evaluates on upstream change | unit | `pnpm test -- tests/phase-07/magic-revalidation.spec.ts` | ❌ W0 | ⬜ pending |
| 07-02-* | 02 | 2 | VALI-03 | — | store CRUD + active-level cascade into spell prereq | integration | `pnpm test -- tests/phase-07/magic-store.spec.ts` | ❌ W0 | ⬜ pending |
| 07-02-* | 02 | 2 | VALI-01 | — | full-build aggregator combines soft + hard blocks correctly | unit | `pnpm test -- tests/phase-07/magic-legality-aggregator.spec.ts` | ❌ W0 | ⬜ pending |
| 07-02-* | 02 | 2 | LANG-02 | — | Spanish labels surface in selector view model | unit | `pnpm test -- tests/phase-07/magic-store.spec.ts` | ❌ W0 | ⬜ pending |
| 07-03-* | 03 | 3 | LANG-02, UI-SPEC | — | MagicBoard renders Spanish copy, no throw on empty store | smoke (jsdom) | `pnpm test -- tests/phase-07/magic-board.spec.tsx` | ❌ W0 | ⬜ pending |
| 07-03-* | 03 | 3 | UI-SPEC | — | center-content routes `'spells'` sub-step to MagicBoard | smoke | `pnpm test -- tests/phase-07/center-content.spec.tsx` | ❌ W0 | ⬜ pending |
| 07-03-* | 03 | 3 | UI-SPEC | — | character-sheet MagicSheetTab replaces SpellsPanel placeholder | smoke | `pnpm test -- tests/phase-07/magic-sheet-tab.spec.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

> Planner must refine this table during PLAN.md authoring — replace `07-XX-*` placeholders with real task IDs and ensure no 3 consecutive tasks lack an automated verify.

---

## Wave 0 Requirements

- [ ] Create `tests/phase-07/` directory
- [ ] `tests/phase-07/caster-level.spec.ts` — covers `casterLevelByClass` per class type
- [ ] `tests/phase-07/spell-eligibility.spec.ts` — covers MAGI-02, MAGI-03
- [ ] `tests/phase-07/spell-prerequisite.spec.ts` — covers VALI-02
- [ ] `tests/phase-07/domain-rules.spec.ts` — covers MAGI-01, VALI-01 (hard block)
- [ ] `tests/phase-07/magic-revalidation.spec.ts` — covers VALI-03 cascade
- [ ] `tests/phase-07/magic-legality-aggregator.spec.ts` — covers VALI-01 soft block + full-build aggregation
- [ ] `tests/phase-07/catalog-fail-closed.spec.ts` — covers VALI-02, LANG-02 partial gate (missing-source outcome)
- [ ] `tests/phase-07/magic-store.spec.ts` — covers store CRUD + active-level cascade
- [ ] `tests/phase-07/magic-board.spec.tsx` — UI smoke (jsdom)
- [ ] `tests/phase-07/center-content.spec.tsx` — UI routing smoke
- [ ] `tests/phase-07/magic-sheet-tab.spec.tsx` — sheet tab smoke

*Framework install: none — Vitest already configured.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real browser Spanish copy audit on MagicBoard + MagicSheetTab | LANG-02 | jsdom smoke tests don't confirm visual typography / icon alignment against NWN1-inspired theme | Run `pnpm dev`, open planner at `/build/1`, walk through Cleric L1→L5 picking domains + spells, confirm all labels are Spanish and legality messaging is readable |
| Share-URL round-trip of magic selections | VALI-03, MAGI-01..04 | Playwright E2E not part of phase scope (Phase 8+); manual verification required for this phase | Build Cleric L5 with domains + spells, copy share URL, open in new tab, confirm build deserializes to identical validation state |
| Placeholder-catalog fail-closed messaging | VALI-02 | Spanish explanation text rendered at runtime needs human readability check | Load a spell with `description: ''` into the planner, confirm it renders "Fuente incompleta — verificar extractor" banner rather than silent acceptance |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify command or Wave 0 dependency
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all missing test files listed above
- [ ] No watch-mode flags (`--watch`, `--ui`) in automated commands
- [ ] Feedback latency < 60s for phase-scoped run
- [ ] `nyquist_compliant: true` set in frontmatter after planner ties task IDs to the map

**Approval:** pending
