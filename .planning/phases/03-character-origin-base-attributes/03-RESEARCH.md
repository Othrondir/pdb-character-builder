# Phase 3: Character Origin & Base Attributes - Research

**Researched:** 2026-03-30
**Domain:** Origin selection, starting-attribute editing, and fail-closed legality feedback inside the routed planner shell
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Keep race, subrace, alignment, and deity editing in `Construccion`, while starting attributes live in `Atributos`.
- **D-02:** Keep `Atributos` blocked until the origin state is sufficiently defined to evaluate starting-attribute legality.
- **D-03:** Model origin selection as a stepped, dependent flow rather than a flat all-at-once chooser.
- **D-04:** Keep the deity field visible at all times and expose an explicit `Sin deidad` option whenever no deity is required.
- **D-05:** Center the attribute UI on the supported cost or budget rule whenever the dataset exposes one.
- **D-06:** Surface legality and budget feedback at the point of entry, not only in a later audit screen.
- **D-07:** Show incompatibilities inline next to the relevant origin or attribute control.
- **D-08:** Reflect illegal or unresolved origin and attribute conflicts in the persistent summary panel as a blocked global state.

### the agent's Discretion
- Exact unlock rule for when origin is "sufficiently defined" to enable `Atributos`, as long as it follows real rule dependencies.
- Exact component split and folder layout for the Phase 3 boards.
- Exact visualization of remaining budget and derived totals, as long as the UI stays budget-led and NWN1-consistent.

### Deferred Ideas (OUT OF SCOPE)
- Class choice, progression, feats, skills, spells, persistence, and sharing
- Final dataset extraction pipeline
- Any runtime parsing of raw NWN or `nwsync` assets
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CHAR-01 | User can choose race and subrace from Puerta-supported options. | Use a compiled/static option catalog keyed by canonical IDs, with dependent filtering from race to subrace. |
| CHAR-02 | User can choose alignment compatibly with server restrictions. | Evaluate alignments through pure legality helpers that return `ValidationOutcome`-style results and inline reasons. |
| CHAR-03 | User can choose deity when the build requires one. | Keep deity visible at all times, include `Sin deidad`, and resolve required vs optional deity through origin-derived rules. |
| CHAR-04 | User can see restrictions or incompatibilities caused by race, subrace, alignment, or deity. | Drive UI badges and inline messages from a single foundation-validation projection so local feedback and summary status cannot drift. |
| ABIL-01 | User can define starting attributes according to the supported creation rules. | Introduce a typed attribute-budget engine plus editable base-attribute state gated behind origin completeness. |
</phase_requirements>

## Project Constraints

- Static web app only; all runtime data must stay HTML/CSS/JS and GitHub Pages compatible.
- Browser runtime must consume compiled/static-friendly datasets only; no raw game-asset parsing or local-path assumptions.
- Spanish-first visible UI is mandatory.
- NWN2DB workflow parity matters more than visual similarity; Phase 3 must preserve the routed shell and summary panel shipped in Phase 2.
- Phase 1 contracts already locked canonical IDs, dataset identity, and fail-closed `blocked` semantics. Phase 3 should extend those, not redefine them.

## Summary

Phase 3 is greenfield at the domain layer. The current app has the Phase 2 shell, routing, Spanish copy, and summary chrome, but the `Construccion` and `Atributos` routes still render generic placeholder panels. There is no character-foundation store, no planner-facing option catalog, no origin or attribute legality helpers, and no compiled dataset payload in the repo beyond manifest or catalog contracts. That combination matters: the phase cannot be planned as "wire the existing character editor" because no such editor exists yet.

The cleanest implementation shape is to add a dedicated character-foundation state slice and a small planner-facing compiled fixture or adapter that represents only the Phase 3 concerns: race, subrace, alignment, deity, supported creation rule, and base-attribute limits. That dataset should stay static-friendly and canonical-ID based, so later extractor work can swap the source without forcing a UI rewrite. The browser can safely import a committed JSON or TypeScript fixture as a temporary compiled dataset, but it should still validate the shape on load and preserve explicit `datasetId` handling in the planner store.

Rules logic should stay out of JSX. Origin compatibility, deity requirement resolution, and attribute-budget calculations belong in pure functions or rules-engine helpers that return structured legality output. The UI then consumes derived projections: available options, locked-step reasons, inline blocked or illegal messages, spent budget, remaining budget, and a summary snapshot for the shell aside. This keeps Phase 3 compatible with the project's long-term rules-engine direction and avoids scattering legality logic across route components.

**Primary recommendation:** Plan Phase 3 as two layers that meet in the middle. First, create the static origin or attribute data adapter plus a dedicated foundation store and summary projection. Second, add pure legality and budget resolvers and render them through the `Construccion`, `Atributos`, and summary-panel integration points defined in Phase 2 and the approved UI-SPEC.

## Standard Stack

### Core

| Library / Tool | Purpose | Why Standard Here |
|----------------|---------|-------------------|
| React 19.x | Render stepped origin and attribute boards | Already powers the routed shell and fits the board-style UI contract. |
| Zustand 5.x | Own editable character-foundation state | Keeps Phase 3 domain state separate from shell chrome while staying lightweight. |
| Zod 4.x | Validate the planner-facing compiled fixture or adapter shape | Preserves the Phase 1 contracts-first discipline at the browser boundary. |
| Vitest 4.x + Testing Library | Exercise route flows, gating, and summary updates | Matches the Phase 2 test style and current repo tooling. |

### Supporting

| Library / Tool | Purpose | When to Use |
|----------------|---------|-------------|
| `@tanstack/react-router` | Keep `Construccion` and `Atributos` as route-owned screens | Reuse the Phase 2 route tree; do not replace it with a wizard-only flow. |
| `lucide-react` | Limited glyph use for list markers or state hints | Use sparingly; the UI contract favors panel framing over icon-heavy chrome. |
| Existing CSS token files | Preserve NWN1 shell identity | Extend `tokens.css` and `styles/app.css` instead of creating an unrelated component theme. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Dedicated foundation store | Expand `planner-shell.ts` into a single giant store | Blurs shell chrome with build data and makes later progression phases harder to evolve safely. |
| Pure validation helpers | Inline JSX conditionals per control | Fast to start but causes legality logic to fragment across routes and summary state. |
| Static compiled fixture | Ad hoc hardcoded option arrays inside components | Violates the compiled-data boundary in spirit and makes extractor replacement harder later. |

## Architecture Patterns

### Pattern 1: Character-Foundation Store Separate from Shell Store

Keep `usePlannerShellStore` focused on shell chrome only. Add a separate Phase 3 domain store for:
- selected race, subrace, alignment, deity, and base attributes
- current dataset identity for the foundation data
- derived readiness flags such as `originReadyForAbilities`
- validation projection or issue list inputs

This prevents later Phase 4 progression state from being forced into shell-only files.

### Pattern 2: Compiled Foundation Dataset Adapter

Create a planner-facing static dataset module that exposes only the minimum Phase 3 truth:
- races and subraces keyed by canonical IDs
- alignment catalog
- deity catalog including explicit optionality support
- origin restriction descriptors
- supported creation rule for base attributes, including costs, caps, and budget

The repo currently has manifest and catalog contracts but no runtime dataset files. Phase 3 therefore needs a temporary compiled fixture or adapter, not a fetch from raw extractor inputs.

### Pattern 3: Pure Origin and Attribute Resolvers

Origin coherence and base-attribute legality should resolve through pure functions that return structured output:
- available or blocked options for each step
- inline issue payloads tied to affected canonical IDs
- a global severity projection that can map to summary-panel status
- spent and remaining attribute budget
- lock reason when `Atributos` is unavailable

The existing `ValidationOutcome` contract already encodes `legal`, `illegal`, and `blocked`, so Phase 3 should reuse that vocabulary rather than inventing UI-only states.

### Pattern 4: Route-Owned Boards with Shared Presentation Parts

Keep the route ownership from the context:
- `apps/planner/src/routes/root.tsx` becomes the `Construccion` board
- `apps/planner/src/routes/abilities.tsx` becomes the `Atributos` board

Shared presentational pieces such as step rail rows, help pane sections, budget rows, or live character-sheet rows can live in Phase 3-specific component modules, but the route split should remain intact so later phases can keep extending the same flow.

### Pattern 5: Summary Projection as a First-Class Output

Do not treat the summary panel as passive text replacement. It should consume a dedicated Phase 3 summary projection derived from the foundation store:
- visible identity fields
- chosen or missing deity state
- blocked or illegal global status
- short reason text when the origin is incomplete or contradictory

That keeps shell status synchronized with the most severe current origin or attribute problem, which is a locked Phase 3 decision.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Runtime data sourcing | Component-local hardcoded arrays | One typed foundation dataset module | Keeps compiled-data boundaries explicit and swappable. |
| Legality vocabulary | Ad hoc booleans like `isValid` and `hasError` | `legal | illegal | blocked` plus structured issue data | Matches Phase 1 contracts and summary-panel behavior. |
| Attribute budget math | Inline per-button arithmetic in JSX | Pure budget helpers | Easier to test and reuse once later phases need prerequisites. |
| Route flow | Wizard state that bypasses routes | Existing router and route views | Preserves Phase 2 shell expectations and deep-linkable sections. |

## Common Pitfalls

### Pitfall 1: Treating missing or ambiguous rules as selectable-but-valid
Phase 1 explicitly requires fail-closed behavior. If a race, deity rule, or attribute rule cannot be verified by the current compiled fixture, the UI should surface `blocked`, not quietly allow it.

### Pitfall 2: Unlocking `Atributos` too early
If the attribute screen becomes editable before origin dependencies are resolvable, the planner will accumulate contradictions that Phase 3 is supposed to block immediately.

### Pitfall 3: Using localized labels as internal IDs
Race, subrace, deity, and alignment state should store canonical IDs, not Spanish labels, otherwise later dataset swaps and shared-build work become brittle.

### Pitfall 4: Hiding optional deity instead of making it explicit
The decision is to keep deity visible and use `Sin deidad`. Hiding the field would erase an important rule cue and make summary state harder to reason about.

### Pitfall 5: Letting route components own the entire validation model
If summary status, step availability, and inline messages each derive from separate route-local logic, the UI will drift and checker feedback will find missing global-state coverage.

## Code Examples

### Foundation Store Shape
```ts
interface CharacterFoundationState {
  datasetId: string;
  raceId: CanonicalId | null;
  subraceId: CanonicalId | null;
  alignmentId: CanonicalId | null;
  deityId: CanonicalId | 'deity:none' | null;
  baseAttributes: Record<'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha', number>;
}
```

### Derived Phase 3 Projection
```ts
interface FoundationDerivedState {
  originReadyForAbilities: boolean;
  summaryStatus: 'blocked' | 'illegal' | 'legal';
  spentBudget: number;
  remainingBudget: number;
  inlineIssues: Array<{
    control: 'race' | 'subrace' | 'alignment' | 'deity' | 'attributes';
    message: string;
    status: 'blocked' | 'illegal';
  }>;
}
```

## Recommended Plan Breakdown

| Plan | Scope | Must Decide | Exit Criteria |
|------|-------|-------------|---------------|
| `03-01` Deliver identity selectors and base character state | Add the compiled foundation-data adapter, character-foundation store, `Construccion` board, `Atributos` lock state, and summary projection wiring. | Exact store boundary, dataset fixture location, and route/component split. | User can choose race, subrace, alignment, and deity through the routed shell; `Atributos` stays visibly locked until origin readiness is met; summary panel reflects real origin state. |
| `03-02` Enforce origin restrictions and starting-ability rules | Add pure legality helpers, inline incompatibility messaging, attribute-budget editing, and Phase 3 tests. | Exact unlock rule, issue payload shape, and budget or cap presentation details. | Illegal or blocked origin combinations surface immediate reasons, attribute budget updates live, and summary-panel status matches the strongest current issue. |

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.x + Testing Library render tests |
| Config file | `vitest.config.ts` |
| Quick run command | `pnpm vitest run tests/phase-03 --reporter=dot` |
| Full suite command | `pnpm vitest run` |
| Estimated runtime | ~20 seconds |

### Validation Gates

| Gate | Enforced In | What Must Hold |
|------|-------------|----------------|
| Foundation data gate | Phase 3 dataset adapter tests | Planner-facing origin and attribute data loads from a static compiled fixture and preserves canonical IDs plus dataset identity. |
| Route gate | `tests/phase-03/origin-flow.spec.tsx` | `Construccion` renders the ordered steps `Raza`, `Subraza`, `Alineamiento`, and `Deidad`, with visible locked states when prerequisites are missing. |
| Abilities gate | `tests/phase-03/attribute-budget.spec.tsx` | `Atributos` stays locked until origin readiness is true, then enforces supported budget or cap rules while showing spent and remaining values. |
| Validation gate | `tests/phase-03/foundation-validation.spec.ts` and summary integration tests | Inline blocked or illegal reasons and summary-panel status stay synchronized with the most severe foundation issue. |
| UI contract gate | Manual review against `03-UI-SPEC.md` | Left-board or right-sheet layout, `Sin deidad`, and blocked-state wording match the approved UI contract on desktop and mobile. |

## Sources

### Primary
- `AGENTS.md`
- `.planning/PROJECT.md`
- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`
- `.planning/STATE.md`
- `.planning/phases/03-character-origin-base-attributes/03-CONTEXT.md`
- `.planning/phases/03-character-origin-base-attributes/03-UI-SPEC.md`
- `.planning/phases/01-canonical-puerta-dataset/01-CONTEXT.md`
- `.planning/phases/02-spanish-first-planner-shell/02-CONTEXT.md`
- `package.json`
- `pnpm-workspace.yaml`
- `vitest.config.ts`
- `apps/planner/package.json`
- `apps/planner/src/router.tsx`
- `apps/planner/src/routes/root.tsx`
- `apps/planner/src/routes/abilities.tsx`
- `apps/planner/src/state/planner-shell.ts`
- `apps/planner/src/components/shell/planner-shell-frame.tsx`
- `apps/planner/src/components/shell/summary-panel.tsx`
- `apps/planner/src/components/shell/section-view.tsx`
- `apps/planner/src/lib/copy/es.ts`
- `apps/planner/src/lib/sections.ts`
- `apps/planner/src/styles/tokens.css`
- `apps/planner/src/styles/app.css`
- `packages/data-extractor/src/contracts/dataset-manifest.ts`
- `packages/data-extractor/src/contracts/dataset-catalog.ts`
- `packages/rules-engine/src/contracts/canonical-id.ts`
- `packages/rules-engine/src/contracts/validation-outcome.ts`

### Secondary
- `.planning/research/ARCHITECTURE.md`
- `.planning/research/SUMMARY.md`
- `.planning/research/PITFALLS.md`
- `.planning/phases/02-spanish-first-planner-shell/02-RESEARCH.md`

## Metadata

**Research date:** 2026-03-30
**Valid until:** 2026-04-29
