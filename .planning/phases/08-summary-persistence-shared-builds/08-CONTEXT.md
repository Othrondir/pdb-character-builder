---
phase: 08-summary-persistence-shared-builds
created: 2026-04-17
status: discussed
requirements: [SHAR-01, SHAR-02, SHAR-03, SHAR-04, SHAR-05, LANG-03]
---

# Phase 8 Context — Summary, Persistence & Shared Builds

## Goal

Users can preserve, reload, and share an exact build snapshot pinned to its dataset version. Phase 8 delivers the final Resumen view, local save/load, JSON import/export, and URL sharing — all greenfield; no persistence layer exists yet.

## Canonical Refs

- `CLAUDE.md` — Recommended Stack (Dexie 4.2.1, Zod 4.3.5, fflate 0.8.2, TanStack Router + zod-adapter)
- `.planning/REQUIREMENTS.md` — SHAR-01..05, LANG-03 rows
- `.planning/ROADMAP.md` §Phase 8 — goal + success criteria
- `excel simulador de fichas/Plantilla Base.xlsx` — flat ficha reference for the Resumen layout
- `apps/planner/src/state/planner-shell.ts` — existing zustand store pattern to replicate
- `apps/planner/src/lib/copy/es.ts` — Spanish copy registry to extend with Phase 8 keys

## Locked Decisions

### D-01 — Local save strategy: slots nombrados
Dexie table keyed by user-entered build name. User explicitly clicks **Guardar** and types a name. Collision → overwrite confirm dialog. No autosave.

**Why:** Players hand builds to each other by name; explicit save matches the mental model of "mi paladín tier-1". Autosave mutates state the user didn't intend to persist.

**Downstream implication:** Dexie schema has a single `builds` table with `{ name (PK), payload, createdAt, updatedAt, plannerVersion, rulesetVersion, buildEncodingVersion }`. UI surfaces a **Cargar** list modal showing all slots by name. Overwrite confirm reuses `ConfirmDialog`.

### D-02 — Resumen format: tabla flat estilo Plantilla Base.xlsx
Resumen screen renders a single scrollable table mirroring the Plantilla Base.xlsx layout — atributos, BAB, saves, HP, dotes, habilidades — in one flat grid, server-handoff ready. No collapsible panels.

**Why:** Puerta de Baldur GMs and players validate builds via the Plantilla Base format directly; matching it eliminates translation friction at handoff.

**Downstream implication:** Resumen component is a single-column layout that projects shared rules-engine selectors into a read-only grid. No tabs, no toggles. Researcher should inspect the xlsx structure to lock exact row/column ordering.

### D-03 — Resumen lives as dedicated stepper screen
Clicking **Resumen** in the stepper navigates to a dedicated view (same routing pattern as Raza/Alineamiento/Atributos). Not a modal overlay.

**Why:** Stepper pattern is already established for every other step (origin + levels + Utilidades). Consistency beats a novel overlay.

**Downstream implication:** Resumen gets its own `center-content` branch. Add `stepper.sheetTabs.resumen` and related copy keys. The `Resumen` button in `.planning/phases/07.2-magic-ui-descope/07.2-01-SUMMARY.md`'s `CreationStepper` is already wired — Phase 8 fills the destination route.

### D-04 — JSON import/export: always-download + always-upload
Export: button emits `pdb-build-{name}-{iso-date}.json` download. Import: file picker reads a single `.json`, Zod-validates at boundary, loads into store. No drag-and-drop in v1.

**Why:** File picker + explicit download is universally understood on desktop and mobile. Drag-and-drop is a polish nice-to-have, not core.

**Downstream implication:** Researcher investigates Zod schema shape for the exported document: `{ schemaVersion, plannerVersion, rulesetVersion, buildEncodingVersion, build: { raceId, subraceId, alignmentId, attributes, levels: [...], skills: {...}, feats: [...] } }`. All IDs are stable integers from the compiled catalogs (CLAUDE.md rule).

### D-05 — URL sharing: hash-based `#/share?b={payload}`
Share URL format: `https://{host}/#/share?b={fflate+base64url(payload)}`. Hash-routing means GitHub Pages serves it without any rewrite config.

**Why:** Static hosting constraint. Query-based routing on GitHub Pages requires a `404.html` fallback which adds complexity for v1.

**Downstream implication:** TanStack Router configured with hash history for the `/share` route only (or fully hash-based if simpler — researcher decides). Planner uses `@tanstack/zod-adapter` to validate the `b` param on decode. Existing `CreationStepper` routes stay on their current strategy; the share URL is a distinct entry point.

### D-06 — URL overflow: fallback to JSON download
If compressed payload exceeds the URL size budget, the **Compartir** button silently falls back to emitting a JSON download with a toast: *"Build demasiado grande para URL — descarga el JSON para compartir"*.

**Why:** Hard size limit on URLs in common tooling (chat clients, QR codes, email). Silent truncation would corrupt builds; blocking errors would block handoff. JSON fallback always works.

**Downstream implication:** Planner researches real-world URL budgets (Twitter ~280, Discord ~2k, browser bar ~8k) and picks a conservative threshold (suggest 2048 chars encoded). Expose the threshold as a config constant so it can be tuned. Share flow: encode → measure → branch.

### D-07 — Version mismatch: fail closed with diff visible
Importing a JSON or decoding a share URL where `rulesetVersion` ≠ current app ruleset blocks the load and opens a modal: *"Esta build usa ruleset v1.2. Tu planner es v1.3. No se puede cargar con exactitud."* User can cancel or download the original JSON. No auto-migration.

**Why:** Puerta de Baldur server rules evolve; silent migration risks producing an illegal build that passed old rules. Strict validation is a project non-negotiable (CLAUDE.md: "illegal server builds blocked, not warned").

**Downstream implication:** Decode pipeline: parse → compare `rulesetVersion` → if mismatch, emit structured diff (which catalog tables differ, which IDs would be affected). Modal is a `ConfirmDialog` variant. Researcher investigates ruleset versioning: where does the current version live (compiled catalog metadata? a separate `rulesetVersion.ts`?).

### D-08 — LANG-03 surface: footer del shell + encabezado del Resumen
Small text in the shell footer: *"Ruleset v1.x · Dataset YYYY-MM-DD"*. Repeated in the Resumen screen header and the exported JSON header. Not modal, not Utilidades — always visible.

**Why:** Players must know at a glance which ruleset a build targets. Hiding it behind a Utilidades modal means users share builds without realising the version mismatch.

**Downstream implication:** Add `shellCopyEs.footer.rulesetVersion` / `datasetVersion` copy keys. Footer component reads from a single source-of-truth export (suggest `apps/planner/src/data/ruleset-version.ts` with `{ ruleset: '1.0.0', dataset: '2026-04-17' }` constants updated when compiled catalogs are regenerated).

### D-09 — Build identity: solo nombre
No free-text notes, no tags. Just a single `name` field per saved slot.

**Why:** Minimal. Tags + notes add UI surface that isn't required to solve the core handoff problem. Can be added as a backlog item if future demand surfaces.

**Downstream implication:** Dexie schema is `{ name (PK), payload, createdAt, updatedAt, versions }`. No joins, no free-text search. Load list sorts by `updatedAt desc`.

## Claude's Discretion

- Exact Dexie schema field names (within the shape above)
- Toast/snackbar library vs custom — reuse existing patterns where possible
- Whether to reuse `ConfirmDialog` for the overwrite + version-mismatch modals, or introduce a new primitive
- Button placement within the Resumen screen (download, compartir, cargar, guardar) — wire them where they match the Plantilla layout
- Error message copy exact wording — match existing `shellCopyEs` tone
- fflate compression level tuning within the URL budget
- Whether share URL uses `deflate-raw` or `deflate` — whichever gives the smaller payload for this build shape

## Deferred Ideas (not in Phase 8 scope)

- **SHAR-06** (print/export ficha for offline sharing) — nice-to-have; already in REQUIREMENTS.md as future.
- Free-text notes or tags on saved slots — revisit if users ask for organization.
- Drag-and-drop JSON import — polish.
- Shareable URL shortener — needs a backend; out of static-app scope.
- Build history / diff / undo across sessions — feature creep; handled within-session by zustand + autosave-to-draft (not required now).

## Success Criteria (from ROADMAP)

1. User reviews a clear final summary of the complete build before handing it off — **D-02, D-03**.
2. User saves and reloads local builds without a backend — **D-01, D-09**.
3. User imports/exports JSON and shares URL payloads that reproduce the same decisions on another machine — **D-04, D-05, D-06**.
4. Shared/imported builds expose their dataset/rules version and handle mismatches without silent revalidation drift — **D-07, D-08**.
