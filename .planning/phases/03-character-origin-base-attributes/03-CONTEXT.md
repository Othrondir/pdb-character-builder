# Phase 3: Character Origin & Base Attributes - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Allow players to define the legal Puerta character foundation by selecting race, subrace, alignment, deity, and starting attributes with immediate restriction feedback before later progression screens. This phase establishes coherent origin and base-attribute state for downstream planner screens, but it does not implement level progression, class choice, skills, feats, spells, persistence, or sharing.

</domain>

<decisions>
## Implementation Decisions

### Screen ownership and gating
- **D-01:** Keep race, subrace, alignment, and deity editing in `Construccion`, while starting attributes live in `Atributos`.
- **D-02:** Keep `Atributos` blocked until the origin state is sufficiently defined to evaluate starting-attribute legality.

### Origin selection flow
- **D-03:** Model origin selection as a stepped, dependent flow rather than a flat all-at-once form or catalog-first chooser.
- **D-04:** Keep the deity field visible in the origin flow at all times, and expose an explicit `Sin deidad` option whenever no deity is currently required.

### Starting attributes interaction
- **D-05:** Center the starting-attributes UI on the supported cost or budget rule when the dataset exposes one, so the user sees spending and remaining budget while editing.
- **D-06:** Surface attribute legality and budget feedback at the point of entry instead of deferring interpretation to later screens.

### Restriction feedback and global validation
- **D-07:** Show incompatibilities inline next to the relevant origin or attribute control so the user does not need a separate audit pass to understand why an option is blocked.
- **D-08:** Reflect illegal or unresolved origin and base-attribute conflicts in the persistent summary panel as a blocked global state.

### the agent's Discretion
- Exact threshold for when the origin state is "sufficiently defined" to unlock `Atributos`, as long as it matches real rule dependencies.
- Exact stepped UI layout inside `Construccion`, provided it remains dependent, readable, and consistent with the existing shell.
- Exact budget visualization details if the supported creation rule is not a classic point-buy, provided the UI still centers visible cost feedback.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product scope and phase requirements
- `AGENTS.md` - project brief, stack boundaries, and GSD workflow requirement for this repo.
- `.planning/PROJECT.md` - product constraints, Spanish-first scope, NWN2DB workflow target, and strict legality expectations.
- `.planning/ROADMAP.md` - Phase 3 goal, success criteria, plan split, and downstream dependencies.
- `.planning/REQUIREMENTS.md` - `CHAR-01`, `CHAR-02`, `CHAR-03`, `CHAR-04`, and `ABIL-01` requirements this phase must satisfy.

### Locked prior decisions
- `.planning/phases/01-canonical-puerta-dataset/01-CONTEXT.md` - source precedence, blocked-state policy, public-safe dataset boundary, and canonical-ID expectations from Phase 1.
- `.planning/phases/02-spanish-first-planner-shell/02-CONTEXT.md` - routed shell structure, Spanish-first framing, persistent summary region, and NWN1 UI direction from Phase 2.

### Existing runtime contracts and integration anchors
- `packages/rules-engine/src/contracts/canonical-id.ts` - current canonical ID grammar and existing `race:*` entity support that planner state must preserve.
- `packages/rules-engine/src/contracts/validation-outcome.ts` - blocked or illegal validation vocabulary the Phase 3 UI should surface.
- `apps/planner/src/state/planner-shell.ts` - current global shell state and validation-status integration point.
- `apps/planner/src/components/shell/summary-panel.tsx` - persistent summary chrome that must reflect blocked Phase 3 state.
- `apps/planner/src/lib/copy/es.ts` - Spanish labels and section framing already established for `Construccion` and `Atributos`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/planner/src/state/planner-shell.ts`: existing Zustand shell store for active section, dataset ID, summary visibility, and validation state.
- `apps/planner/src/components/shell/summary-panel.tsx`: persistent summary region already wired to global validation and dataset metadata.
- `apps/planner/src/lib/sections.ts`: stable routed split between `Construccion` and `Atributos`.
- `apps/planner/src/components/shell/section-view.tsx`: current placeholder panel that can be replaced or wrapped by real Phase 3 editors.
- `apps/planner/src/lib/copy/es.ts`: Spanish copy source for shell terminology and section headings.

### Established Patterns
- The planner is a route-driven SPA with one persistent shell frame around every section.
- Global shell state currently lives in Zustand and already exposes validation state separately from route content.
- Visible UI copy is Spanish-first and the shell presentation is already locked to an NWN1-inspired visual system.
- Browser-facing state must preserve canonical IDs and fail-closed legality outcomes rather than localized labels or inferred defaults.

### Integration Points
- `apps/planner/src/routes/root.tsx` should evolve from placeholder Build content into the origin editor surface.
- `apps/planner/src/routes/abilities.tsx` should evolve from placeholder Attributes content into the starting-stat editor surface.
- The summary panel should replace placeholder character state with real origin identity and blocked-state reporting without changing shell placement.
- Any new origin/base-character state should be shaped so Phase 4 can consume it without reworking route ownership.

</code_context>

<specifics>
## Specific Ideas

- Keep the screen split aligned with the shell already shipped: identity in `Construccion`, starting stats in `Atributos`.
- Use a stepped dependent origin flow because it makes incompatibilities easier to understand while the user is choosing race, subrace, alignment, and deity.
- Treat `Atributos` as unavailable until the character foundation is ready, rather than letting users edit early and reconcile later.
- Represent deity optionality with a real `Sin deidad` choice instead of hiding the field.
- If the supported creation rule uses a budget mechanic, the attribute UI should make spending visible as the primary interaction model.

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope.

</deferred>

---
*Phase: 03-character-origin-base-attributes*
*Context gathered: 2026-03-30*
