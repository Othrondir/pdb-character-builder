---
phase: 11
slug: uat-openwork-closure
status: doc_only
strategy: grep_gates
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-18
---

# Phase 11 — Validation Strategy

> Artifact-closure phase. No runtime code is changed. Validation IS the per-task
> `<automated>` grep gate on the resulting planning artifacts.

---

## Why No Test Suite

Phase 11 is a **documentation / artifact-closure** phase. It edits only files
under `.planning/` (UAT records, debug session docs, STATE.md). No source code
is touched, no runtime behavior changes, no regression risk to the shipped
build. There is nothing to sample at runtime; there is no watch mode to run;
the full test suite is unaffected.

The validation architecture is therefore: **each task ships with a `grep`-based
`<automated>` verify gate that proves the target artifact reached its terminal
state**. These gates satisfy Nyquist sampling intent 8a–8d because every task
has deterministic, fast (< 1s), machine-checkable evidence of completion.

---

## Gate Commands Per Plan

**Plan 11-01 — UAT closure (P05 / P06 / P07)**

```
grep -q "^status: complete$"   .../05-HUMAN-UAT.md
grep -q "Re-Verification Note" .../05-HUMAN-UAT.md
grep -q "12/12"                .../05-HUMAN-UAT.md
grep -q "^status: descoped$"   .../07-UAT.md
grep -q "descoped_by: 07.2-magic-ui-descope" .../07-UAT.md
```
Plus human-verify checkpoint on Phase 06 UAT (5 scenarios, result != pending).

**Plan 11-02 — Debug session closure**

```
test -f .planning/debug/resolved/guardar-slot-zoderror.md
! test -f .planning/debug/guardar-slot-zoderror.md
grep -q "^status: resolved$" <resolved path>
grep -q "4f03865"            <resolved path>
grep -q "IncompleteBuildError" <resolved path>
```

**Plan 11-03 — Quick-task closure annotation**

```
test -f .../260414-gxx-SUMMARY.md
grep -q "^## Outcome$"       <summary>
grep -q "^## Files Changed$" <summary>
grep -q "^## Verification$"  <summary>
grep -q "260414-gxx.*closed (Phase 11)" .planning/STATE.md
```

---

## Sampling Notes

- **After every task commit:** the task's own grep gate runs (already in `<verify>`).
- **After plan wave:** rerun gate commands for that plan — < 1s total.
- **Before `/gsd-verify-work`:** all gates across 11-01 / 11-02 / 11-03 must pass.
- **Manual-only:** Plan 11-01 Task 2 (Phase 06 human UAT) — 5-scenario sign-off by tester.

**Approval:** approved 2026-04-18
