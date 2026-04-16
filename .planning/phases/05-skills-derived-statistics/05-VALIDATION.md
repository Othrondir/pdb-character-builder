---
phase: 5
slug: skills-derived-statistics
status: verified
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-31
last_audit: 2026-04-16
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x + React Testing Library |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `corepack pnpm vitest --run tests/phase-05 --reporter=dot` |
| **Full suite command** | `corepack pnpm vitest --run` |
| **Estimated runtime** | ~5.5 seconds (phase-05 scope) |

---

## Sampling Rate

- **After every task commit:** Run `corepack pnpm vitest --run tests/phase-05 --reporter=dot`
- **After every plan wave:** Run `corepack pnpm vitest --run`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | SKIL-01, SKIL-03 | contract | `corepack pnpm vitest --run tests/phase-05/skill-dataset-contract.spec.ts` | ✅ | ✅ green |
| 05-01-02 | 01 | 1 | SKIL-02, SKIL-03 | unit | `corepack pnpm vitest --run tests/phase-05/skill-rules.spec.ts tests/phase-05/skill-revalidation.spec.ts --reporter=dot` | ✅ | ✅ green |
| 05-02-01 | 02 | 2 | SKIL-01, SKIL-02 | component | `corepack pnpm vitest --run tests/phase-05/skill-allocation-flow.spec.tsx --reporter=dot` | ✅ | ✅ green |
| 05-03-01 | 03 | 3 | SKIL-02, SKIL-03 | component + integration | `corepack pnpm vitest --run tests/phase-05/skill-stats-sync.spec.tsx --reporter=dot` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `tests/phase-05/skill-dataset-contract.spec.ts` — compiled catalog schema coverage proving runtime truth comes from a dataset payload, not a five-skill fixture
- [x] `tests/phase-05/skill-rules.spec.ts` — class/transclase cap, point-cost, and override-driven legality coverage
- [x] `tests/phase-05/skill-revalidation.spec.ts` — preserved downstream repair after upstream progression or INT changes
- [x] `tests/phase-05/skill-allocation-flow.spec.tsx` — routed `Habilidades` rail and active sheet behavior over the shared selector pipeline
- [x] `tests/phase-05/skill-stats-sync.spec.tsx` — synchronized `Habilidades`, `Estadísticas`, and shell-summary coverage

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Repair readability after upstream class or INT changes | SKIL-01, SKIL-02 | Visual repair affordances and Spanish messaging are easier to judge in-browser than by DOM assertions alone | Build a legal progression, allocate skills on later levels, change an earlier class or INT-related prerequisite, then confirm later levels remain present and are marked for repair instead of being deleted |
| Focused technical scope of `Estadísticas` | SKIL-03 | Scope adherence is a product decision as much as a code path | Open `Habilidades` and `Estadísticas`; confirm `Estadísticas` mirrors skill-derived math and restrictions without expanding into unrelated dashboard features |
| Unified scrollable NWN1-density skill board | SKIL-01 | Visual density and frame-edge clipping require browser inspection | Open `Habilidades` for a Pícaro level 1 character; confirm single-column scrollable layout, compact rows, clean bottom-edge clipping without frame overlap |

---

## Validation Audit 2026-04-16

| Metric | Count |
|--------|-------|
| Tasks mapped | 4 |
| Green | 4 |
| Pending | 0 |
| Manual-only | 3 |

Phase-05 test suite: 18 files, 154 tests, all passing. Wave 0 dependencies satisfied. UAT blocker (navigation to Habilidades) and bottom-edge skill board overlap fixed during UAT session, tests regreen.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** verified 2026-04-16
