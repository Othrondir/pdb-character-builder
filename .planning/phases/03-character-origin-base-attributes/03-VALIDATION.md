---
phase: 03
slug: character-origin-base-attributes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-30
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest + @testing-library/react |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm vitest run tests/phase-03 --reporter=dot` |
| **Full suite command** | `pnpm vitest run` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm vitest run tests/phase-03 --reporter=dot`
- **After every plan wave:** Run `pnpm vitest run`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 25 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | CHAR-01, CHAR-02, CHAR-03 | integration | `pnpm vitest run tests/phase-03/origin-flow.spec.tsx --reporter=dot` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | CHAR-04 | integration | `pnpm vitest run tests/phase-03/summary-status.spec.tsx --reporter=dot` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | ABIL-01 | integration | `pnpm vitest run tests/phase-03/attribute-budget.spec.tsx --reporter=dot` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 2 | CHAR-04, ABIL-01 | unit | `pnpm vitest run tests/phase-03/foundation-validation.spec.ts --reporter=dot` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/phase-03/origin-flow.spec.tsx` — stepped origin flow, dependency locks, and `Sin deidad` visibility
- [ ] `tests/phase-03/summary-status.spec.tsx` — summary-panel status and identity projection coverage
- [ ] `tests/phase-03/attribute-budget.spec.tsx` — budget-led attribute editing and unlock gating coverage
- [ ] `tests/phase-03/foundation-validation.spec.ts` — pure legality and budget resolver coverage

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| The `Construccion` and `Atributos` boards match the approved NWN1-style left-board/right-sheet composition on desktop and mobile | CHAR-01, CHAR-03, ABIL-01 | Visual composition and responsive feel are not fully captured by DOM assertions | Compare the implemented screens against `.planning/phases/03-character-origin-base-attributes/03-UI-SPEC.md`; verify the right-side sheet or help pane remains visible below controls on mobile |
| Inline blocked and illegal feedback reads clearly in Spanish and feels localized to the affected control | CHAR-04 | Automated tests can assert presence, not readability or placement quality | Exercise at least one blocked race or subrace path, one deity-requirement path, and one invalid attribute allocation path; confirm the message appears beside the relevant control rather than only in the summary panel |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 25s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
