# Phase 2: Spanish-First Planner Shell - Research

**Researched:** 2026-03-30
**Domain:** Static React planner shell, Spanish-first navigation, and NWN1-inspired presentation baseline
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Phase 2 builds a route-driven SPA in `apps/planner`, not a multi-page site or wizard-only shell.
- **D-02:** The planner frame is persistent across sections so later phases can reuse the same navigation, header, and summary chrome.
- **D-03:** The shell mirrors the NWN2DB mental model with first-class sections for `Build`, `Skills`, `Spells`, `Abilities`, `Stats`, `Summary`, and `Utilities`.
- **D-04:** Navigation, headings, and framing ship in Spanish from the first shell pass.
- **D-05:** The shell reserves a persistent summary/status region for future character identity, dataset version, and validation state.
- **D-06:** Visual direction is NWN1-inspired: parchment, stone, metal, serif-forward typography, and framed panels.
- **D-07:** The runtime keeps respecting Phase 1's data boundary: compiled/static-friendly data only, never raw assets or machine-local paths.
- **D-08:** Placeholder data should still be shaped around canonical IDs and validation outcomes so later phases can replace shell scaffolding without structural rewrites.

### the agent's Discretion
- Exact route tree and component folder organization inside `apps/planner`
- CSS architecture as long as it remains static-site friendly and aligns with the UI-SPEC
- Placeholder copy depth and test granularity for the shell baseline

### Deferred Ideas (OUT OF SCOPE)
- Full character editing flows
- Detailed legality rendering beyond shell placeholders
- Save/load/import/export and dataset mismatch UX
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LANG-01 | Shell navigation and framing are Spanish-first. | Centralize section metadata and shell copy in Spanish-backed configs so routes and UI text cannot drift. |
| FLOW-01 | Users can move across the main planner areas in an NWN2DB-equivalent flow. | Use a route-driven shell with stable section ids, persistent navigation, and a shared frame. |
| FLOW-02 | The shell looks intentionally NWN1-inspired rather than like a generic web tool. | Lock a design contract early: parchment/stone surfaces, serif-forward typography, and constrained accent usage. |
</phase_requirements>

## Project Constraints

- Static web app only; output must remain HTML/CSS/JS suitable for GitHub Pages.
- Recommended stack is React 19, Vite 8, TanStack Router, Zustand, Zod, Vitest, and Playwright.
- Spanish-first product surface is non-negotiable.
- UI should mirror NWN2DB workflow without copying its skin.
- Browser runtime consumes compiled datasets only.
- Phase 1 contracts already exist and should be treated as the runtime identity boundary.

## Summary

Phase 2 should establish the app shell, not final gameplay logic. The repo already has a pnpm workspace and contract packages, but it has no `apps/planner` app, no router, and no UI primitives. That makes this the right phase to lock the baseline structure: one planner app package, one shared shell frame, one section registry, and one visual token system that later phases can extend without reworking the entrypoint.

The cleanest fit for the declared stack is a code-defined TanStack Router tree plus a small Zustand store. A code-defined route tree avoids generated route artifacts and keeps the first shell easy to reason about while the app is still small. Zustand should only own shell-level concerns in this phase: active navigation state, mobile nav visibility, and placeholder summary chrome. Domain-heavy build data can stay out until later phases wire real forms and legality computations.

For the visual system, plain CSS with token files is the lowest-friction choice for a static planner that wants a distinct identity. The project does not yet have a component library or utility-class convention, so introducing one during the shell phase would add architectural noise. A dedicated token file, font imports, and a small set of shell component classes are enough to establish the NWN1 direction without locking the later UI into a heavyweight styling framework.

**Primary recommendation:** Treat Phase 2 as a shell-and-contract phase for the frontend: bootstrap `apps/planner`, define section metadata and route scaffolding, then layer Spanish framing and the NWN1 visual contract on top.

## Standard Stack

### Core

| Library / Tool | Purpose | Why Standard Here |
|----------------|---------|-------------------|
| React 19.x | SPA rendering and shell composition | Matches the recommended stack and fits long-lived shell state and route layouts. |
| react-dom 19.x | Browser mount layer | Required for the planner SPA entrypoint. |
| Vite 8.x | Static-friendly dev/build pipeline | Minimal setup for GitHub Pages-compatible assets and route shell iteration. |
| `@vitejs/plugin-react` | React transform support | Standard Vite pairing for React 19. |
| `@tanstack/react-router` | Route-driven shell and deep-linkable planner sections | Matches the recommended stack and keeps section flow explicit. |
| Zustand 5.x | Lightweight shell state | Enough for navigation state, summary chrome, and route-adjacent UI state without overbuilding. |
| Vitest 4.x | Shell smoke and contract tests | Already present in the repo and suitable for route/copy/theme checks. |

### Supporting

| Library / Tool | Purpose | When to Use |
|----------------|---------|-------------|
| `@testing-library/react` | Render-level shell tests | Use for navigation/copy/layout smoke tests in `tests/phase-02`. |
| `jsdom` | DOM test environment for Vitest | Needed once shell component tests render React routes. |
| `lucide-react` | Small icon set for navigation and summary chrome | Use sparingly so the shell stays ornamental rather than icon-heavy. |
| `@fontsource/cormorant-garamond` | Display/heading font delivery | Use for NWN1-style headings without external font CDN dependence. |
| `@fontsource/spectral` | Body/label font delivery | Use for readable Spanish UI copy across the shell. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Code-defined TanStack routes | File-based route generation | Adds generated artifacts early without much value for a seven-screen shell. |
| Zustand shell store | Pure component state | Makes persistent nav/drawer/summary behavior harder to coordinate once routes grow. |
| Plain CSS tokens | Utility framework or component kit | Faster to start but pushes the shell toward generic styling and more tooling decisions than this phase needs. |

## Architecture Patterns

### Pattern 1: Section Registry as Source of Truth

Keep one section registry that defines route key, path, Spanish label, icon id, and placeholder status for each planner area. Navigation, route creation, summary chrome, and tests should all read from the same registry so the shell cannot drift.

Recommended section ids:
- `build`
- `skills`
- `spells`
- `abilities`
- `stats`
- `summary`
- `utilities`

### Pattern 2: Shared Planner Frame

Build one root layout that owns:
- Header/title treatment
- Primary navigation rail
- Main section outlet
- Summary/status aside
- Mobile drawer trigger and overlay state

Every route should render inside this frame. Do not let each page invent its own shell.

### Pattern 3: Contract-Shaped Placeholder Data

Even while the shell is mostly placeholder content, structure summary/status data around Phase 1 vocabulary:
- dataset version badge shaped like `datasetId`
- validation status shaped like `legal | illegal | blocked`
- canonical ids used internally for future entity references

That keeps Phase 2 scaffold files compatible with later gameplay phases.

### Pattern 4: Token-Driven NWN1 Styling

Define shell visuals through CSS custom properties and a small layer of shared shell classes:
- surface/background tokens
- border and ornament tokens
- heading/body font tokens
- spacing scale tokens
- focus/active/destructive treatment tokens

This keeps styling explicit and grep-verifiable while preserving a distinct NWN1 look.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Section routing | Custom hash or manual pathname parsing | TanStack Router route config | Keeps route behavior explicit and testable. |
| Shared shell state | Prop-drilled nav state | Zustand shell store | Simplifies responsive shell behaviors. |
| Theme values | Inline colors and spacing per component | Central token CSS files | Prevents visual drift and generic styling. |
| Placeholder domain data | Arbitrary string blobs | Phase 1 contract-shaped shell view models | Later phases can replace scaffolding safely. |

## Common Pitfalls

### Pitfall 1: Building the final planner too early
If Phase 2 starts implementing actual rules logic or data extraction hooks, the shell phase bloats and later phases lose their boundaries.

### Pitfall 2: Letting English route labels leak into the visible UI
Stable route ids can stay English-like internally, but every visible label in the shell should already be Spanish-first.

### Pitfall 3: Copying NWN2DB's skin instead of its workflow
The roadmap wants the same mental model, not a visual clone. Reusing its exact styling would undercut the project's identity goal.

### Pitfall 4: Designing only for desktop
The shell can be desktop-forward, but Phase 2 must still establish a mobile drawer or equivalent responsive navigation pattern.

### Pitfall 5: Treating placeholder state as disposable
If Phase 2 placeholders ignore canonical ids and validation vocabulary, later phases will have to rework the shell instead of extending it.

## Code Examples

### Section Registry
```ts
export const plannerSections = [
  { id: 'build', path: '/', label: 'Construccion' },
  { id: 'skills', path: '/skills', label: 'Habilidades' },
  { id: 'spells', path: '/spells', label: 'Conjuros' },
  { id: 'abilities', path: '/abilities', label: 'Atributos' },
  { id: 'stats', path: '/stats', label: 'Estadisticas' },
  { id: 'summary', path: '/summary', label: 'Resumen' },
  { id: 'utilities', path: '/utilities', label: 'Utilidades' },
] as const;
```

### Shell State Shape
```ts
type ValidationBadge = 'legal' | 'illegal' | 'blocked';

interface PlannerShellState {
  activeSection: 'build' | 'skills' | 'spells' | 'abilities' | 'stats' | 'summary' | 'utilities';
  mobileNavOpen: boolean;
  summaryPanelOpen: boolean;
  datasetId: string;
  validationStatus: ValidationBadge;
}
```

## Recommended Plan Breakdown

| Plan | Scope | Must Decide | Exit Criteria |
|------|-------|-------------|---------------|
| `02-01` Build the SPA shell and route/state skeleton | `apps/planner` bootstrap, Vite/React setup, router, shell state, section registry | App entry shape, route layout, shell state boundary | App boots, builds statically, and exposes stable routes for all planner sections. |
| `02-02` Implement Spanish-first navigation and screen framing | Spanish labels, responsive nav, persistent summary/status frame | Exact visible copy, summary placeholder content, desktop/mobile nav behavior | Users can move through all planner sections and see Spanish-first framing across the shell. |
| `02-03` Establish the NWN1 visual system | Theme tokens, fonts, ornamental shell styling, responsive polish | Exact token names, ornament usage, focus/active states | Shell clearly reads as NWN1-inspired instead of generic web tooling. |

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.x + React render smoke tests |
| Config file | `vitest.config.ts` plus planner-specific test entries |
| Quick run command | `corepack pnpm vitest run tests/phase-02 --reporter=dot` |
| Full suite command | `corepack pnpm vitest run` |

### Validation Gates

| Gate | Enforced In | What Must Hold |
|------|-------------|----------------|
| Build gate | planner app package | `apps/planner` builds to static assets with no backend/runtime asset parsing |
| Route gate | shell route tests | All seven planner sections exist as reachable routes or route entries |
| Language gate | copy tests | Visible shell navigation and headings are Spanish-first |
| Theme gate | token/theme tests | NWN1 design tokens and font imports are present and constrained to the UI-SPEC |

## Sources

### Primary
- `AGENTS.md`
- `.planning/PROJECT.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `.planning/phases/02-spanish-first-planner-shell/02-CONTEXT.md`
- `.planning/phases/02-spanish-first-planner-shell/02-UI-SPEC.md`
- `package.json`
- `pnpm-workspace.yaml`
- `tsconfig.base.json`
- `packages/data-extractor/src/contracts/dataset-manifest.ts`
- `packages/rules-engine/src/contracts/canonical-id.ts`
- `packages/rules-engine/src/contracts/validation-outcome.ts`

### Secondary
- `.planning/phases/01-canonical-puerta-dataset/01-RESEARCH.md`
- `.planning/phases/01-canonical-puerta-dataset/01-01-PLAN.md`

## Metadata

**Research date:** 2026-03-30
**Valid until:** 2026-04-29
