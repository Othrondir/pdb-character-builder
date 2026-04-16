---
phase: 5
slug: skills-derived-statistics
status: verified
threats_open: 0
asvs_level: 1
created: 2026-04-16
---

# Phase 5 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Browser runtime | Static SPA running on GitHub Pages; no backend. Skill allocations live in zustand store + IndexedDB. | In-browser character state (non-sensitive build data). |
| Compiled skill catalog | Read-only JSON payload produced by Phase 05.1 extractor; parsed against Zod schema at runtime. | Puerta de Baldur rules data (public server info). |

No new trust boundaries introduced by Phase 5 work. Plan 05-04 was CSS-only.

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-05-04-01 | T (Tampering) | skill-sheet stepper buttons | accept | Stepper controls resized in plan 05-04 but retain the same disabled/enabled logic and store dispatch; no new input vectors introduced. Store `setSkillRank` still clamps to `{0..maxRank}` before commit. | closed |

*Status: open · closed*
*Disposition: mitigate · accept · transfer*

Notes:
- Plans 05-01, 05-02, 05-03 shipped without explicit STRIDE threat models. Retroactive review: all three operate on normalized catalog + selectors + sheet projection; no network I/O, no serialization sinks, no auth surface. Classified as implicit "no new threats" under the existing browser-runtime trust boundary.

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-05-01 | T-05-04-01 | Stepper UI resize does not expand the attack surface. Rank values are integer-bounded by pure selectors and re-validated on store commit; tampering with the DOM `+`/`-` clicks produces the same outcomes as legitimate use. | gsd-secure-phase (auto) | 2026-04-16 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-04-16 | 1 | 1 | 0 | gsd-secure-phase (auto, retroactive) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter
