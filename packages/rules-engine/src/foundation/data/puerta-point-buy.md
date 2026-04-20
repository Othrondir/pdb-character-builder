# Puerta Point-Buy Provenance

> Phase 12.6 (ATTR-01) — per-race point-buy cost curves hand-authored against Puerta de Baldur server rules material. This file is human-audit-only; it is not parsed by code. Every race present in `puerta-point-buy.json` MUST appear below with its Puerta source citation.

**Schema shape (enforced by `point-buy-snapshot.ts`):**

- `budget`: positive integer — total point-buy budget.
- `minimum`: integer — lowest allowed attribute score.
- `maximum`: integer — highest allowed attribute score.
- `costByScore`: record keyed by stringified integers in `[minimum, maximum]` mapping each score to its cost.

**Dedupe contract:** extractor emits `race:drow` twice (sourceRow 196 + 676). The dedupeByCanonicalId first-wins rule applies; one entry in this file suffices.

---

## Per-Race Provenance

_Plan 06 (A1b) populates this section after user delivers per-race curves. Each entry cites the Puerta source (forum post, spreadsheet, script) that the curve was vetted against. Un-sourced entries block code review._

| Race ID | Puerta source | Curve delta vs NWN1 baseline | Vetted against |
|---------|---------------|------------------------------|---------------|
| _(pending — Plan 06 A1b)_ | | | |

---

## Change Log

- **2026-04-20** — Skeleton created by Plan 01 Wave 0. Empty JSON; fail-closed path verified by Plan 02.
- _(Plan 06 A1b will append entries here as races land.)_
