---
phase: 02
slug: spanish-first-planner-shell
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-30
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for shell planning, Spanish-first framing, and NWN1 visual-system work.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + React render smoke tests |
| **Config file** | `vitest.config.ts` plus planner-specific tests under `tests/phase-02/` |
| **Quick run command** | `corepack pnpm vitest run tests/phase-02 --reporter=dot` |
| **Full suite command** | `corepack pnpm vitest run` |
| **Estimated runtime** | ~20 seconds once shell tests exist |

---

## Sampling Rate

- **After every task commit:** Run `corepack pnpm vitest run tests/phase-02 --reporter=dot`
- **After every plan wave:** Run `corepack pnpm --filter planner build` and `corepack pnpm exec tsc -p tsconfig.base.json --noEmit`
- **Before `$gsd-verify-work`:** Planner build and full Vitest suite must both be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | FLOW-01 | build | `corepack pnpm --filter planner build` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | FLOW-01 | unit | `corepack pnpm vitest run tests/phase-02/shell-routes.spec.ts --reporter=dot` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | LANG-01 | unit | `corepack pnpm vitest run tests/phase-02/navigation-copy.spec.ts --reporter=dot` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 2 | FLOW-01 | unit | `corepack pnpm vitest run tests/phase-02/layout-shell.spec.ts --reporter=dot` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 3 | FLOW-02 | unit | `corepack pnpm vitest run tests/phase-02/theme-contract.spec.ts --reporter=dot` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/planner/package.json` — planner app package with build/dev scripts
- [ ] `apps/planner/vite.config.ts` — static-friendly Vite setup for the planner shell
- [ ] `apps/planner/src/main.tsx` — SPA entrypoint
- [ ] `tests/phase-02/shell-routes.spec.ts` — section-route smoke coverage
- [ ] `tests/phase-02/navigation-copy.spec.ts` — Spanish-first copy assertions
- [ ] `tests/phase-02/layout-shell.spec.ts` — shell framing and summary rail checks
- [ ] `tests/phase-02/theme-contract.spec.ts` — NWN1 token and font contract checks

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| The shell feels NWN1-inspired instead of generic | FLOW-02 | Visual intent still needs human review even when token tests pass | Open the planner shell on desktop and mobile widths; confirm parchment/stone framing, serif-forward headings, and limited accent usage |
| Desktop rail and mobile drawer are both usable | FLOW-01 | Responsive feel and interaction quality are better checked by inspection than unit tests alone | Resize the app, open navigation on mobile, and confirm all sections remain reachable |
| Spanish-first presentation reads naturally | LANG-01 | Exact tone and product vocabulary still needs a human pass | Inspect section labels, empty states, and shell actions for Spanish-first wording |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all missing references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
