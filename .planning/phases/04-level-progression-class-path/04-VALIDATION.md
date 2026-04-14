---
phase: 04
slug: level-progression-class-path
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-30
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest + @testing-library/react |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm vitest run tests/phase-04 --reporter=dot` |
| **Full suite command** | `pnpm vitest run` |
| **Estimated runtime** | ~25 seconds |

---

## Sampling Rate

- **After every task commit:** Run the task-scoped Phase 4 test file or `pnpm vitest run tests/phase-04 --reporter=dot`
- **After every plan wave:** Run `pnpm vitest run tests/phase-04 --reporter=dot`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | PROG-01, PROG-03 | integration | `pnpm vitest run tests/phase-04/build-progression-shell.spec.tsx --reporter=dot` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | FLOW-03, PROG-02 | integration | `pnpm vitest run tests/phase-04/level-timeline.spec.tsx --reporter=dot` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 2 | CLAS-01, CLAS-02, CLAS-04, ABIL-02 | unit+integration | `pnpm vitest run tests/phase-04/class-prerequisites.spec.ts tests/phase-04/level-sheet-gains.spec.tsx --reporter=dot` | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 3 | CLAS-03, PROG-02, FLOW-03 | unit+integration | `pnpm vitest run tests/phase-04/multiclass-rules.spec.ts tests/phase-04/progression-revalidation.spec.tsx --reporter=dot` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/phase-04/build-progression-shell.spec.tsx` — Build-route composition with foundation summary and progression rail
- [ ] `tests/phase-04/level-timeline.spec.tsx` — level selection, revisiting earlier levels, and stable 1-16 progression editing
- [ ] `tests/phase-04/class-prerequisites.spec.ts` — pure class-entry legality coverage
- [ ] `tests/phase-04/level-sheet-gains.spec.tsx` — per-level gains and ability-increase rendering
- [ ] `tests/phase-04/progression-revalidation.spec.tsx` — preserved downstream invalidation after upstream edits
- [ ] `tests/phase-04/multiclass-rules.spec.ts` — multiclass and progression-specific rule coverage

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `Construcción` still feels like one coherent Build screen even after adding the progression rail and active level sheet | PROG-01, PROG-03 | Visual information hierarchy and board feel are not fully captured by DOM assertions | Verify that the summarized origin remains visible but secondary, and that the progression rail is the dominant interaction surface on desktop and mobile |
| Broken downstream levels are understandable and visually repairable after an earlier-level change | FLOW-03, PROG-02, CLAS-03 | Automated tests can assert markers, not clarity of repair UX | Change an earlier level to produce an illegal later path and confirm the user can tell which levels broke and why without losing data |
| Level-based ability increases feel tied to the relevant level while `Atributos` remains the aggregate view | ABIL-02 | Requires checking cross-screen comprehension and screen ownership | Inspect a level that grants an ability increase, then compare the Build sheet and `Atributos` screen to confirm the relationship is clear |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
