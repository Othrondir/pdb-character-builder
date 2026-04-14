# Phase 4: Level Progression & Class Path - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Build and edit a stable level 1-16 progression inside `Construcción`, using the Phase 3 origin and base attributes as prerequisites, while letting the user choose classes per level, validate class-entry legality, surface multiclass or progression conflicts, and review per-level gains. This phase does not yet implement skills, feats, spells, summary sharing, or the broader full-build legality engine.

</domain>

<decisions>
## Implementation Decisions

### Construcción composition
- **D-01:** Keep `Construcción` as a single route and screen rather than introducing a second navigation layer.
- **D-02:** Keep the origin visible as a summarized foundation block, while the level progression becomes the primary editor inside `Construcción`.

### Progression timeline model
- **D-03:** Use a level rail covering `1-16` as the main progression navigator.
- **D-04:** Edit the currently selected level in a right-side sheet rather than expanding all levels inline.

### Earlier-level change handling
- **D-05:** Preserve later levels when an earlier level changes instead of deleting downstream work automatically.
- **D-06:** Mark later affected levels as blocked or invalid until the user repairs them.

### Per-level detail ownership
- **D-07:** Each level sheet should own class selection, prerequisite validation, and the summary of gains or decisions for that level.
- **D-08:** Ability increases that occur at a level should appear in that level sheet even though `Atributos` remains the dedicated screen for the aggregate attribute view.

### the agent's Discretion
- Exact visual placement and treatment of the origin summary inside `Construcción`, as long as it stays secondary to the progression editor.
- Exact blocked or invalid affordance for downstream broken levels, as long as preserved levels remain visibly repairable.
- Exact density of per-level gains, as long as class choice, prerequisite state, and level rewards remain readable.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product scope and phase requirements
- `AGENTS.md` - project brief, repo workflow requirements, static-app boundary, and stack guidance.
- `.planning/PROJECT.md` - product constraints, NWN2DB workflow target, Spanish-first direction, and strict validation expectations.
- `.planning/ROADMAP.md` - Phase 4 goal, success criteria, and plan count expectations.
- `.planning/REQUIREMENTS.md` - `FLOW-03`, `ABIL-02`, `PROG-01`, `PROG-02`, `PROG-03`, `CLAS-01`, `CLAS-02`, `CLAS-03`, and `CLAS-04`.
- `.planning/STATE.md` - current project position and the handoff from Phase 3 into Phase 4.

### Locked prior-phase decisions
- `.planning/phases/01-canonical-puerta-dataset/01-CONTEXT.md` - canonical-ID, source-precedence, and fail-closed rules decisions that progression state must preserve.
- `.planning/phases/02-spanish-first-planner-shell/02-CONTEXT.md` - routed shell ownership, persistent summary region, and NWN1 visual-system baseline.
- `.planning/phases/03-character-origin-base-attributes/03-CONTEXT.md` - origin ownership in `Construcción`, `Atributos` ownership for attribute editing, and the existing gating and validation model.

### Existing code contracts and integration anchors
- `apps/planner/src/routes/root.tsx` - current owner of the `Construcción` route that Phase 4 must extend.
- `apps/planner/src/routes/abilities.tsx` - existing `Atributos` route ownership that should remain separate from level progression.
- `apps/planner/src/lib/sections.ts` - top-level section model and stable route structure.
- `apps/planner/src/components/shell/planner-shell-frame.tsx` - persistent frame, topbar, and route outlet structure.
- `apps/planner/src/components/shell/summary-panel.tsx` - persistent summary region that will need progression-aware state later.
- `apps/planner/src/features/character-foundation/store.ts` - current Phase 3 foundation state that progression depends on.
- `apps/planner/src/features/character-foundation/selectors.ts` - current validation and summary projection patterns that Phase 4 should stay compatible with.
- `apps/planner/src/lib/copy/es.ts` - current Spanish section framing and shell labels.
- `packages/rules-engine/src/contracts/canonical-id.ts` - canonical entity vocabulary, including `class:*` IDs already reserved.
- `packages/rules-engine/src/contracts/validation-outcome.ts` - shared blocked or illegal validation vocabulary for progression failures.
- `packages/data-extractor/src/contracts/dataset-manifest.ts` - compiled dataset boundary and fixed level-cap contract (`16`) that the planner should surface, not re-infer.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/planner/src/components/shell/planner-shell-frame.tsx`: stable routed shell with persistent nav and summary chrome.
- `apps/planner/src/components/shell/summary-panel.tsx`: current summary projection endpoint that later progression status can extend.
- `apps/planner/src/features/character-foundation/origin-board.tsx`: existing left-control/right-sheet board pattern that can inform the progression layout.
- `apps/planner/src/features/character-foundation/attributes-board.tsx`: existing rail-like editing pattern plus right-side live sheet that can be echoed in Phase 4.
- `apps/planner/src/features/character-foundation/store.ts`: current domain-specific Zustand store pattern separate from shell chrome.

### Established Patterns
- The planner uses route-owned feature screens inside one persistent shell frame.
- Domain state is kept separate from shell state, with selectors projecting summary and validation views.
- Visible validation must use blocked or illegal states instead of permissive warnings.
- `Construcción` and `Atributos` already have distinct ownership boundaries established in Phase 3.

### Integration Points
- `apps/planner/src/routes/root.tsx` should evolve from origin-only content into a combined foundation summary plus level progression editor.
- The persistent summary panel will eventually need to consume progression-derived identity, validation, and plan-state information.
- Phase 4 should consume Phase 3 foundation state directly instead of duplicating race, deity, alignment, or base-attribute ownership.
- Any progression store or selectors should be shaped so Phase 5 through Phase 7 can consume level-by-level class decisions without reworking route ownership.

</code_context>

<specifics>
## Specific Ideas

- Keep the NWN2DB-style feel where the build screen becomes the central place for the level path once the foundation already exists.
- Make the progression scan-friendly at a glance, but keep editing focused on one active level at a time.
- Preserve downstream levels when an early level changes so the user can see exactly what broke instead of losing work.
- Treat level-based ability increases as part of the level sheet itself, even though aggregate attribute review still belongs to `Atributos`.

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope.

</deferred>

---
*Phase: 04-level-progression-class-path*
*Context gathered: 2026-03-30*
