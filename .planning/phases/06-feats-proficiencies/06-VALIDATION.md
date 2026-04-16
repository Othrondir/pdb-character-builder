---
phase: 6
slug: feats-proficiencies
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-16
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.16 |
| **Config file** | `vitest.config.ts` (project root) |
| **Quick run command** | `pnpm vitest run tests/phase-06 --reporter=verbose` |
| **Full suite command** | `pnpm vitest run --reporter=verbose` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm vitest run tests/phase-06 --reporter=verbose`
- **After every plan wave:** Run `pnpm vitest run --reporter=verbose`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | FEAT-01 | — | N/A | unit | `pnpm vitest run tests/phase-06/feat-eligibility.spec.ts -x` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | FEAT-02 | — | N/A | unit | `pnpm vitest run tests/phase-06/feat-prerequisite.spec.ts -x` | ❌ W0 | ⬜ pending |
| 06-01-03 | 01 | 1 | FEAT-01 | — | N/A | unit | `pnpm vitest run tests/phase-06/feat-store.spec.ts -x` | ❌ W0 | ⬜ pending |
| 06-01-04 | 01 | 1 | FEAT-02 | — | N/A | unit | `pnpm vitest run tests/phase-06/bab-calculator.spec.ts -x` | ❌ W0 | ⬜ pending |
| 06-02-01 | 02 | 2 | FEAT-03 | — | N/A | unit | `pnpm vitest run tests/phase-06/feat-proficiency.spec.ts -x` | ❌ W0 | ⬜ pending |
| 06-02-02 | 02 | 2 | FEAT-04 | — | N/A | unit | `pnpm vitest run tests/phase-06/feat-puerta-custom.spec.ts -x` | ❌ W0 | ⬜ pending |
| 06-ALL | ALL | ALL | FEAT-ALL | — | N/A | unit | `pnpm vitest run tests/phase-06/feat-revalidation.spec.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/phase-06/feat-prerequisite.spec.ts` — stubs for FEAT-02 (prerequisite evaluation engine)
- [ ] `tests/phase-06/feat-eligibility.spec.ts` — stubs for FEAT-01 (eligible feat filtering)
- [ ] `tests/phase-06/feat-revalidation.spec.ts` — stubs for FEAT-ALL (revalidation after upstream changes)
- [ ] `tests/phase-06/bab-calculator.spec.ts` — stubs for FEAT-02 (BAB computation for prereqs)
- [ ] `tests/phase-06/feat-store.spec.ts` — stubs for FEAT-01 (store operations)
- [ ] `tests/phase-06/feat-proficiency.spec.ts` — stubs for FEAT-03 (proficiency feats in catalog)
- [ ] `tests/phase-06/feat-puerta-custom.spec.ts` — stubs for FEAT-04 (Puerta custom content)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Prerequisite status displayed in UI (blocked feats in search) | FEAT-02 | Visual layout verification | Search for blocked feat, verify inline reasons show in red/amber text |
| Feat board layout matches UI-SPEC | FEAT-01 | Visual layout | Compare feat board against 06-UI-SPEC.md wireframe |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
