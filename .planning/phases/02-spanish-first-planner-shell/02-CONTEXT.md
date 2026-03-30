# Phase 2: Spanish-First Planner Shell - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a static React planner shell that mirrors NWN2DB's main navigation and screen framing in Spanish, establishes the NWN1-inspired visual system, and creates the route/state skeleton later phases will populate. Character-editing logic, detailed progression editors, and full legality interactions remain in later phases.

</domain>

<decisions>
## Implementation Decisions

### Shell architecture
- **D-01:** Build the shell as a route-driven SPA in `apps/planner` using the repo's React, Vite, and TanStack Router stack instead of a single conditional page or multiple standalone HTML files.
- **D-02:** Use one persistent planner frame around all screens so header, navigation, and summary chrome stay stable while future phases fill in the page content.

### Navigation and screen framing
- **D-03:** Mirror the NWN2DB planner mental model with first-class sections for `Build`, `Skills`, `Spells`, `Abilities`, `Stats`, `Summary`, and `Utilities`.
- **D-04:** Ship Spanish-first labels and framing from the first shell pass, with persistent desktop navigation and a mobile drawer or sheet variant rather than a wizard-only flow.
- **D-05:** Reserve a persistent summary/status region in the shell for future character identity, dataset version, and validation state.

### Visual direction
- **D-06:** Use an NWN1-inspired presentation built from parchment, stone, metal, and muted heraldic color cues; avoid both a direct NWN2DB skin copy and generic SaaS styling.
- **D-07:** Favor framed panels, serif-forward headings, textured surfaces, and ornamental major boundaries while keeping controls readable on desktop and mobile.
- **D-08:** Keep motion sparse and intentional, limited to shell reveals and section transitions instead of generic micro-animation clutter.

### Shell state and data boundary
- **D-09:** Establish a minimal Zustand-backed shell state for active section, shell chrome, and placeholder build summary, keeping entity references anchored to Phase 1 canonical IDs instead of localized labels.
- **D-10:** Keep the browser shell consuming only compiled/static-friendly data contracts; do not introduce raw asset parsing or machine-local path assumptions in Phase 2.
- **D-11:** Seed shell screens with deterministic placeholder or fixture-backed view models shaped around the Phase 1 contracts so later phases can replace scaffolding without changing layout or route structure.

### the agent's Discretion
- Internal route ids and component folder naming within `apps/planner`
- Exact font pairing and token naming, as long as they reinforce the NWN1 direction and Spanish readability
- Placeholder copy depth per screen, provided it stays obviously scaffold content and does not imply unsupported rules behavior

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product scope and constraints
- `AGENTS.md` — project brief, recommended stack, source-of-truth package layout, and GSD workflow requirements for this repo
- `.planning/PROJECT.md` — Spanish-first product constraints, NWN1 visual direction, static deployment boundary, and sharing goals
- `.planning/ROADMAP.md` — Phase 2 goal, success criteria, UI hint, and downstream phase dependencies

### Phase 1 contracts that shape the shell
- `packages/data-extractor/src/contracts/dataset-manifest.ts` — public-safe dataset metadata, version ids, and provenance fields the shell should be prepared to surface
- `packages/rules-engine/src/contracts/canonical-id.ts` — canonical ID grammar that shell placeholders and future client state should preserve
- `packages/rules-engine/src/contracts/validation-outcome.ts` — legal/illegal/blocked outcome vocabulary the shell should leave room to present later

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/data-extractor/src/contracts/dataset-manifest.ts`: reusable shape for dataset badges, version labels, and future mismatch UI scaffolding
- `packages/rules-engine/src/contracts/canonical-id.ts`: reusable ID contract for shell state and route-safe placeholders
- `packages/rules-engine/src/contracts/validation-outcome.ts`: reusable legality-state vocabulary for summary and warning chrome

### Established Patterns
- Phase 1 established a contracts-first approach using Zod and package-level separation between extractor and rules-engine concerns
- Browser-facing work must consume compiled artifacts only; forum text and raw game assets stay outside the runtime
- There is no existing `apps/planner` shell or UI component library yet, so Phase 2 sets the baseline structure and visual language

### Integration Points
- `apps/planner` will be the new SPA entrypoint and should stay isolated from raw extraction concerns
- The shell layout must provide stable route and content slots that later phases can fill without reworking navigation
- The persistent summary/status region should be able to consume dataset metadata and validation outcomes once later phases wire real build state

</code_context>

<specifics>
## Specific Ideas

- Match the NWN2DB screen flow and section model, not its visual skin
- Keep the shell unmistakably NWN1-inspired instead of looking like a generic web admin tool
- Treat Spanish labels and navigation framing as first-class deliverables in this phase, not polish deferred to later work
- Support desktop and mobile from the shell baseline rather than retrofitting responsiveness afterward

</specifics>

<deferred>
## Deferred Ideas

- Actual race, class, feat, skill, and spell editors belong to later phases
- Final legality feedback details beyond shell placeholders belong to Phases 3 through 7
- Save/load/import/export and dataset mismatch UX belong to Phase 8

</deferred>

---

*Phase: 02-spanish-first-planner-shell*
*Context gathered: 2026-03-30*
