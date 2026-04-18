# Phase 12.3 — Deferred Items

## From 12.3-01 execution (2026-04-18)

- `tests/phase-12.3/hit-points-selector.spec.ts(6,34)`: `Cannot find module '@rules-engine/progression/compute-hit-points'`
  - Owned by plan 12.3-04 (HP selector). In-flight parallel Wave 1 plan — its RED spec references the module 12.3-04 Task 2 will create.
  - Out of scope for 12.3-01 per SCOPE BOUNDARY (disjoint files).
  - Will resolve when 12.3-04 GREEN lands.
