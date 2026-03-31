# Phase 05: Skills & Derived Statistics - Research

**Researched:** 2026-03-31
**Domain:** NWN1 per-level skill allocation, derived-stat projection, and fail-closed planner validation
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
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

### Claude's Discretion
- Exact visual density of the skill sheet, as long as it stays level-focused and consistent with the existing rail-plus-sheet pattern.
- Exact list and grouping of read-only derived fields in `Estadísticas`, provided they directly support skill legality and explanation.
- Exact wording of repair and blocked-state messaging, as long as it remains explicit and fail-closed.

### Deferred Ideas (OUT OF SCOPE)
None - discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SKIL-01 | El usuario puede asignar rangos de habilidad por nivel segun la clase elegida y las reglas del servidor. | Per-level store + rules-engine evaluator + rail/sheet UI pattern reused from Phase 4. |
| SKIL-02 | El planner calcula y hace cumplir maximos, costes y restricciones de habilidades clase/transclase cuando aplique. | Pure rules helpers must compute spendable points, class or cross-class status, and caps from the current level snapshot. |
| SKIL-03 | El planner bloquea excepciones de habilidades del servidor, como las restricciones conocidas por armadura pesada u otras reglas explicitadas. | Server-specific exceptions must come from the compiled dataset/manual override pipeline and resolve through shared blocked/illegal validation outcomes. |
</phase_requirements>

## Summary

Phase 5 should follow the same architecture Phase 4 established: keep mutable editor state in a dedicated Zustand store, keep legality and math in pure `packages/rules-engine` helpers, and project all UI through selectors. The planner should not put skill legality in route components or duplicate derived totals across `Habilidades`, `Estadísticas`, and the summary panel.

Baseline NWN rules are stable and verified: skill points are spent at the class taken on that level, class skills cost 1 point per rank with a cap of `character level + 3`, and cross-class skills cost 1 point per half-rank with a cap of `(character level + 3) / 2`. The server-specific exceptions for heavy armor or other Puerta rules are not reliably discoverable from public web search, so this phase must treat the project's Phase 1 dataset and manual overrides as the only implementation authority for those exceptions.

The key planning choice is to model skill allocation as preserved per-level user input plus revalidated derived output. When an earlier class, INT, or other prerequisite changes, keep later user-entered allocations, mark downstream levels blocked or illegal, and expose repair state in the rail, sheet, stats view, and summary. Do not wipe downstream data automatically.

**Primary recommendation:** Build one shared skill snapshot pipeline: `foundation + progression + per-level skill edits -> rules-engine evaluation -> selectors -> Habilidades/Estadisticas/resumen`.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.4 | Route UI and screen composition | Already the app shell standard; no reason to introduce a parallel UI state model. |
| Zustand | 5.0.12 | Feature-local mutable editor state | Matches the existing Phase 3-4 store pattern and keeps React components thin. |
| Zod | 4.3.6 | Boundary validation for future serialized skill payloads | Already the repo boundary-validation standard; useful for skill-state contracts and later sharing. |
| Vitest | 4.1.2 | Rules-engine and UI verification | Existing test runner; current phase can stay almost entirely in unit and jsdom coverage. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @testing-library/react | 16.3.2 | jsdom route and component interaction tests | Use for rail, level sheet, stats view, and summary synchronization tests. |
| jsdom | 29.0.1 | DOM environment for route-level tests | Use for UI behavior that depends on router rendering and screen interactions. |
| TypeScript | 6.0.2 | Strict domain typing | Use for discriminated result types and canonical `skill:*` IDs. |
| Vite | 8.0.3 | Existing app build/runtime | Keep as-is; no Phase 5-specific build tooling is needed. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Dedicated feature store + selectors | Route-local `useState` trees | Faster to start, but it breaks cross-route synchronization and makes repair-state projection drift. |
| Pure rules-engine skill evaluator | JSX-side ad hoc calculations | Simpler short-term, but it duplicates legality logic and blocks later full-build recomputation in Phase 7. |
| Preserved downstream edits with revalidation | Truncate later skill levels on upstream change | Easier to implement, but contradicts locked decisions D-05/D-06 and Phase 4 behavior. |

**Installation:**
```bash
# No new packages are required for Phase 5.
# Keep using the existing workspace toolchain.
```

**Version verification:** Verified on 2026-03-31 with `npm view`.
- `react` 19.2.4, published 2026-01-26
- `zustand` 5.0.12, published 2026-03-16
- `zod` 4.3.6, published 2026-01-22
- `vitest` 4.1.2, published 2026-03-26
- `@testing-library/react` 16.3.2, published 2026-01-19
- `jsdom` 29.0.1, published 2026-03-20
- `typescript` 6.0.2, published 2026-03-23
- `vite` 8.0.3, published 2026-03-26

## Architecture Patterns

### Recommended Project Structure
```text
apps/planner/src/
├── features/skills/
│   ├── skill-board.tsx          # Route-owned Habilidades editor shell
│   ├── skill-rail.tsx           # Level rail mirroring Phase 4 interaction shape
│   ├── skill-sheet.tsx          # One active level sheet with rank controls
│   ├── selectors.ts             # All UI projections from store + rules snapshot
│   └── store.ts                 # Per-level raw skill allocations and active level
├── routes/skills.tsx            # Replaces placeholder with SkillBoard
└── routes/stats.tsx             # Replaces placeholder with derived stats view

packages/rules-engine/src/
└── skills/
   ├── skill-allocation.ts       # Spendable points, rank costs, caps, legality
   ├── skill-derived-stats.ts    # Skill totals and explanation-oriented derived fields
   └── skill-revalidation.ts     # Preserved-downstream repair model for earlier changes
```

### Pattern 1: Raw Edits in Store, Truth in Rules Engine
**What:** Store only user-entered per-level skill allocations and lightweight UI state. Compute spendable points, legal rank caps, totals, blocked status, and derived explanations in pure rules helpers.
**When to use:** For every skill edit and for every consumer screen in this phase.
**Example:**
```typescript
type SkillAllocation = {
  level: number;
  ranksBySkillId: Record<CanonicalId, number>;
};

type SkillSnapshotInput = {
  foundation: FoundationSnapshot;
  progressionLevels: ProgressionLevelRecord[];
  allocations: SkillAllocation[];
};

export function evaluateSkillSnapshot(input: SkillSnapshotInput) {
  // Single source of truth for skill legality and derived outputs.
  // UI should consume this through selectors, not reimplement pieces.
}
```

### Pattern 2: Preserve Downstream Levels, Revalidate After Upstream Change
**What:** Mirror `progression-revalidation.ts`: keep later skill entries after an earlier change, then compute inherited blocked or illegal state until repaired.
**When to use:** Any time class, INT, ability increases, or server exceptions change a prior level's skill context.
**Example:**
```typescript
export interface RevalidatedSkillLevel {
  inheritedFromLevel: number | null;
  issues: ValidationOutcome[];
  status: 'blocked' | 'illegal' | 'legal' | 'pending';
  level: number;
}
```

### Pattern 3: Shared Derived Projection for All Consumers
**What:** `Habilidades`, `Estadísticas`, and the summary panel must read from the same selector pipeline.
**When to use:** For totals, remaining points, class or cross-class labels, cap explanations, and repair messaging.
**Example:**
```typescript
export function selectSkillSummary(
  skillState: SkillStoreState,
  progressionState: LevelProgressionStoreState,
  foundationState: CharacterFoundationStoreState,
) {
  const snapshot = evaluateSkillSnapshot({
    foundation: createFoundationSnapshot(foundationState),
    progressionLevels: progressionState.levels,
    allocations: skillState.levels,
  });

  return projectSkillSummary(snapshot);
}
```

### Anti-Patterns to Avoid
- **Route-local math:** Do not compute caps, totals, or costs inside `skills.tsx` or `stats.tsx`.
- **Persisted derived fields:** Do not store totals, remaining points, or legality status as mutable store state.
- **Phase-specific exception constants in UI:** Do not hardcode heavy-armor or Puerta exceptions in JSX or selector files.
- **Spreadsheet-first layout:** Do not collapse the locked level-focused interaction into a dense all-level table.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Skill legality | JSX `if` trees in components | Pure rules-engine evaluator | Costs, caps, class context, and server exceptions will otherwise drift immediately. |
| Cross-route sync | Separate skills and stats computations | Shared selectors over one evaluated snapshot | Prevents `Habilidades` and `Estadísticas` from disagreeing. |
| Repair-state propagation | Manual booleans per screen | Revalidation helper modeled after Phase 4 | Existing project contract already solves preserved downstream edits. |
| Validation vocabulary | Custom strings like `warning` or `invalid-later` | Existing `legal` / `illegal` / `blocked` outcomes | Later phases already depend on this contract. |

**Key insight:** The expensive part of this phase is not rendering controls. It is keeping one canonical per-level skill truth that survives upstream edits without silently becoming wrong.

## Common Pitfalls

### Pitfall 1: Spending Skill Points With The Wrong Level Context
**What goes wrong:** The planner uses total build state but forgets that skill points are spent as the class taken on that exact level.
**Why it happens:** Implementations flatten skills into character-wide totals too early.
**How to avoid:** Evaluate each level with its selected class, INT before that level-up, and accumulated prior ranks.
**Warning signs:** A multiclass build gets the right total cap but the wrong spendable points or class/cross-class cost.

### Pitfall 2: Using Current Totals As Editable State
**What goes wrong:** Derived totals, remaining points, and legality are stored alongside raw edits, then fall out of sync after upstream changes.
**Why it happens:** It feels convenient to cache computed UI values.
**How to avoid:** Store raw allocations only; recompute from selectors.
**Warning signs:** `Habilidades` and `Estadísticas` disagree after changing an earlier level.

### Pitfall 3: Treating Unsupported Puerta Rules As Base NWN Rules
**What goes wrong:** Public NWN rules fill gaps where Puerta-specific exceptions are missing.
**Why it happens:** Server-specific skill exceptions are hard to verify via search.
**How to avoid:** Resolve every server exception through the compiled dataset/manual overrides; missing evidence must stay blocked.
**Warning signs:** A server-only restriction appears as legal because no explicit override was loaded.

### Pitfall 4: Destroying Later User Work On Upstream Changes
**What goes wrong:** Earlier edits wipe later skill levels instead of preserving them for repair.
**Why it happens:** Recomputing from scratch is easier than revalidation.
**How to avoid:** Copy the Phase 4 preserved-downstream pattern and mark affected levels blocked or illegal.
**Warning signs:** Changing level 2 class erases levels 3-16 skill choices.

## Code Examples

Verified patterns from project code and official docs:

### Feature Store Boundary
```typescript
export interface SkillStoreState {
  activeLevel: number;
  lastEditedLevel: number | null;
  levels: SkillAllocation[];
  resetSkills: () => void;
  setActiveLevel: (level: number) => void;
  setSkillRanks: (level: number, skillId: CanonicalId, ranks: number) => void;
}
```
Source: existing project store pattern in `apps/planner/src/features/level-progression/store.ts`

### External Store Consumption Contract
```typescript
import { useSyncExternalStore } from 'react';

const value = useSyncExternalStore(store.subscribe, store.getSnapshot);
```
Source: https://react.dev/reference/react/useSyncExternalStore

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Route-local UI state with ad hoc derived math | Dedicated external feature stores with selector projections | Already established by Phases 3-4 | Phase 5 should extend the existing pattern, not invent a second one. |
| Silent fallback when rules are uncertain | Fail-closed `blocked` outcomes | Phase 1 contract | Missing Puerta skill evidence must block, not warn. |
| Placeholder route panels | Route-specific feature boards | Phase 4 on `Construccion`; Phase 5 should do the same for `Habilidades` | `skills.tsx` and `stats.tsx` should stop using `PlannerSectionView`. |

**Deprecated/outdated:**
- Placeholder `PlannerSectionView` screens for `skills` and `stats`: replace them with real feature consumers in this phase.

## Open Questions

1. **Which exact Puerta skill exceptions are already encoded in compiled data?**
   - What we know: Phase 1 established manual overrides as runtime truth for server-only rules.
   - What's unclear: The current repo snapshot inspected here does not yet expose a skill-specific dataset contract.
   - Recommendation: Wave 0 of planning should inventory available skill fields and exception records before UI work.

2. **How much of `Estadísticas` should be visible in Phase 5?**
   - What we know: D-07 and D-08 limit it to skill-supporting technical readouts.
   - What's unclear: The exact field list is still discretionary.
   - Recommendation: Plan for a minimal set only: total ranks, remaining points, class or cross-class labels, caps, penalties, and blocked reasons.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build and tests | Yes, wrong target | 22.20.0 | Works for current repo tests, but project target remains 24.x LTS |
| npm | Registry verification and script execution | Yes | 11.6.1 | -- |
| pnpm | Workspace package manager | Indirectly | 10.0.0 via `corepack pnpm` | Use `corepack pnpm`, since global `pnpm` is missing |
| corepack | `pnpm` activation | Yes | 0.34.0 | -- |
| Vitest | Automated verification | Yes | 4.0.16 installed locally | `npm test` |
| Playwright | Optional browser verification | Yes via `npm exec` | 1.58.2 | Use Vitest jsdom if no browser flow is needed |

**Missing dependencies with no fallback:**
- None identified for planning Phase 5.

**Missing dependencies with fallback:**
- Global `pnpm` binary is missing; use `corepack pnpm`.
- Node 24.x target is not installed; current repo tests pass on Node 22.20.0, but planner should avoid baking in Node-24-only features.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.16 + Testing Library + jsdom |
| Config file | `vitest.config.ts` |
| Quick run command | `npm exec vitest run tests/phase-05 --reporter=dot` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SKIL-01 | User assigns skill ranks per level with active rail/sheet workflow | component + selector | `npm exec vitest run tests/phase-05/skill-allocation-flow.spec.tsx --reporter=dot` | No |
| SKIL-02 | Planner enforces points, caps, and class/cross-class cost math | unit | `npm exec vitest run tests/phase-05/skill-rules.spec.ts --reporter=dot` | No |
| SKIL-03 | Planner blocks server-specific exceptions and preserves downstream repair state | unit + component | `npm exec vitest run tests/phase-05/skill-revalidation.spec.tsx --reporter=dot` | No |

### Sampling Rate
- **Per task commit:** relevant `tests/phase-05` command
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/phase-05/skill-rules.spec.ts` - skill caps, costs, and blocked outcomes
- [ ] `tests/phase-05/skill-allocation-flow.spec.tsx` - `Habilidades` rail and active sheet interaction
- [ ] `tests/phase-05/skill-stats-sync.spec.tsx` - shared projection between `Habilidades`, `Estadísticas`, and summary
- [ ] `tests/phase-05/skill-revalidation.spec.tsx` - preserved downstream repair after upstream progression or INT changes

## Sources

### Primary (HIGH confidence)
- Project code inspection: `apps/planner/src/features/level-progression/store.ts`, `apps/planner/src/features/level-progression/selectors.ts`, `packages/rules-engine/src/progression/progression-revalidation.ts`, `vitest.config.ts`
- Official NWN manual PDF - skill ranks, class skills, cross-class skills, and per-level spending: https://ftpmirror.your.org/pub/misc/ftp.atari.com/manuals/pc/neverwinter_nights_platinum/nwn_onlinemanual.pdf
- React docs - external store subscription contract: https://react.dev/reference/react/useSyncExternalStore
- npm registry package metadata - version and publish-date verification:
  - https://www.npmjs.com/package/react
  - https://www.npmjs.com/package/zustand
  - https://www.npmjs.com/package/zod
  - https://www.npmjs.com/package/vitest
  - https://www.npmjs.com/package/@testing-library/react
  - https://www.npmjs.com/package/jsdom
  - https://www.npmjs.com/package/typescript
  - https://www.npmjs.com/package/vite

### Secondary (MEDIUM confidence)
- Zustand docs reference page - confirms current official selector/equality API surface: https://zustand.docs.pmnd.rs/reference/apis/create-with-equality-fn

### Tertiary (LOW confidence)
- Public web search for Puerta-specific skill exceptions was inconclusive and too noisy to trust; no public source was strong enough to treat as authoritative.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - version verification came directly from the npm registry and matches repo usage.
- Architecture: HIGH - strongly supported by existing project code patterns in Phases 3-4.
- Pitfalls: MEDIUM - baseline NWN rules are verified, but exact Puerta exception coverage still depends on dataset inspection during planning.

**Research date:** 2026-03-31
**Valid until:** 2026-04-30
