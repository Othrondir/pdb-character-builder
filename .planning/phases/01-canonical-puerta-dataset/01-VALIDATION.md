---
phase: 01
slug: canonical-puerta-dataset
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-29
---

# Phase 01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `pnpm vitest run tests/phase-01 --reporter=dot` |
| **Full suite command** | `pnpm vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm vitest run tests/phase-01 --reporter=dot`
- **After every plan wave:** Run `pnpm vitest run`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | VALI-04 | unit | `pnpm vitest run tests/phase-01/schema-contract.spec.ts` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | VALI-04 | unit | `pnpm vitest run tests/phase-01/manifest-contract.spec.ts` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 1 | VALI-04 | unit | `pnpm vitest run tests/phase-01/conflict-policy.spec.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `package.json` and `pnpm-lock.yaml` — initialize workspace tooling needed to run validation
- [ ] `vitest.config.ts` — baseline test configuration
- [ ] `tests/phase-01/schema-contract.spec.ts` — contract tests for canonical IDs, required fields, and source precedence
- [ ] `tests/phase-01/manifest-contract.spec.ts` — dataset manifest and provenance checks
- [ ] `tests/phase-01/conflict-policy.spec.ts` — blocked/unknown/conflict handling checks

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Published dataset artifacts exclude raw game assets | VALI-04 | Repo contents and release boundary are easier to audit by inspection than by unit test alone in the first pass | Inspect generated output paths and git-tracked artifacts; confirm only normalized JSON, manifest, and overrides are present |
| Local Puerta source availability assumptions are documented accurately | VALI-04 | Depends on the operator's machine and local NWN installation state | Verify the phase docs reference the real local install path and `nwsync` snapshot assumptions before execution starts |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
