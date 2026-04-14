# Phase 4: Level Progression & Class Path - Research

**Researched:** 2026-03-30
**Domain:** Level-by-level progression editing, class selection, prerequisite validation, and downstream invalidation inside the routed planner shell
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Keep `Construcción` as a single route and screen rather than introducing a second navigation layer.
- **D-02:** Keep the origin visible as a summarized foundation block, while the level progression becomes the primary editor inside `Construcción`.
- **D-03:** Use a level rail covering `1-16` as the main progression navigator.
- **D-04:** Edit the selected level in a right-side sheet rather than expanding all levels inline.
- **D-05:** Preserve later levels when an earlier level changes instead of deleting downstream work automatically.
- **D-06:** Mark later affected levels as blocked or invalid until the user repairs them.
- **D-07:** Each level sheet should own class selection, prerequisite validation, and the summary of gains or decisions for that level.
- **D-08:** Ability increases that occur at a level should appear in that level sheet even though `Atributos` remains the dedicated screen for the aggregate attribute view.

### the agent's Discretion
- Exact visual placement of the origin summary inside `Construcción`, as long as it stays secondary to the progression editor.
- Exact blocked or invalid affordance for downstream broken levels, provided preserved levels remain visibly repairable.
- Exact density of per-level gains, provided class choice, prerequisite state, and level rewards remain readable.

### Deferred Ideas (OUT OF SCOPE)
- Skill allocation, feat choices, spells, domains, persistence, sharing, and full-build legality recomputation
- Extractor-backed final class datasets and forum reconciliation beyond what the current compiled planner fixtures can support
- Any extra screen hierarchy beyond the existing top-level planner sections
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FLOW-03 | The user can return to any prior decision without losing coherence in the build. | Preserve downstream levels and revalidate them instead of deleting them on upstream edits. |
| ABIL-02 | The user can assign ability increases at the levels where they apply. | Treat level-based ability increases as level-owned decisions with a reflected impact on the aggregate attribute view. |
| PROG-01 | The user can build a full progression from level 1 to level 16. | Introduce a typed progression store with an explicit fixed-length level model capped by the dataset manifest. |
| PROG-02 | The user can raise and lower levels without breaking the internal build state. | Model progression as an ordered state machine with per-level validation and downstream invalidation. |
| PROG-03 | The user can view the progression level by level. | Use a level rail plus active level sheet rather than a collapsed final-summary-only model. |
| CLAS-01 | The user can choose Puerta base and prestige classes supported by the server. | Add a compiled planner-facing class catalog fixture keyed by canonical `class:*` IDs. |
| CLAS-02 | The user can see and satisfy entry prerequisites for each class or prestige class. | Evaluate class-entry legality through pure helpers that emit `ValidationOutcome`-style issues. |
| CLAS-03 | The planner blocks illegal multiclass selections, minimum-class blocks, and known exceptions. | Keep multiclass and progression-specific rule enforcement in separate pure resolvers rather than inline route logic. |
| CLAS-04 | The user can see gains or relevant choices earned at each class level. | Level sheets need per-level gain summaries alongside class choice and validation state. |
</phase_requirements>

## Project Constraints

- Static web app only; runtime data must stay compiled/static-friendly and GitHub Pages safe.
- Visible UI remains Spanish-first and NWN2DB-like in flow, but NWN1-inspired in presentation.
- Validation remains fail-closed; blocked or ambiguous class rules must not appear legal.
- Phase 3 already established route ownership, dedicated domain stores, selector-based summary projections, and the board-style `Construcción` language.
- The current repo has no class editor, no progression state, no class fixture, and no rules-engine helpers for class entry or multiclass legality yet.

## Summary

Phase 4 is another greenfield domain phase, but unlike Phase 3 it cannot stand alone: it must consume the finished Phase 3 foundation state and extend `Construcción` from an origin-only board into the central progression workspace. The repo already provides the shell, the persistent summary panel, a dedicated foundation store, and a proven pattern for selector-driven blocked or illegal states. What it does not have is any notion of a level record, class catalog, class prerequisites, multiclass legality, or per-level gains. Planning this phase as "wire existing class data" would therefore be incorrect.

The cleanest shape is to introduce a dedicated progression state slice separate from both the shell store and the foundation store, with a fixed ordered record for levels `1` through `16`. Each level should be addressable by index, own a selected class ID plus any level-scoped decisions, and derive a validation snapshot that can mark downstream levels blocked or invalid when an earlier change breaks the path. That gives Phase 4 the editing semantics required by `FLOW-03` and `PROG-02`, and it keeps later phases free to consume progression state without reworking route ownership.

Class legality should stay out of route JSX for the same reason origin legality moved into pure helpers in Phase 3. Phase 4 needs planner-facing compiled class data plus pure resolvers for class-entry checks, per-level gain summaries, and progression-specific constraints. Those resolvers should produce `legal | illegal | blocked` style outputs and affected IDs so the level rail, active level sheet, and persistent summary panel cannot drift apart. The board UI can then remain consistent with the left-control/right-sheet pattern already shipped, while the user sees a stable 1-16 rail, an active level sheet, and preserved-but-broken downstream levels after upstream edits.

**Primary recommendation:** Plan Phase 4 as three layers. First, create the progression store, level rail model, and Build-route composition. Second, add the compiled class catalog plus per-level prerequisite and gain resolvers. Third, add multiclass and progression-specific legality enforcement plus downstream invalidation, with tests that prove earlier-level edits do not destroy later work.

## Standard Stack

### Core

| Library / Tool | Purpose | Why Standard Here |
|----------------|---------|-------------------|
| React 19.x | Render the level rail and active level sheet | Already powers the routed shell and the board-style interaction model. |
| Zustand 5.x | Own editable progression state separately from shell and foundation state | Matches the Phase 3 domain-store boundary and prevents shell-state overload. |
| Zod 4.x | Validate the planner-facing class catalog or progression fixture shape | Preserves the contracts-first pattern established in earlier phases. |
| Vitest 4.x + Testing Library | Exercise level editing flows, downstream invalidation, and summary updates | Matches the existing route-level verification style. |

### Supporting

| Library / Tool | Purpose | When to Use |
|----------------|---------|-------------|
| `@tanstack/react-router` | Keep progression anchored in the existing `Construcción` route | Reuse the stable top-level section flow rather than adding nested route complexity. |
| Existing CSS tokens and board classes | Keep the progression UI visually continuous with Phase 3 | Extend the current board language instead of inventing a second planner skin. |
| Existing `ValidationOutcome` vocabulary | Drive blocked or invalid level states consistently | Reuse project-standard status semantics instead of inventing new booleans. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Dedicated progression store | Fold progression into `usePlannerShellStore` or foundation store | Blurs shell chrome with build logic and makes later phases harder to evolve safely. |
| Fixed level records | Freeform append-only rows | Weaker guarantees for a capped `1-16` planner and harder downstream invalidation. |
| Pure class or progression resolvers | Route-local conditional logic | Repeats the Phase 3 anti-pattern avoided by selector-driven validation. |
| Preserved downstream invalidation | Automatic truncation of later levels | Technically simpler but violates the locked user preference not to lose work. |

## Architecture Patterns

### Pattern 1: Dedicated Progression Store Separate from Foundation and Shell

Add a new progression store that owns:
- the ordered level list or record for levels `1` through `16`
- selected class IDs and level-scoped decisions
- active level index in the Build editor
- downstream blocked or invalid markers
- projection inputs for the summary panel and later skill or feat phases

The foundation store should remain the source of origin and base attributes; shell state should remain shell-only.

### Pattern 2: Compiled Class Catalog Fixture or Adapter

Phase 4 needs a planner-facing compiled fixture for classes and class gains because the extractor pipeline is not built yet. That adapter should expose:
- canonical `class:*` IDs
- visible Spanish labels
- base versus prestige class metadata
- prerequisite descriptors
- per-level gains or milestone descriptors
- any minimum-class or progression-specific tags the legality helpers need

This keeps the static-data boundary intact and gives later extractor work a clean replacement seam.

### Pattern 3: Pure Progression and Class Resolvers

Introduce pure helpers for:
- class eligibility at a given level
- per-level gain summaries
- downstream invalidation after upstream edits
- multiclass and progression-specific rule checks
- ability-increase availability at the levels where it applies

Those helpers should emit structured blocked or illegal issues and level-scoped projections rather than leaving interpretation to route components.

### Pattern 4: Single-Route Build Editor with Secondary Foundation Summary

Do not split `Construcción` into nested subroutes or tabs. Instead:
- keep one Build route
- surface the Phase 3 origin as a summary block
- make the level rail the primary navigator
- render the active level in the right-side sheet

This preserves the locked screen-ownership decision and stays closest to the existing planner shell.

### Pattern 5: Preserve-and-Revalidate Editing Semantics

Model progression edits as preserve-first operations:
- when level `N` changes, keep levels `N+1...16`
- recompute their legality
- mark broken levels blocked or invalid
- expose reasons in both the rail and active level sheet

That makes later repair work explicit and prevents destructive auto-truncation.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Progression identity | Ad hoc arrays of loose objects | Typed level records keyed by level index and canonical IDs | Easier to revalidate and safer for later phases. |
| Class legality | JSX booleans spread across components | Pure class/progression resolvers returning structured outcomes | Keeps rail, sheet, and summary in sync. |
| Downstream repair | Manual component flags with no central source | Selector-driven invalidation projection | Prevents drift between preserved levels and visible status. |
| Level gains | Freeform copy strings baked into UI | Catalog-backed level gain descriptors | Lets later phases consume the same data. |
| Ability increases | Separate hidden logic disconnected from progression | Level-owned milestone decisions reflected into aggregate attributes | Matches the locked Phase 4 decision and requirement `ABIL-02`. |

## Common Pitfalls

### Pitfall 1: Treating progression as only a final build summary
Phase 4 explicitly needs level-by-level editing and inspection. A single final-class summary would fail `PROG-01` and `PROG-03`.

### Pitfall 2: Auto-deleting downstream levels
The locked user preference is to preserve later work and mark it broken. Truncation would destroy edits and violate the expected repair workflow.

### Pitfall 3: Merging progression state into the shell store
Phase 3 already established that shell chrome and domain data should stay separate. Ignoring that will make Phase 5-7 harder to layer on.

### Pitfall 4: Hiding ability increases away from the level where they occur
The user wants level sheets to explain the level itself. If a level-based attribute increase only appears in `Atributos`, the progression view loses an important piece of context.

### Pitfall 5: Deferring multiclass rules until later phases
Phase 4 already owns class-path legality. If multiclass or minimum-class blocks are deferred, the timeline can present illegal progressions as if they were sound.

## Code Examples

### Progression Store Shape
```ts
interface LevelProgressionState {
  datasetId: string;
  activeLevelIndex: number;
  levels: Array<{
    level: number;
    classId: CanonicalId | null;
    abilityIncrease?: AttributeKey | null;
  }>;
}
```

### Derived Level Projection
```ts
interface LevelProjection {
  level: number;
  classLabel: string | null;
  status: 'legal' | 'illegal' | 'blocked' | 'pending';
  issueCount: number;
  gains: string[];
}
```

## Recommended Plan Breakdown

| Plan | Scope | Must Decide | Exit Criteria |
|------|-------|-------------|---------------|
| `04-01` Build the level timeline and editable progression state | Add the progression fixture or adapter, dedicated progression store, Build-route composition, level rail, active-level sheet scaffold, and route tests. | Exact store boundary, Build-route composition, and the shape of the fixed `1-16` level model. | `Construcción` shows the summarized foundation plus a 1-16 rail and active level sheet, and users can select and revisit levels without destroying route ownership. |
| `04-02` Implement class catalogs, prerequisites, and per-level gains | Add the planner-facing class catalog, pure class-entry helpers, level-sheet gain summaries, and ability-increase slots tied to the right levels. | Exact class catalog fields, prerequisite projection shape, and how level gains are summarized in the sheet. | Users can choose classes per level, see whether entry is legal before confirming, and review level gains including attribute increases when applicable. |
| `04-03` Enforce multiclass and progression-specific Puerta rules | Add multiclass, minimum-class, and progression-chain legality helpers plus preserved downstream invalidation and summary integration. | Exact issue payload shape for broken downstream levels and how multiclass restrictions surface in the rail versus sheet. | Earlier-level edits preserve later levels, affected levels become blocked or invalid with explicit reasons, and the planner blocks known illegal class paths. |

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.x + Testing Library |
| Config file | `vitest.config.ts` |
| Quick run command | `pnpm vitest run tests/phase-04 --reporter=dot` |
| Full suite command | `pnpm vitest run` |
| Estimated runtime | ~25 seconds |

### Validation Gates

| Gate | Enforced In | What Must Hold |
|------|-------------|----------------|
| Build-route composition gate | `tests/phase-04/build-progression-shell.spec.tsx` | `Construcción` keeps a visible foundation summary while the level rail becomes the primary editor. |
| Timeline editing gate | `tests/phase-04/level-timeline.spec.tsx` | Users can select levels `1` through `16`, move back to earlier levels, and keep later levels intact. |
| Class-entry gate | `tests/phase-04/class-prerequisites.spec.ts` | Class catalogs and pure prerequisite helpers agree on legal versus blocked or illegal class picks. |
| Downstream invalidation gate | `tests/phase-04/progression-revalidation.spec.tsx` | An upstream class change preserves later levels and marks affected ones blocked or invalid with visible reasons. |
| Multiclass gate | `tests/phase-04/multiclass-rules.spec.ts` | Known multiclass or minimum-class restrictions are enforced through pure progression resolvers. |
| UI contract gate | Manual review or future `04-UI-SPEC.md` | The progression rail and active-level sheet remain visually coherent with the NWN1 Build board language on desktop and mobile. |

## Sources

### Primary
- `AGENTS.md`
- `.planning/PROJECT.md`
- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`
- `.planning/STATE.md`
- `.planning/phases/01-canonical-puerta-dataset/01-CONTEXT.md`
- `.planning/phases/02-spanish-first-planner-shell/02-CONTEXT.md`
- `.planning/phases/03-character-origin-base-attributes/03-CONTEXT.md`
- `.planning/phases/03-character-origin-base-attributes/03-RESEARCH.md`
- `.planning/phases/03-character-origin-base-attributes/03-VALIDATION.md`
- `.planning/phases/04-level-progression-class-path/04-CONTEXT.md`
- `apps/planner/src/routes/root.tsx`
- `apps/planner/src/routes/abilities.tsx`
- `apps/planner/src/lib/sections.ts`
- `apps/planner/src/lib/copy/es.ts`
- `apps/planner/src/components/shell/planner-shell-frame.tsx`
- `apps/planner/src/components/shell/summary-panel.tsx`
- `apps/planner/src/state/planner-shell.ts`
- `apps/planner/src/features/character-foundation/store.ts`
- `apps/planner/src/features/character-foundation/selectors.ts`
- `packages/rules-engine/src/contracts/canonical-id.ts`
- `packages/rules-engine/src/contracts/validation-outcome.ts`
- `packages/data-extractor/src/contracts/dataset-manifest.ts`

### Secondary
- `.planning/research/SUMMARY.md`
- `.planning/research/ARCHITECTURE.md`
- `.planning/research/PITFALLS.md`
- `.planning/research/FEATURES.md`

## Metadata

**Research date:** 2026-03-30
**Valid until:** 2026-04-29
