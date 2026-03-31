# Phase 5: Skills & Derived Statistics - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-31
**Phase:** 05-skills-derived-statistics
**Areas discussed:** Skill screen ownership, Skill editing shape, Earlier-level change repair policy, Derived stats scope

---

## Skill screen ownership

| Option | Description | Selected |
|--------|-------------|----------|
| Habilidades only | `Habilidades` owns rank editing; `Estadísticas` is read-only derived output | ✓ |
| Shared with shortcuts | `Habilidades` edits ranks, but `Estadísticas` also exposes limited editing shortcuts | |
| Build + Skills | `Construcción` keeps a small skills editor while `Habilidades` is the full screen | |

**User's choice:** `Habilidades` is the only place to assign skill ranks, and `Estadísticas` stays read-only derived output.
**Notes:** Chosen to preserve clear route ownership and avoid duplicate editors.

---

## Skill editing shape

| Option | Description | Selected |
|--------|-------------|----------|
| Level rail + active sheet | Reuse the Phase 4 level rail and one active level sheet pattern for skills | ✓ |
| Dense table | Show many skills and many levels at once with inline editing | |
| Hybrid | Keep a rail, but use a larger spreadsheet-like grid in the main panel | |

**User's choice:** Reuse the Phase 4 interaction model in `Habilidades`.
**Notes:** This keeps Phase 5 aligned with the existing per-level planning pattern already established in code and UX.

---

## Earlier-level change repair policy

| Option | Description | Selected |
|--------|-------------|----------|
| Preserve + repair | Preserve later skill allocations and mark affected levels blocked/invalid until repaired | ✓ |
| Conditional preserve | Preserve only when values still fit automatically; otherwise truncate later decisions | |
| Always wipe | Remove downstream skill allocations after upstream changes affecting legality | |

**User's choice:** Preserve downstream skill allocations and require repair where needed.
**Notes:** This matches the Phase 4 decision to preserve downstream work after upstream edits.

---

## Derived stats scope

| Option | Description | Selected |
|--------|-------------|----------|
| Focused technical scope | Cover skill totals, class/cross-class math, and the derived stats needed to explain them; keep `Estadísticas` focused | ✓ |
| Broad dashboard | Expand `Estadísticas` into a wider character dashboard in this phase | |
| Minimal now | Keep derived stats minimal and defer most of `Estadísticas` to later phases | |

**User's choice:** Keep Phase 5 focused on skill-derived math and a technical `Estadísticas` view.
**Notes:** This preserves the phase boundary and avoids pulling broader dashboard work forward.

---

## the agent's Discretion

- Exact visual density and grouping of fields inside the level skill sheet.
- Exact set of read-only derived fields displayed in `Estadísticas`, as long as they directly support the skill system.
- Exact blocked/repair copy used to explain downstream invalidation.
