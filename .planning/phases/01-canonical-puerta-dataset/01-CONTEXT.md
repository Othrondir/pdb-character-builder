# Phase 1: Canonical Puerta Dataset - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Freeze the versioned Puerta rules contract, source precedence, and static-runtime data boundary so a compiled dataset can feed the planner without runtime access to raw game assets. This phase defines what counts as authoritative, how uncertainty is handled, and what artifacts are committed for future phases.

</domain>

<decisions>
## Implementation Decisions

### Source precedence
- **D-01:** Canonical rules precedence is `local Puerta snapshot + curated manual overrides > older forum posts or stale public documentation`.
- **D-02:** Forum material is a fallback and reconciliation aid, not a runtime or compiler source of truth.

### Unverified or ambiguous rules
- **D-03:** If a rule, feat, class, spell, domain, race, or exception cannot be verified confidently, the planner must mark it as `not verifiable / blocked`.
- **D-04:** The planner must never present an ambiguous rule as valid or silently fall back to base NWN legality.

### Repository artifacts
- **D-05:** The repo will version normalized JSON datasets, a dataset manifest, and curated override files.
- **D-06:** The repo will not commit or publish raw game assets, raw extracted Beamdog assets, or other crude payloads from the local installation or `nwsync` snapshot.

### Snapshot policy
- **D-07:** Dataset refreshes are manual and explicitly versioned.
- **D-08:** The toolchain must not regenerate or replace the active dataset silently when local game or `nwsync` data changes.

### the agent's Discretion
- Exact manifest schema fields beyond the required versioning and provenance identifiers.
- Exact override file layout and naming conventions.
- Exact hashing, diffing, and dataset build pipeline details, as long as they preserve the decisions above.

</decisions>

<specifics>
## Specific Ideas

- Local base game source is available at `C:\Program Files (x86)\Steam\steamapps\common\Neverwinter Nights`.
- Local user-data source is available at `C:\Users\pzhly\Documents\Neverwinter Nights`.
- Local `nwsyncmeta.sqlite3` contains a manifest for `http://nwsync.puertadebaldur.com`, so Phase 1 should assume a real local Puerta snapshot exists and should be exploited as the primary data source.
- The product is Spanish-first, so canonical data should preserve stable internal IDs while exposing Spanish labels and custom content text where available.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase boundary and product constraints
- `.planning/ROADMAP.md` — Phase 1 goal, success criteria, and sequencing constraints.
- `.planning/PROJECT.md` — Product constraints: static hosting, Spanish-first surface, strict legality, and dataset-pinned sharing.

### Requirements and coverage
- `.planning/REQUIREMENTS.md` — Phase 1 requirement `VALI-04` and the broader legality and sharing requirements this phase must unlock.

### Research-backed implementation direction
- `.planning/research/SUMMARY.md` — Synthesized implementation path and roadmap implications.
- `.planning/research/ARCHITECTURE.md` — Compiler-first architecture, source layers, and runtime boundary.
- `.planning/research/STACK.md` — Recommended extractor/runtime toolchain and artifact shape.
- `.planning/research/PITFALLS.md` — Fail-closed behavior, source-drift risks, and dataset versioning risks.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- No application source code exists yet; the repo is currently planning-first.
- Existing reusable project assets are planning artifacts and workflow guides, not runtime components.

### Established Patterns
- The repo is being driven through GSD planning artifacts committed to git.
- Research already established a compiler-first shape: extracted source data -> normalized canonical data -> static planner runtime.
- Static hosting and dataset pinning are fixed constraints before any UI work begins.

### Integration Points
- Phase 1 will define the dataset contract consumed later by the planner shell, rules engine, serializers, and persistence layers.
- The first code packages are expected to emerge around the extractor/compiler and rules contract rather than UI components.

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---
*Phase: 01-canonical-puerta-dataset*
*Context gathered: 2026-03-29*
