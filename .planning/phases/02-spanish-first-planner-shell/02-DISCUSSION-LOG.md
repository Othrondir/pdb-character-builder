# Phase 2: Spanish-First Planner Shell - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-30T11:52:06+02:00
**Phase:** 02-spanish-first-planner-shell
**Areas discussed:** Shell architecture, Navigation and screen framing, Visual direction, Shell state and data boundary

---

## Shell architecture

| Option | Description | Selected |
|--------|-------------|----------|
| Route-driven SPA shell | Use `apps/planner` with React, Vite, and TanStack Router plus a shared frame for all planner areas | ✓ |
| Conditional single page | Keep one page and switch panels with local state only | |
| Multi-page static site | Create separate HTML entries per planner area | |

**User's choice:** `[auto] Route-driven SPA shell`
**Notes:** Recommended default. The repo stack already points to React, Vite, and TanStack Router, and stable routes fit the planner's multi-screen workflow better than ad-hoc panel switching.

---

## Navigation and screen framing

| Option | Description | Selected |
|--------|-------------|----------|
| NWN2DB-style section shell | Persistent navigation for `Build`, `Skills`, `Spells`, `Abilities`, `Stats`, `Summary`, and `Utilities`, localized to Spanish | ✓ |
| Wizard-only flow | Linear next/back steps with no direct section access | |
| Landing page plus isolated tools | Start from a generic home/dashboard and jump into separate pages | |

**User's choice:** `[auto] NWN2DB-style section shell`
**Notes:** Recommended default. The roadmap explicitly asks for NWN2DB-equivalent flow and Spanish-first framing, so the shell should surface those sections immediately.

---

## Visual direction

| Option | Description | Selected |
|--------|-------------|----------|
| NWN1-inspired framed shell | Parchment, stone, metal, serif-forward headings, and ornamental panel framing | ✓ |
| NWN2DB skin copy | Reproduce the reference builder's look closely | |
| Generic modern app shell | Flat cards and standard web-tool styling | |

**User's choice:** `[auto] NWN1-inspired framed shell`
**Notes:** Recommended default. Project constraints require the NWN2DB workflow without copying its skin, and the repo brief explicitly rejects generic styling.

---

## Shell state and data boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal shell state plus contract-shaped placeholders | Use Zustand for shell chrome and placeholder build summary, anchored to canonical IDs and Phase 1 contracts | ✓ |
| Pure local component state | Keep each screen isolated and avoid shared shell state for now | |
| Hard-coded mock pages | Build disconnected screens with arbitrary strings and no contract alignment | |

**User's choice:** `[auto] Minimal shell state plus contract-shaped placeholders`
**Notes:** Recommended default. Phase 2 needs a route/state skeleton that later phases can fill without structural rewrites, and Phase 1 already established the canonical contracts the shell should respect.

---

## the agent's Discretion

- Internal route ids and component folder naming within `apps/planner`
- Exact typography pairing and design token names
- Placeholder copy depth per section

## Deferred Ideas

- Detailed build editors and legality interactions stay in later phases
- Persistence and share flows stay in Phase 8
