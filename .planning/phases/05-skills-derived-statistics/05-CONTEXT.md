# Phase 5: Skills & Derived Statistics - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Add per-level skill allocation using the existing level 1-16 build state, enforce Puerta and NWN skill legality rules for each level, and keep the derived statistics needed to explain those skill outcomes synchronized across the planner. This phase covers the `Habilidades` editing workflow and the technical derived readouts needed to support it, but it does not add feats, spells, persistence, summary sharing, or the broader full-build legality engine.

</domain>

<decisions>
## Implementation Decisions

### Screen ownership
- **D-01:** `Habilidades` is the only screen that owns skill-rank editing.
- **D-02:** `Estadísticas` remains a synchronized read-only technical view for derived output produced by the skill system.

### Skill editing workflow
- **D-03:** Reuse the Phase 4 interaction model in `Habilidades`, with a level rail and one active level sheet instead of a dense multi-level spreadsheet.
- **D-04:** Keep per-level skill allocation tied to the selected level's class and current build snapshot, so the screen feels like the skill counterpart to `Construcción`.

### Earlier-level change handling
- **D-05:** Preserve downstream skill allocations when an earlier class or attribute change affects legality.
- **D-06:** Mark affected later skill levels as blocked or invalid until the user repairs them instead of truncating or wiping their work automatically.

### Derived statistics scope
- **D-07:** Phase 5 must cover skill totals, class or cross-class cost math, and the derived statistics required to explain those skill outcomes.
- **D-08:** `Estadísticas` should stay focused and technical in this phase rather than expanding into a broader all-systems dashboard.

### the agent's Discretion
- Exact visual density of the skill sheet, as long as it stays level-focused and consistent with the existing rail-plus-sheet pattern.
- Exact list and grouping of read-only derived fields in `Estadísticas`, provided they directly support skill legality and explanation.
- Exact wording of repair and blocked-state messaging, as long as it remains explicit and fail-closed.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product scope and phase requirements
- `AGENTS.md` — project brief, stack boundaries, package layout, and required GSD workflow for repo changes.
- `.planning/PROJECT.md` — Spanish-first product constraints, NWN2DB workflow target, strict legality expectations, and static deployment boundary.
- `.planning/ROADMAP.md` — Phase 5 goal, success criteria, and the split between skill allocation and derived-stat synchronization.
- `.planning/REQUIREMENTS.md` — `SKIL-01`, `SKIL-02`, and `SKIL-03`, plus the still-pending validation requirements this phase prepares for.
- `.planning/STATE.md` — current project position and the handoff from completed Phase 4 work into Phase 5.

### Locked prior-phase decisions
- `.planning/phases/01-canonical-puerta-dataset/01-CONTEXT.md` — source precedence, blocked-state policy, and compiled-dataset/runtime boundary.
- `.planning/phases/02-spanish-first-planner-shell/02-CONTEXT.md` — route ownership, shell framing, Spanish-first labels, and NWN1 presentation baseline.
- `.planning/phases/03-character-origin-base-attributes/03-CONTEXT.md` — foundation ownership, gating model, and summary-panel validation expectations.
- `.planning/phases/04-level-progression-class-path/04-CONTEXT.md` — single-route progression ownership, preserved downstream edits, and selector-driven progression repair model.

### Existing code contracts and integration anchors
- `apps/planner/src/routes/skills.tsx` — current placeholder route that will become the skill-allocation screen.
- `apps/planner/src/routes/stats.tsx` — current placeholder route that will become the read-only derived-stat view for this phase.
- `apps/planner/src/features/level-progression/store.ts` — established per-level Zustand store pattern to mirror or extend for skill state.
- `apps/planner/src/features/level-progression/selectors.ts` — selector-driven pattern for rail entries, active sheets, repair state, and summary projection.
- `apps/planner/src/components/shell/summary-panel.tsx` — persistent summary region already consuming foundation and progression status.
- `apps/planner/src/lib/copy/es.ts` — current Spanish section labels and progression wording that Phase 5 should extend consistently.
- `packages/rules-engine/src/contracts/canonical-id.ts` — canonical entity-ID vocabulary, including `skill:*` IDs reserved for runtime-safe references.
- `packages/rules-engine/src/contracts/validation-outcome.ts` — shared legal/illegal/blocked validation vocabulary and fail-closed outcome contract.
- `packages/rules-engine/src/progression/progression-revalidation.ts` — existing preserved-downstream repair model that Phase 5 should stay compatible with.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/planner/src/routes/skills.tsx`: ready route entrypoint for the Phase 5 skill editor.
- `apps/planner/src/routes/stats.tsx`: ready route entrypoint for the synchronized read-only stats panel.
- `apps/planner/src/features/level-progression/store.ts`: current per-level state model with `activeLevel`, `lastEditedLevel`, and per-level record updates.
- `apps/planner/src/features/level-progression/selectors.ts`: existing projection pattern for rail entries, active sheets, and progression summary.
- `apps/planner/src/components/shell/summary-panel.tsx`: current shell summary consumer that can be extended with Phase 5 status once skill state exists.
- `apps/planner/src/lib/copy/es.ts`: Spanish copy source already containing placeholders for `Habilidades` and `Estadísticas`.

### Established Patterns
- Feature state is kept in dedicated Zustand stores instead of folding everything into the shell store.
- UI state is projected through selectors that combine feature state with rules-engine legality helpers.
- Validation is fail-closed and distinguishes `blocked`, `illegal`, `legal`, and pending states clearly.
- Phase 4 already established the preferred interaction shape for level-driven editing: a rail plus one active detail sheet, with preserved downstream edits marked for repair.

### Integration Points
- Phase 5 should hook skill-editing state to the existing progression levels rather than creating a disconnected parallel planning model.
- Derived skill outcomes need to project into `Habilidades`, `Estadísticas`, and likely the persistent summary panel without changing route ownership.
- Rules-engine additions for skill legality and derived math should align with the existing progression helper pattern so later phases can reuse the same build snapshot.

</code_context>

<specifics>
## Specific Ideas

- Treat `Habilidades` as the skill-specific counterpart to the existing Phase 4 progression editor.
- Keep the user on one active level at a time instead of pushing them into a dense spreadsheet-first workflow.
- Preserve later skill work when earlier choices change so the user can repair instead of rebuild.
- Make `Estadísticas` useful in this phase, but only as a technical mirror of the skill system rather than a general character dashboard.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---
*Phase: 05-skills-derived-statistics*
*Context gathered: 2026-03-31*
