# Milestones

Shipped versions of NWN 1 Character Builder.

## v1.0 — MVP — 2026-04-26

**Phases:** 27 (1, 2, 3, 4, 5, 5.1, 5.2, 6, 7, 7.1, 7.2, 8, 9, 10, 11, 12, 12.1, 12.2, 12.3, 12.4, 12.6, 12.7, 12.8, 12.9, 13, 14, 15)
**Plans:** 99
**Tasks:** 99 plan-level (1 wave per plan typical; multi-task plans counted as their plan unit)
**Timeline:** 2026-03-29 → 2026-04-26 (28 days)
**Git range:** 2f3fe29 → e70d15c (597 commits)
**Stats:** 1043 files changed, ~236k insertions

### Delivered

Static Spanish-first character planner for Neverwinter Nights 1 Enhanced Edition tailored to Puerta de Baldur. Mirrors NWN2DB workflow with NWN1 visual identity. Deploys to GitHub Pages, no backend.

### Key Accomplishments

1. **Compiler-first dataset pipeline** — kind-prefixed canonical IDs, public-safe manifests, fail-closed legality. Phase 5.1 extractor closed UAT-blocking 10% placeholder gap (8→39 skills, 2016 items across 6 catalogs).
2. **L1→L20 character creation** — race + alignment + attributes + class + skills + feats; multiclass legality; prestige-class prereq engine; per-level Dotes gate; HP pipeline; Resumen ficha.
3. **Persistence + sharing** — Dexie IndexedDB save slots; JSON import/export; share URL with fflate compression + base64url + hash routing; D-07 fail-closed version-mismatch via shared diffRuleset; toast FIFO queue + LoadSlotResult discriminated union (Phase 14).
4. **A11y + modal polish** — useFocusTrap (drawer); useBodyScrollLock (5 surfaces, stacking counter); jsdom HTMLDialogElement polyfill; parent-owned scrollerRef thread; useShallow narrow subscriptions (Phase 15).
5. **UAT-driven correctness closure** — 9 sub-phases (12.1..12.9) closed Construcción defects (F1..F8 + X1) and 9 UAT blockers (B1..B9); 4 perceptual gates verified via agent-driven MCP Chrome UAT.

### Audit

`.planning/milestones/v1.0-MILESTONE-AUDIT.md` — status: passed
- 37/37 active v1 requirements satisfied (5 descoped CHAR-03 + MAGI-01..04)
- 27/27 phase verifications present
- 36/36 cross-phase wirings PASS
- 19/19 E2E flows PASS

### Known Deferred (carry-forward to v1.1)

See `.planning/STATE.md` § Deferred Items for full list. Highlights:
- Phase 16 Feat Engine Completion (bonus-feat schedules; Humano L1 store-capacity 2→3 slots)
- A1 point-buy cost per race (blocked on extractor enrichment)
- P5 level-table redesign (open-ended UX)
- Nyquist VALIDATION.md coverage 4/27 (process gap; no correctness impact)
- 14 audit-flagged bookkeeping items acknowledged at close (debug session, UAT/verification flag drift, quick-task tracking dir misses)

### Archives

- `.planning/milestones/v1.0-ROADMAP.md` — full phase detail
- `.planning/milestones/v1.0-REQUIREMENTS.md` — frozen requirements snapshot
- `.planning/milestones/v1.0-MILESTONE-AUDIT.md` — final audit report

### Tag

`git tag v1.0`
