---
phase: 5
slug: skills-derived-statistics
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-31
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x + React Testing Library |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `corepack pnpm vitest --run tests/phase-05` |
| **Full suite command** | `corepack pnpm vitest --run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `corepack pnpm vitest --run tests/phase-05`
- **After every plan wave:** Run `corepack pnpm vitest --run`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | SKIL-01 | unit + component | `corepack pnpm vitest --run tests/phase-05/skills-board.spec.tsx` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | SKIL-02 | unit | `corepack pnpm vitest --run tests/phase-05/skill-legality.spec.ts` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 2 | SKIL-03 | unit + component | `corepack pnpm vitest --run tests/phase-05/derived-stats.spec.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/phase-05/skills-board.spec.tsx` — route-owned skill-sheet coverage for level rail, active level editing, and preserved repair state
- [ ] `tests/phase-05/skill-legality.spec.ts` — class/cross-class cap, point-cost, and blocked-rule evaluator coverage
- [ ] `tests/phase-05/derived-stats.spec.tsx` — synchronized `Habilidades` and `Estadísticas` read-model coverage

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Repair readability after upstream class or INT changes | SKIL-01, SKIL-02 | Visual repair affordances and Spanish messaging are easier to judge in-browser than by DOM assertions alone | Build a legal progression, allocate skills on later levels, change an earlier class or INT-related prerequisite, then confirm later levels remain present and are marked for repair instead of being deleted |
| Focused technical scope of `Estadísticas` | SKIL-03 | Scope adherence is a product decision as much as a code path | Open `Habilidades` and `Estadísticas`; confirm `Estadísticas` mirrors skill-derived math and restrictions without expanding into unrelated dashboard features |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
