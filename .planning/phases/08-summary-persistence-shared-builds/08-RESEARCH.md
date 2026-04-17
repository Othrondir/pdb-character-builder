# Phase 8: Summary, Persistence & Shared Builds — Research

**Researched:** 2026-04-17
**Domain:** Browser local persistence (IndexedDB/Dexie) + portable build document (Zod/JSON) + URL sharing (fflate + base64url over hash history) + read-only summary view projecting existing rules-engine selectors
**Confidence:** HIGH

## Summary

Phase 8 is plumbing, not rules work. Every numeric value on the Resumen screen (BAB, saves, HP, skill totals, feat list, attributes) already exists behind selectors in `rules-engine` / feature stores — the phase composes them into a read-only flat table modelled after `excel simulador de fichas/Plantilla Base.xlsx` Sheet 1 "Resumen Ficha", then adds three data exits (local slot save → Dexie, file export/import → Zod-validated JSON document, URL share → fflate+base64url hash-history payload). Version pinning is non-negotiable: every stored/shared artifact carries `datasetId` + `schemaVersion` + `plannerVersion`, and the decode pipeline refuses to hydrate mismatched rulesets (D-07 fail-closed).

Two stack specifics are more settled than CLAUDE.md suggests. First, **Zod v4 works natively with TanStack Router** via `.default(x).catch(x)` — `@tanstack/zod-adapter` is no longer required as of Aug 2025 [CITED: github.com/TanStack/router/issues/4322]. Second, `fflate.deflateSync` produces raw deflate output (no zlib header), which is the smallest envelope per-byte for share-URL payloads [CITED: github.com/101arrowz/fflate/discussions/28]. These two decisions unlock a cleaner dependency graph for the phase.

The biggest latent risk is **dataset-ID inconsistency already in the repo**: `foundation-fixture.ts` hard-codes `FOUNDATION_DATASET_ID = 'puerta-ee-2026-03-30+phase03'` while the extractor-compiled catalogs use `'puerta-ee-2026-04-17+cf6e8aad'`. Phase 8 introduces a single `ruleset-version.ts` source-of-truth and migrates both stores + summary/footer to read from it. Otherwise D-07 version-mismatch detection will misfire every session.

**Primary recommendation:** Build three horizontal layers in 08-01 (summary → save/load → JSON export/import) over a single new `@planner/features/persistence` package with Dexie/schema/selectors inside it, then 08-02 adds URL-share + mismatch diff as thin additions on top. Use hash-only router history so `#/share?b=...` works without GitHub Pages 404 rewrites.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Local build persistence (save/load slots) | Browser / Client (IndexedDB via Dexie) | — | Static site, no backend — IndexedDB is the browser-native durable store. |
| Build snapshot serialization (JSON export) | Browser / Client (pure TS in persistence package) | — | Zod schema validates at the boundary, function returns string, `<a download>` emits file. |
| Build snapshot deserialization (JSON import) | Browser / Client (Zod parse → zustand hydrate) | — | File picker → FileReader → Zod → stores. |
| Share URL encode/decode | Browser / Client (fflate + base64url) | — | Pure function; no crypto, no auth. |
| Routing entry point for share URLs | Browser / Client (TanStack Router hash history) | — | Hash-only URLs survive GitHub Pages without server config. |
| Resumen table projection | Browser / Client (react component over existing selectors) | Rules engine (pure computation) | All BAB/saves/HP/skills math already lives in `packages/rules-engine`. Phase 8 composes, does not compute. |
| `datasetId` / `plannerVersion` / `schemaVersion` authorship | Build-time constant (ts module) | — | Updated when extractor regenerates catalogs; consumed by footer, Resumen header, export, Dexie rows. |
| Version mismatch policy | Browser / Client (decode pipeline branch) | — | Compare against `ruleset-version.ts` constant, diff against incoming payload, open ConfirmDialog variant. |
| Toast notifications (overflow fallback) | Browser / Client (new lightweight primitive or extend ConfirmDialog) | — | No existing toast system in repo — choose minimal custom or extend NwnFrame transient. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `zod` | `^4.3.5` (installed) | Boundary validation for build document, URL decode, import | Already in devDependencies at root; canonical boundary validator per CLAUDE.md. [VERIFIED: node_modules/zod/package.json] |
| `dexie` | `^4.4.2` (latest) | IndexedDB wrapper for slot persistence | CLAUDE.md specifies 4.2.1 but current is 4.4.2 — minor patch bump; same API. [VERIFIED: npm view dexie version 2026-04-17] |
| `fflate` | `^0.8.2` (latest) | Raw deflate compression for share URLs | `fflate.deflateSync` = pako's `deflateRaw` = smallest payload. [VERIFIED: npm view fflate version 2026-04-17] [CITED: github.com/101arrowz/fflate/discussions/28] |
| `@tanstack/react-router` | `^1.168.22` (latest) — already installed at `1.147.0` equivalent | Hash history + hash-route for `/share` | Already wired via `router.tsx`; extend with hash history. [VERIFIED: npm view @tanstack/react-router version] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@tanstack/zod-adapter` | NOT NEEDED | Would validate search params | **Skip:** Zod 4 works natively via `.default(x).catch(x)`. Adapter only needed for Zod 3. [CITED: github.com/TanStack/router/issues/4322] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `dexie` | Raw `indexedDB` API | Dexie saves ~200 lines of boilerplate for versioned stores + typed tables; worth the 22 kB gzipped cost. |
| `fflate` + base64url | LZ-string | LZ-string is smaller library but slightly larger output for small JSON payloads; fflate is already in CLAUDE.md stack and compresses better for >500-byte payloads. |
| `@tanstack/zod-adapter` | Native Zod `.default().catch()` | Adapter was the Zod-3-era approach; Zod 4.3.5 eliminates the need. Fewer deps = safer. |
| Query-based share URL | Hash-based `#/share?b=...` | D-05 locked hash-based. GitHub Pages can't rewrite query routes without a `404.html` trampoline. |
| Full hash routing (all routes) | Hash only on `/share`, memory/browser elsewhere | Planner already uses default browser history at root `/`. Introducing hash for *every* route would churn existing UI tests; hash-only-for-share is cleaner. **Recommendation: full hash history** — trivially compatible with GitHub Pages, no route rewrites, matches D-05 intent. |

**Installation:**
```bash
pnpm --filter @nwn1-character-builder/planner add dexie fflate
pnpm --filter @nwn1-character-builder/planner add -D zod
# Note: @tanstack/zod-adapter intentionally omitted — Zod 4 works natively.
# Note: zod already in root devDependencies; re-declare at planner scope if tsconfig path resolution needs it.
```

**Version verification (against npm registry 2026-04-17):**
- `fflate` 0.8.2 — latest [VERIFIED]
- `dexie` 4.4.2 — latest (CLAUDE.md's 4.2.1 still works; minor bump recommended) [VERIFIED]
- `zod` 4.3.5 — installed locally; latest is 4.3.x line [VERIFIED: node_modules]
- `@tanstack/react-router` 1.168.22 — latest (installed resolves to `latest`); CLAUDE.md pinned 1.147.0 [VERIFIED: npm view]

## Architecture Patterns

### System Architecture Diagram

```
                            +-------------------------+
                            |   Zustand stores        |
                            |   (foundation / level   |
                            |   / skills / feats)     |
                            +-----------+-------------+
                                        |
                        [projectBuildDoc selector]
                                        |
                                        v
                            +-------------------------+
                            |   BuildDocument (TS)    |  schemaVersion / plannerVersion
                            |   canonical runtime DTO |  datasetId / raceId / levels[]
                            +----+----------+---------+
                                 |          |          \
                                 |          |           \
                +----------------+          |            +--------------------+
                |                           |                                 |
                v                           v                                 v
        +----------------+         +----------------+                +-----------------+
        |  Dexie table   |         |  JSON.stringify|                |  fflate         |
        |  `builds`      |         |  + Blob +      |                |  deflateSync    |
        |  {name PK, ...}|         |  anchor download|               |  + base64url    |
        +--------+-------+         +--------+-------+                +--------+--------+
                 |                          |                                 |
                 | (Cargar list)            | (.json download)                |
                 |                          |                                 v
                 |                          |                       +------------------+
                 |                          |                       |  if length > 2kB |
                 |                          |                       |   -> fallback to |
                 |                          |                       |   JSON download  |
                 |                          |                       +--------+---------+
                 v                          v                                |
        +-----------------------------------------------+                    v
        | decodeBuildDocument(input)                   |          +------------------+
        | 1. parse + Zod validate                      |<---------+ Hash URL         |
        | 2. compare datasetId + rulesetVersion        |          | #/share?b=<b64>  |
        | 3. if mismatch -> VersionMismatchDiff modal  |          +------------------+
        | 4. hydrate stores (foundation, level, skill, |
        |    feat) in a single transaction             |
        +---------------------+-------------------------+
                              |
                              v
                    +--------------------+
                    | Planner re-renders |
                    | Resumen projects   |
                    | from stores        |
                    +--------------------+
```

Data flow entry points: (a) **Save** click → `projectBuildDoc()` → Dexie `builds.put({name})`; (b) **Exportar** click → same doc → JSON file download; (c) **Compartir** click → same doc → fflate → base64url → location.hash (or JSON fallback if over budget); (d) **Cargar** click → Dexie read → Zod validate → hydrate; (e) **Importar** click → file picker → Zod validate → hydrate; (f) **Share URL arrival** → router matches `/share`, decodes `b`, runs decode pipeline.

### Recommended Project Structure

Create ONE new feature package, one new ui primitive, and one shared constants module. Route hash history via existing `router.tsx`.

```
apps/planner/src/
├── data/
│   └── ruleset-version.ts              # NEW — single source of truth for plannerVersion + datasetId + schemaVersion
├── features/
│   ├── persistence/                    # NEW — all of Phase 8 plumbing
│   │   ├── build-document-schema.ts    # Zod schema for the exported document + TS types
│   │   ├── project-build-document.ts   # selector: zustand stores -> BuildDocument
│   │   ├── hydrate-build-document.ts   # inverse: BuildDocument -> store setters (single atomic-ish pass)
│   │   ├── dexie-db.ts                 # Dexie class: { builds: 'name' } with one table, version(1).stores(...)
│   │   ├── slot-api.ts                 # save/load/list/delete slots (thin wrapper over dexie-db)
│   │   ├── json-export.ts              # toJsonDownload(doc): triggers anchor + revokeObjectURL
│   │   ├── json-import.ts              # fromFileInput(file): Promise<BuildDocument>  + Zod validate
│   │   ├── share-url.ts                # encodeShareUrl / decodeShareUrl (fflate + base64url)
│   │   ├── url-budget.ts               # MAX_ENCODED_URL_LENGTH = 2000; exceedsBudget(s) helper
│   │   ├── version-mismatch.ts         # diffRuleset(local, incoming): structured diff for modal
│   │   └── persistence-fixture.ts      # Vitest helpers (in-memory dexie via fake-indexeddb, fixtures)
│   └── summary/                        # NEW — Resumen screen
│       ├── resumen-board.tsx           # top-level screen: table + buttons (Guardar/Cargar/Exportar/Importar/Compartir)
│       ├── resumen-table.tsx           # flat table component (mirrors Plantilla Base sheet1 layout)
│       ├── resumen-selectors.ts        # view-model selectors over foundation/level/skill/feat stores
│       └── save-slot-dialog.tsx        # Guardar (name prompt) + Cargar (slot list) dialogs
├── components/
│   ├── shell/
│   │   ├── center-content.tsx          # EDIT — add `resumen` branch
│   │   ├── creation-stepper.tsx        # EDIT — wire Resumen button onClick -> setActiveView('resumen')
│   │   └── planner-footer.tsx          # NEW — footer with "Ruleset v1.x · Dataset YYYY-MM-DD"
│   └── ui/
│       ├── version-mismatch-dialog.tsx # NEW — ConfirmDialog variant with structured-diff content area
│       └── toast.tsx                   # NEW (or extend frame) — transient message for overflow fallback
├── lib/
│   └── sections.ts                     # EDIT — add 'resumen' to SheetTab? or add a new PlannerView union
├── state/
│   └── planner-shell.ts                # EDIT — add activeView: 'creation' | 'resumen' | 'utilities' etc.
└── router.tsx                          # EDIT — createHashHistory(); add /share route with zod validated `b` param
```

### Pattern 1: Single source-of-truth for dataset version
**What:** A tiny TS module exporting the build-time constants used by the footer, Resumen header, export header, and mismatch check.
**When to use:** Every UI surface that advertises dataset identity. Every persistence artifact.
**Example:**
```typescript
// apps/planner/src/data/ruleset-version.ts
// UPDATED when extractor regenerates catalogs. Imports from compiled-classes.ts to
// stay in sync with the authoritative datasetId baked into the data.
import { compiledClassCatalog } from './compiled-classes';

export const PLANNER_VERSION = '1.0.0' as const;
export const BUILD_ENCODING_VERSION = 1 as const;   // Bumped when wire format changes
export const RULESET_VERSION = '1.0.0' as const;    // Human-readable; bump on rule change
export const CURRENT_DATASET_ID = compiledClassCatalog.datasetId;

export function formatDatasetLabel(): string {
  // e.g. "Ruleset v1.0.0 · Dataset 2026-04-17 (cf6e8aad)"
  const match = /^puerta-ee-(\d{4}-\d{2}-\d{2})\+([a-z0-9]+)$/.exec(CURRENT_DATASET_ID);
  if (!match) return `Ruleset v${RULESET_VERSION} · Dataset ${CURRENT_DATASET_ID}`;
  return `Ruleset v${RULESET_VERSION} · Dataset ${match[1]} (${match[2]})`;
}
```

### Pattern 2: BuildDocument as the single wire format
**What:** One Zod schema defines the format used by Dexie rows' `payload`, JSON export files, AND the URL share payload. No divergence.
**When to use:** Any exit/entry point for build state.
**Example:** See "Build Doc Wire Format" section below.

### Pattern 3: Store hydration as one atomic-ish operation
**What:** `hydrateBuildDocument(doc)` resets and repopulates ALL four stores (foundation, level, skill, feat) in sequence. Never partial hydration.
**When to use:** On import/load/URL-decode success.
**Rationale:** Partial hydration is the #1 bug vector for import flows. Either the whole doc loads or nothing changes. Revalidation cascades (existing `revalidateProgressionAfterLevelChange`, `revalidateSkillSnapshotAfterChange`) are triggered implicitly by the stores' own `set` calls.
**Example:**
```typescript
export function hydrateBuildDocument(doc: BuildDocument): void {
  // Order matters: foundation first (race sets alignment constraints), then levels, then skills, then feats.
  const foundation = useCharacterFoundationStore.getState();
  foundation.resetFoundation();
  foundation.setRace(doc.build.raceId);
  if (doc.build.subraceId) foundation.setSubrace(doc.build.subraceId);
  foundation.setAlignment(doc.build.alignmentId);
  for (const [key, value] of Object.entries(doc.build.baseAttributes)) {
    foundation.setBaseAttribute(key as AttributeKey, value);
  }

  const progression = useLevelProgressionStore.getState();
  progression.resetProgression();
  for (const lv of doc.build.levels) {
    progression.setLevelClassId(lv.level, lv.classId);
    if (lv.abilityIncrease) progression.setLevelAbilityIncrease(lv.level, lv.abilityIncrease);
  }

  const skills = useSkillStore.getState();
  skills.resetSkillAllocations();
  for (const lvSkill of doc.build.skillAllocations) {
    for (const alloc of lvSkill.allocations) {
      skills.setLevelSkillRank(lvSkill.level, alloc.skillId, alloc.rank);
    }
  }

  const feats = useFeatStore.getState();
  feats.resetFeatSelections();
  for (const lvFeat of doc.build.featSelections) {
    if (lvFeat.classFeatId) feats.setClassFeat(lvFeat.level, lvFeat.classFeatId);
    if (lvFeat.generalFeatId) feats.setGeneralFeat(lvFeat.level, lvFeat.generalFeatId);
  }
}
```

### Pattern 4: Hash-history for GitHub Pages
**What:** Single router with `createHashHistory()` so every URL is `#/...` — GitHub Pages serves `index.html` for any path without rewrites.
**When to use:** Entire router, not just `/share`. Simpler and proven.
**Example:**
```typescript
// apps/planner/src/router.tsx
import { createHashHistory, createRouter, createRootRoute, createRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { PlannerShellFrame } from '@planner/components/shell/planner-shell-frame';
import { ShareEntry } from '@planner/features/persistence/share-entry';

const rootRoute = createRootRoute({ component: PlannerShellFrame });

const creationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => null, // Shell renders center-content via store state
});

const shareSearchSchema = z.object({
  b: z.string().min(1).max(8192).default('').catch(''),   // Zod 4: no adapter needed
});

const shareRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/share',
  validateSearch: shareSearchSchema,
  component: ShareEntry, // component calls decodeShareUrl and mounts VersionMismatchDialog or hydrates
});

const routeTree = rootRoute.addChildren([creationRoute, shareRoute]);

export const router = createRouter({
  routeTree,
  history: createHashHistory(),
});
```

### Anti-Patterns to Avoid

- **Storing display names in the build doc:** Canonical IDs only. If you ever see `raceName: 'Enano'` in the wire format, delete it — use `raceId: 'race:dwarf'` and look up label via catalog at render time. [CITED: Phase 1 canonical-ID decision in STATE.md]
- **Saving on every store change (autosave):** D-01 locked explicit-save. Autosave creates phantom slots and destroys user control.
- **Compressing JSON *object* instead of JSON *string*:** fflate works on bytes. Always `strToU8(JSON.stringify(doc))` first.
- **Running Dexie operations synchronously at module import:** IndexedDB is async; Dexie transactions are promises. Wrap in React effects or handler callbacks.
- **Treating `datasetId` + `rulesetVersion` as interchangeable:** They track different things. `datasetId` pins the *data* (catalogs, labels). `rulesetVersion` pins the *rules engine* (computation logic). Both must match on load; surface both in the mismatch dialog.
- **Using query-string URL for share link:** D-05 locked hash. GitHub Pages strips/404s query-only URLs for unknown paths unless a 404.html trampoline is added.
- **Blocking the UI thread while decoding:** For 2 kB payloads fflate is microseconds — but still wrap in a try/catch; malformed base64url throws, don't crash the shell.
- **Ignoring IndexedDB private-browsing failure:** Safari private mode throws on `indexedDB.open()`. Detect and degrade gracefully to "save unavailable in this browser mode."

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| IndexedDB CRUD | Custom `indexedDB.transaction()` wrapper | `dexie` | Version upgrades, cursors, typing, ~200 lines of correctness gotchas. |
| DEFLATE compression | Hand-roll with `CompressionStream` polyfill | `fflate` | `CompressionStream` not universally supported yet for gzip in older browsers; fflate is 8 kB of tested pure JS. |
| Base64url encoding | Manual char-replace loops | Simple helper: `btoa(str).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')` | This one IS small enough to hand-roll (~6 lines); just use the canonical form from RFC 4648. [CITED: base64url RFC 4648] |
| Zod validation at boundaries | Manual type checks | `zod@4.3.5` | Already in stack; catches bad JSON imports + malformed share URLs at a single call. |
| File download from browser | Manual `<iframe>` trick | `<a href={URL.createObjectURL(blob)} download>` + `revokeObjectURL` after click | Modern, zero-dep, universally supported. |
| File picker | Build a drag-drop zone | `<input type="file" accept="application/json">` | D-04 locked file-picker-only. |
| Toast/snackbar | Import a toast library | Minimal React state + fixed-position div | Only ONE toast message exists in Phase 8 (URL overflow). A library is over-engineering. |
| Hash history | Manual `window.location.hash` listening | `createHashHistory()` from `@tanstack/react-router` | Already a dependency; already handles popstate + deep links. |

**Key insight:** Phase 8 is "glue code between pure data and browser APIs" — every tempting hand-roll has a 10-line library call equivalent. The hand-roll list above is the base64url helper (6 lines) and the toast (one component with setTimeout). Everything else is library work.

## Runtime State Inventory

> N/A — Phase 8 is **greenfield**. No existing persistence layer, no stored data, no registered services, no secrets, no migration surface. This is additive work only.

**Confirmation by category:**
- Stored data: **None** — no Dexie/IndexedDB usage in repo today [VERIFIED: grep "indexedDB\|Dexie" returns 0 matches in apps/planner/src].
- Live service config: **None** — static web app, no services.
- OS-registered state: **None** — no OS integration.
- Secrets/env vars: **None** — no env.* usage; no `.env` files in repo.
- Build artifacts: **None that affect Phase 8** — `apps/planner/dist` is build output and is not touched by new code paths.

## Common Pitfalls

### Pitfall 1: Dual dataset IDs already in the codebase
**What goes wrong:** `foundation-fixture.ts` hardcodes `FOUNDATION_DATASET_ID = 'puerta-ee-2026-03-30+phase03'` (legacy, Phase 03 era), while the extractor-compiled catalogs (compiled-classes.ts, compiled-feats.ts, etc.) all stamp `datasetId = 'puerta-ee-2026-04-17+cf6e8aad'` (current). If Phase 8 reads `datasetId` from the foundation store for save slots and mismatch checks, every save will immediately appear "mismatched" with the actual catalog data.
**Why it happens:** Phase 03 predates the extractor. No one updated the fixture when Phase 05.1 compiled catalogs landed.
**How to avoid:** 08-01 Task 1 consolidates: delete the hardcoded constant, have all stores import `CURRENT_DATASET_ID` from the new `ruleset-version.ts`. Run the full test suite — expect a handful of test fixtures to need refresh.
**Warning signs:** Grep for `FOUNDATION_DATASET_ID` or literals matching `puerta-ee-*` anywhere other than `ruleset-version.ts` or compiled-*.ts.

### Pitfall 2: Revalidation cascade during hydration
**What goes wrong:** `setLevelClassId` at level 5 triggers `revalidateProgressionAfterLevelChange` which looks at level 4 — but level 4 might not be set yet during import if we iterate 1→16 naively. Partial state causes spurious "illegal" flags.
**Why it happens:** Existing stores fire revalidation synchronously on each setter.
**How to avoid:** Either (a) set ALL levels' classIds first, then all abilityIncreases, then all skills, then all feats — monotonic waves; or (b) add a batch-hydrate path to each store that defers revalidation until the last set call. Option (a) is smaller change and works because iterating 1→16 is monotonic for class selections (level 5 only depends on 1-4 which are already written).
**Warning signs:** After import, random levels show "illegal" status despite the JSON being known-legal.

### Pitfall 3: Safari private-mode IndexedDB
**What goes wrong:** In Safari private browsing, `indexedDB.open()` throws or returns a zombie handle; Dexie surfaces as an uncaught promise rejection at app startup.
**Why it happens:** Apple disables durable storage in private mode; Dexie doesn't silently degrade.
**How to avoid:** Wrap Dexie construction in try/catch; expose an `isPersistenceAvailable()` flag; gray out Guardar/Cargar buttons + tooltip "Guardado local no disponible en modo privado" when false.
**Warning signs:** User reports empty slot list after saving; console shows `InvalidStateError` from Dexie.

### Pitfall 4: URL length measured wrong
**What goes wrong:** We measure `encodedPayload.length` but forget to add the hash prefix (`#/share?b=`) + the host + protocol. Real shared URLs are longer than the payload alone.
**Why it happens:** Developer measures just the compressed string.
**How to avoid:** `url-budget.ts` exports `MAX_ENCODED_PAYLOAD_LENGTH = 1900` (leaving ~100 chars for prefix + host). Use that for the branch decision. Don't measure the final URL — measure the payload and hardcode the known prefix overhead.
**Warning signs:** User reports broken URLs in Discord where payload JUST fits browser bar but tooling truncates the final URL.

### Pitfall 5: Dexie schema change in v2 erases v1 data
**What goes wrong:** Phase 8 ships `db.version(1).stores({ builds: 'name' })`. Later a tag field is added and someone bumps to `version(2).stores({ builds: 'name, tag' })` without an upgrade callback — existing slot rows silently migrate okay, but adding a new *required* field with no default erases rows that lack it after upgrade.
**Why it happens:** Dexie's implicit schema migration assumes additive changes; field removal or type change needs `.upgrade()`.
**How to avoid:** D-09 (solo nombre) keeps the schema trivially additive for now, but document the upgrade discipline in `dexie-db.ts` header comments. Every version bump that changes a required field must carry an `.upgrade(tx => ...)` callback.
**Warning signs:** User reports disappearing saved builds after app update.

### Pitfall 6: Zod 4 boundary leaks
**What goes wrong:** JSON import parses with Zod, but then passes the parsed object to UI code that spreads it into the zustand store. If the Zod schema is `z.object({...}).passthrough()` (accepting unknown fields), malicious/stale data leaks into stores.
**Why it happens:** `.passthrough()` vs default strict mode confusion.
**How to avoid:** Build doc schema is strict (default in Zod 4). Explicitly `z.object({...}).strict()` documentation in the schema file prevents drift.
**Warning signs:** Store contains unexpected fields after import that the UI doesn't know about.

### Pitfall 7: Share URL changes invalidate open tabs silently
**What goes wrong:** User has the planner open, clicks a share link → hash changes → router navigates to `/share` but the already-populated stores are NOT reset. The decode pipeline runs but also picks up existing session state.
**Why it happens:** Reset isn't automatic on route change.
**How to avoid:** `ShareEntry` component explicitly resets all stores before hydrating from the decoded payload. Or prompt: "Esta URL reemplazará tu construcción actual. ¿Continuar?"
**Warning signs:** Share URL loads a build but it mysteriously has extra levels or feats from the previous session.

### Pitfall 8: base64url vs base64 mismatch on decode
**What goes wrong:** Share URL encodes with base64url (`-_`, no padding); someone decodes with `atob()` directly, which expects standard base64 (`+/`, with padding). Silent failure or garbage decompress.
**Why it happens:** Two very similar encodings, easy to conflate.
**How to avoid:** Symmetric helpers: `toBase64Url(bytes)` and `fromBase64Url(str)` — the decode helper pads and replaces chars BEFORE calling `atob`.
**Warning signs:** `InvalidCharacterError` from `atob` at decode time; or decode produces bytes that fflate refuses with "invalid data".

## Code Examples

### Example 1: Encode share URL (fflate + base64url)
```typescript
// apps/planner/src/features/persistence/share-url.ts
// Source pattern: fflate README + RFC 4648 §5 (base64url).
import { deflateSync, strFromU8, strToU8 } from 'fflate';
import type { BuildDocument } from './build-document-schema';

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? 0 : 4 - (s.length % 4);
  const base64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function encodeSharePayload(doc: BuildDocument): string {
  const json = JSON.stringify(doc);           // canonical JSON (no whitespace)
  const compressed = deflateSync(strToU8(json), { level: 9 }); // raw deflate, no zlib header
  return toBase64Url(compressed);
}

export function decodeSharePayload(b: string): unknown {
  const compressed = fromBase64Url(b);
  const inflated = inflateSync(compressed);
  return JSON.parse(strFromU8(inflated));     // caller must Zod-validate the result
}
```

### Example 2: Dexie database class
```typescript
// apps/planner/src/features/persistence/dexie-db.ts
// Source: dexie.org/docs/Typescript
import Dexie, { type EntityTable } from 'dexie';
import type { BuildDocument } from './build-document-schema';

export interface BuildSlotRow {
  name: string;              // PRIMARY KEY — user-entered slot name
  payload: BuildDocument;    // full document including version fields
  createdAt: number;         // Date.now()
  updatedAt: number;
}

export class PlannerDatabase extends Dexie {
  builds!: EntityTable<BuildSlotRow, 'name'>;

  constructor() {
    super('pdb-character-builder');
    // Dexie stores string: "name" means "name" is PK, no secondary indexes needed.
    // IMPORTANT: Any schema change MUST bump version() AND include an .upgrade() callback.
    this.version(1).stores({
      builds: 'name',
    });
  }
}

let dbInstance: PlannerDatabase | null = null;
export function getPlannerDb(): PlannerDatabase {
  if (!dbInstance) dbInstance = new PlannerDatabase();
  return dbInstance;
}

export async function isPersistenceAvailable(): Promise<boolean> {
  try {
    await getPlannerDb().open();
    return true;
  } catch {
    return false;
  }
}
```

### Example 3: JSON file download
```typescript
// apps/planner/src/features/persistence/json-export.ts
import type { BuildDocument } from './build-document-schema';

export function downloadBuildAsJson(doc: BuildDocument, suggestedName: string): void {
  const json = JSON.stringify(doc, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  a.href = url;
  a.download = `pdb-build-${sanitize(suggestedName)}-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke asynchronously — some browsers need the URL alive briefly after click.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60) || 'build';
}
```

### Example 4: Zod 4 native search-param validation (no adapter)
```typescript
// apps/planner/src/router.tsx (excerpt)
// Source: github.com/TanStack/router/issues/4322 (Aug 2025 update — Zod 4 works natively)
import { z } from 'zod';

const shareSearchSchema = z.object({
  // Zod 4 pattern: .default().catch() replaces `fallback()` from the old adapter.
  b: z.string().min(1).max(8192).default('').catch(''),
});

// Used by createRoute({...validateSearch: shareSearchSchema})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@tanstack/zod-adapter` with `fallback()` | Native Zod 4 `.default(x).catch(x)` | Aug 2025 (Zod 4.0.6+) | One fewer dependency; identical behavior. [CITED: github.com/TanStack/router/issues/4322] |
| `node-sqlite3` for extractor | `better-sqlite3` | Ongoing — CLAUDE.md locked | Not Phase 8, but confirms stack direction. |
| `pako` for browser deflate | `fflate` | fflate matured ~2023 | Smaller bundle, faster, better TS types. [CITED: github.com/101arrowz/fflate discussion#28] |
| Browser-based URL shortener backends | Client-side fflate+base64url with JSON fallback | Phase 8 choice | No backend required (CLAUDE.md constraint). |
| Manual `indexedDB` API | `dexie` v4 | Stable since 2024 | 200 lines of wrapper code eliminated. |

**Deprecated/outdated:**
- `@tanstack/zod-adapter` — still published but unnecessary with Zod 4.
- CLAUDE.md's Dexie 4.2.1 pin — current is 4.4.2 (patch-compatible; bump suggested).

## Build Doc Wire Format

The exact JSON skeleton, consumed by Dexie `payload` field, JSON export, and share URL encode (all identical). Schema is defined ONCE in `build-document-schema.ts`; everything else imports the type.

```typescript
// apps/planner/src/features/persistence/build-document-schema.ts
import { z } from 'zod';
import { canonicalIdRegex } from '@rules-engine/contracts/canonical-id';

const canonicalId = z.string().regex(canonicalIdRegex);
const attributeKey = z.enum(['str', 'dex', 'con', 'int', 'wis', 'cha']);
const level16 = z.number().int().min(1).max(16);

const levelProgressionEntrySchema = z.object({
  level: level16,
  classId: canonicalId.nullable(),
  abilityIncrease: attributeKey.nullable(),
});

const skillAllocationSchema = z.object({
  skillId: canonicalId,
  rank: z.number().int().min(0).max(19),
});

const levelSkillEntrySchema = z.object({
  level: level16,
  allocations: z.array(skillAllocationSchema),
});

const levelFeatEntrySchema = z.object({
  level: level16,
  classFeatId: canonicalId.nullable(),
  generalFeatId: canonicalId.nullable(),
});

export const buildDocumentSchema = z.object({
  // Version header — ALL four must be present.
  schemaVersion: z.literal(1),                // BUILD_ENCODING_VERSION; bump on wire-format change
  plannerVersion: z.string().min(1),          // e.g. "1.0.0" — PLANNER_VERSION constant
  rulesetVersion: z.string().min(1),          // e.g. "1.0.0" — RULESET_VERSION constant
  datasetId: z.string().regex(/^puerta-ee-\d{4}-\d{2}-\d{2}\+[a-z0-9]+$/),  // CURRENT_DATASET_ID
  createdAt: z.string().datetime(),
  // The build itself.
  build: z.object({
    name: z.string().max(80).optional(),      // Optional at the doc level; Dexie row PK is separate.
    raceId: canonicalId,
    subraceId: canonicalId.nullable(),
    alignmentId: canonicalId,
    deityId: canonicalId.nullable(),
    baseAttributes: z.object({
      str: z.number().int().min(3).max(25),
      dex: z.number().int().min(3).max(25),
      con: z.number().int().min(3).max(25),
      int: z.number().int().min(3).max(25),
      wis: z.number().int().min(3).max(25),
      cha: z.number().int().min(3).max(25),
    }),
    levels: z.array(levelProgressionEntrySchema).length(16),   // always 16 entries, nulls fill unassigned
    skillAllocations: z.array(levelSkillEntrySchema).length(16),
    featSelections: z.array(levelFeatEntrySchema).length(16),
  }),
}).strict();

export type BuildDocument = z.infer<typeof buildDocumentSchema>;
```

**Key decisions baked into this shape:**
- **Four independent version fields.** `schemaVersion` (wire format), `plannerVersion` (app identity), `rulesetVersion` (rules engine), `datasetId` (data snapshot). Separating them lets us migrate the wire format without bumping rules, or vice versa.
- **Full 16-entry arrays, not sparse maps.** Existing stores use 16-entry arrays; matches zero-friction.
- **Stable canonical IDs only** (per Phase 1 decision). No display names anywhere.
- **`.strict()` on the root.** Unknown fields fail Zod validation, preventing drift between export and import.
- **`name` at `build.name`** is informational (for display on reload); the Dexie row's primary key is a separate `name` at row level. Same value by convention, but kept distinct.
- **No spell/domain fields.** Phase 07.2 removed magic from the planner scope; build doc must not reintroduce them.

**Wire size estimate for a worst-case full-build:**
Rough JSON of a 16-level human fighter with all skills/feats filled:
- 16 levels × ~60 bytes each = ~960 bytes
- 16 skill entries × ~200 bytes each (5 skills @ 40 bytes) = ~3200 bytes
- 16 feat entries × ~80 bytes each = ~1280 bytes
- Base attributes + identity: ~200 bytes
- Version header: ~200 bytes
- **Total uncompressed:** ~5800 bytes
- **Expected deflate ratio** (repetitive canonical IDs compress well): 30-45%
- **Expected compressed:** ~2000-2600 bytes
- **Base64url expansion:** +33%
- **Expected encoded:** ~2700-3500 bytes

This means a 2000-char budget will trigger the JSON fallback for full 16-level builds with many skill allocations. Acceptable per D-06. Lower-level or partial builds (which is the typical sharing case for "hand me a tier-1 paladin") will fit comfortably.

## Plantilla Base.xlsx Layout

Verified by parsing `excel simulador de fichas/Plantilla Base.xlsx` with a node zip+XML parser.

**Workbook structure:**
| Sheet # | Name | Purpose |
|---------|------|---------|
| 1 | Resumen Ficha | **Primary reference for D-02 Resumen layout.** Final flat table for handoff. |
| 2 | Caracteristicas&Dotes | Source for attribute scores + base feat list. Feeds Resumen Ficha via formulas. |
| 3 | Puntos de habilidad | Source for 39-skill totals. Feeds Resumen Ficha via formulas. |
| 4 | Base de datos | Lookup tables (classes, feats, race mods). Static reference data. |
| 5 | Dotes | Full feat list with filters. |

**Resumen Ficha sheet (sheet1) inferred structure** — cells are sparse (template is blank) but formulas reveal the mapping:

| Rows | Col A | Col B | Col C | Col D | Col E | Col F | Col G |
|------|-------|-------|-------|-------|-------|-------|-------|
| 1 | *(header)* | *(title)* | | | | Niveles | |
| 2-7 | Attribute labels (implicit: Fuerza/Destreza/Con/Int/Sab/Car) | `=Caracteristicas!F3..F8` (final score) | `=Caracteristicas!G3..G8` (modifier) | | | Level entries | |
| 8 | | | | | | Nivel 16 | |
| 9 | | | | Dotes (header) | | | |
| 10-29 | | Dote name (e.g. Dureza, Fabricar varita) | | | | | `=Puntos de habilidad!Y4..Y23` (skill totals) |
| 30-40 | | | | | | | Remaining skill totals Y24..Y42 |

**Authoritative mapping (from the formulas I extracted):**
- **Attributes block** (rows 2-7): 6 rows for Str/Dex/Con/Int/Wis/Cha
  - Col B = total ability score = `Caracteristicas&Dotes!F3..F8`
  - Col C = modifier = `Caracteristicas&Dotes!G3..G8`
- **Skill totals** (col G, rows 2-40): 39 rows, one per skill
  - Each cell = `'Puntos de habilidad'!Y{row+2}` — Y column is the "TOTAL" skill value
  - Skill labels (visible in shared strings but hidden in this sheet) match the 39 canonical skills in `compiled-skills.ts`
- **Feat list** (cols B/C/D, rows 10-29): list of chosen feats as names
- **Niveles/Classes block** (top right F1:G1 merged, G2..G8 free): class-per-level table, 16 rows
- **Row G=20 "TOTAL" / BAB placeholder** — derived in the spreadsheet via class-lookup; in the planner it comes from `computeTotalBab()` in `bab-calculator.ts`.

**Planner implementation guidance:**

Render as **three side-by-side blocks in one flat table** (or stacked vertically on narrow viewports):

1. **Identity + Attributes** block (top-left):
   | Row | Content |
   |-----|---------|
   | Nombre | (slot name or "Sin nombre") |
   | Raza · Subraza | `compiledRaceCatalog.label` |
   | Alineamiento | `compiledAlignments.label` |
   | Divinidad | `compiledDeities.label` or "—" |
   | Ruleset · Dataset | `formatDatasetLabel()` |
   | Fuerza | base + racial + level-up = total · mod |
   | Destreza | ... (6 rows) |
   | Constitución | ... |
   | Inteligencia | ... |
   | Sabiduría | ... |
   | Carisma | ... |

2. **Progresión** block (top-right): 16-row class progression + derived combat stats.
   | Col | Content |
   |-----|---------|
   | Nivel (1-16) | level number |
   | Clase | class label at that level |
   | BAB acum. | cumulative BAB at that level |
   | Fort / Ref / Vol | cumulative saves |
   | Puntos gol. | HP (may be deferred if HP roll UI isn't in scope) |
   | Dote gen. | general feat at this level (if any) |
   | Dote clase | class feat at this level (if any) |

3. **Habilidades** block (bottom or right-aligned): 39-row skill total table.
   | Col | Content |
   |-----|---------|
   | Habilidad | skill label |
   | Rangos | total ranks across levels |
   | Mod atr. | ability modifier bonus |
   | Total | computed total |

All numbers are read-only — no edit controls on Resumen. All data pulled from existing selectors (`selectFoundationSummary`, `selectLevelProgressionView`, `selectSkillStatsView`, `selectFeatSheetView`) + `computeTotalBab/FortSave/RefSave/WillSave` in rules-engine.

**Not in Resumen v1:** spell lists (Phase 07.2 descope), domain picks (same), encumbrance (not computed), AC (not computed), individual HP rolls (not UI yet).

## Stable-ID Mapping Strategy

Per Phase 1 locked decision: "Canonical runtime entities use kind-prefixed stable IDs instead of localized labels."

**IDs found in today's compiled catalogs:**
| Entity kind | Example ID | Count |
|-------------|-----------|-------|
| `class:*` | `class:barbarian`, `class:cleric`, `class:weapon-master` | ~30 (includes prestige) |
| `race:*` | `race:dwarf`, `race:elf`, `race:halfelf` | 7 |
| `subrace:*` | `subrace:moon-elf` | variable |
| `feat:*` | `feat:alertness`, `feat:herramientapb1-varitaemociones` | ~1500 |
| `skill:*` | `skill:concentracion`, `skill:inutilizarmecanismo` | 39 |
| `alignment:*` | `alignment:lawful-good` | 9 |
| `deity:*` | — (null; server manages via scripts) | 0 |
| `domain:*` | — (Phase 07.2 descope) | 0 |

**Rule for Phase 8:**
- **Every field in `BuildDocument` that references an entity MUST be a `CanonicalId` string** — never a label, never a numeric index.
- **Label resolution happens at render time only** — Resumen, import-confirm dialog, diff modal all look up labels via the compiled catalog lookup (e.g. `compiledRaceCatalog.races.find(r => r.id === doc.build.raceId)?.label ?? '(desconocido)'`).
- **Version mismatch diff** (D-07) should display *both* canonical IDs AND labels for affected rows: `feat:example-gone` → "Esquiva (ya no existe en v1.3)".
- **Zod schema uses `canonicalIdRegex` from rules-engine** so invalid-format IDs fail validation at the boundary — not a silent hydrate-with-bad-ID path.

**Why not integer IDs?** CLAUDE.md mentioned "stable integer IDs" but the actual canonical-id contract (locked in Phase 1) uses `${kind}:${slug}` strings. Integer IDs would require an extra stable-ID mapping file AND would hide debugging context. Strings compress almost as well under deflate (high repetition of `feat:`, `class:`, `skill:` prefixes = huge dictionary wins).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | 2000-char URL payload budget is conservative-enough for Discord/Twitter/email workflows | Common Pitfalls / url-budget | If wrong: more builds fall back to JSON download. Low impact — fallback UX is covered by D-06. Plan should expose the constant for tuning. |
| A2 | Full 16-level multiclass builds compress to ~2000-3500 encoded bytes | Build Doc Wire Format | If wrong by 2x: most shares fall back to JSON. Still functional, just noisier UX. Plan includes a first-week telemetry task (log payload size to console in dev) to calibrate. |
| A3 | Safari private-mode is the only IndexedDB failure mode we should gate on | Common Pitfalls | Other browsers have storage quotas that can fail async. Plan should catch all Dexie rejections, not just open(). |
| A4 | The Resumen button "already wired" in CONTEXT.md means the label exists — but reading creation-stepper.tsx shows NO onClick handler | Recommended Project Structure / EDIT list | Plan must include wiring the `onClick` handler in the CreationStepper edit task, not just adding the route. |
| A5 | Hash-only routing (not hybrid) is the best fit | Pattern 4 | If existing browser-history tests break, a partial hash-only-on-share approach is a fallback. Tests currently run in jsdom via `createMemoryHistory`, so no real popstate issues expected. Plan should run full test suite after the router change. |
| A6 | `hydrateBuildDocument` order (foundation → level → skill → feat) doesn't trigger spurious revalidation | Pattern 3 | If revalidation cascades on intermediate partial states produce false-illegal flags, plan adds a batch-hydrate path to each store. Plan should include a "import round-trip → export → byte-identical" test to catch this. |
| A7 | `CURRENT_DATASET_ID` should be read from `compiledClassCatalog.datasetId` rather than a separate hand-edited constant | Pattern 1 | If extractor-regenerated catalogs have drift between individual catalog datasetIds, we need stronger contract enforcement. Check: all 5 compiled-*.ts files have the same `datasetId` today (verified by grep — all are `puerta-ee-2026-04-17+cf6e8aad`). |

## Open Questions

1. **Should overwrite confirm show a diff, or just "¿Sobrescribir 'mi-paladin'?"?**
   - What we know: D-01 says "overwrite confirm dialog". Doesn't specify content.
   - What's unclear: Whether users want to see what's being replaced.
   - Recommendation: Start minimal (just name confirm via reused `ConfirmDialog`). Add diff in a follow-up if feedback warrants.

2. **What's the exact text of the overflow toast and the mismatch modal headline?**
   - What we know: D-06 gives example copy. D-07 gives example copy.
   - What's unclear: Planner tone calibration to match existing `shellCopyEs`.
   - Recommendation: Plan the copy as a todo item for the 08-01 plan. Reference existing tone (formal "usted" avoided, present imperative, Spanish "descarga"/"carga" verbs).

3. **Should the Resumen table render HP at all if HP roll UI isn't built?**
   - What we know: Plantilla Base has HP as a derived row. Planner doesn't have an HP-roll step.
   - What's unclear: Show placeholder "—" or compute default HP (max at 1st level, avg thereafter)?
   - Recommendation: Compute max-at-1st + avg-thereafter as a deterministic baseline; show with a "(estimación)" label. Aligns with NWN1 convention.

4. **Where do we show the slot list UI — as a stepper button's modal, or inline in Resumen?**
   - What we know: D-01 implies a Cargar button. D-03 says Resumen is a dedicated screen.
   - What's unclear: Whether Cargar lives in Resumen only or also in the main header.
   - Recommendation: Cargar button inside the Resumen action bar (consistent with Guardar/Exportar/Importar/Compartir placement per Claude's discretion). A separate entry point in Utilidades is a Phase 9 polish if demand surfaces.

5. **Legacy `FOUNDATION_DATASET_ID` — delete or migrate?**
   - What we know: It's hardcoded in a feature fixture that predates the extractor.
   - What's unclear: Whether any test fixture depends on its exact value.
   - Recommendation: Plan a small migration task in 08-01: replace all three usages (`foundation-fixture.ts`, `store.ts`, `level-progression/store.ts`) with `CURRENT_DATASET_ID` import. Run full test suite; update fixtures if they hard-assert the old value.

## Environment Availability

Phase 8 is pure npm + browser. No external binaries needed.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Dev server + tests | ✓ | v22.20.0 (project uses Active LTS) | — |
| pnpm | Install + scripts | ✓ | 10.0.0 | — |
| `zod` | Boundary validation | ✓ | 4.3.5 | — |
| `@tanstack/react-router` | Routing | ✓ | `latest` (1.168.22) | — |
| `dexie` | IndexedDB wrapper | ✗ | — | `pnpm add dexie` |
| `fflate` | Share URL compression | ✗ | — | `pnpm add fflate` |
| `fake-indexeddb` | Vitest Dexie mocking | ✗ | — | `pnpm add -D fake-indexeddb` (test-only dep) |

**Missing dependencies with no fallback:** None — all missing deps are `pnpm add` away.

**Missing dependencies with fallback:** None — no alternatives needed.

**Browser runtime support** (target: modern evergreens):
- IndexedDB: all modern browsers; degrades in Safari private mode (handled via Pitfall 3 check).
- `URL.createObjectURL` + `<a download>`: universal.
- `atob` / `btoa`: universal (base64url is implemented via string replace on top).
- `Blob`, `FileReader`: universal.
- Hash history: universal.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.16 |
| Config file | `vitest.config.ts` (repo root) |
| Quick run command | `pnpm test:phase-08` (new — mirrors existing phase test scripts) |
| Full suite command | `pnpm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SHAR-01 | Resumen screen renders all sections without layout errors | component | `vitest run tests/phase-08/resumen-board.spec.tsx` | ❌ Wave 0 |
| SHAR-01 | Resumen projects correct values from populated stores | unit | `vitest run tests/phase-08/resumen-selectors.spec.ts` | ❌ Wave 0 |
| SHAR-02 | Save then reload round-trips a build identically | integration | `vitest run tests/phase-08/slot-api.spec.ts` | ❌ Wave 0 (needs `fake-indexeddb`) |
| SHAR-02 | Overwrite confirm dialog blocks save until accepted | component | `vitest run tests/phase-08/save-slot-dialog.spec.tsx` | ❌ Wave 0 |
| SHAR-03 | JSON export → import round-trip is byte-identical after re-export | integration | `vitest run tests/phase-08/json-roundtrip.spec.ts` | ❌ Wave 0 |
| SHAR-03 | Malformed JSON import shows error, doesn't mutate stores | unit | `vitest run tests/phase-08/json-import.spec.ts` | ❌ Wave 0 |
| SHAR-04 | encodeShareUrl + decodeShareUrl round-trip is identical | unit | `vitest run tests/phase-08/share-url.spec.ts` | ❌ Wave 0 |
| SHAR-04 | Oversized payload triggers JSON fallback with toast | component | `vitest run tests/phase-08/share-fallback.spec.tsx` | ❌ Wave 0 |
| SHAR-05 | `datasetId` mismatch on import opens VersionMismatchDialog, no hydrate | integration | `vitest run tests/phase-08/version-mismatch.spec.ts` | ❌ Wave 0 |
| SHAR-05 | Matching dataset hydrates cleanly | integration | covered by SHAR-02/03 round-trip tests | ❌ |
| LANG-03 | Footer + Resumen header + exported JSON all show ruleset/dataset label | snapshot/component | `vitest run tests/phase-08/lang-03-surface.spec.tsx` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm vitest run tests/phase-08 --reporter=dot`
- **Per wave merge:** `pnpm test` (full suite)
- **Phase gate:** Full suite green + manual UAT of save/load/share flows across Chrome + Firefox before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `tests/phase-08/setup.ts` — `fake-indexeddb/auto` import, shared test fixtures (sample BuildDocument)
- [ ] `tests/phase-08/resumen-board.spec.tsx`
- [ ] `tests/phase-08/resumen-selectors.spec.ts`
- [ ] `tests/phase-08/slot-api.spec.ts`
- [ ] `tests/phase-08/save-slot-dialog.spec.tsx`
- [ ] `tests/phase-08/json-roundtrip.spec.ts`
- [ ] `tests/phase-08/json-import.spec.ts`
- [ ] `tests/phase-08/share-url.spec.ts`
- [ ] `tests/phase-08/share-fallback.spec.tsx`
- [ ] `tests/phase-08/version-mismatch.spec.ts`
- [ ] `tests/phase-08/lang-03-surface.spec.tsx`
- [ ] Framework install: `pnpm add -D fake-indexeddb` — required for Dexie tests under jsdom

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth surface — personal-use static site. |
| V3 Session Management | no | No sessions. |
| V4 Access Control | no | No backend; local IndexedDB is browser-scoped by origin. |
| V5 Input Validation | **yes** | **Zod 4 at every import boundary** (JSON import, URL decode, Dexie row read-back). Reject unknown fields (`.strict()`), enforce canonical-ID regex, bound numeric ranges. |
| V6 Cryptography | no | No secrets; share URLs are NOT encrypted (builds are public-share content by design). |
| V14 Configuration | partial | Single version-constants module (`ruleset-version.ts`) — don't duplicate dataset IDs across stores. |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malicious JSON import (prototype pollution via `__proto__`) | Tampering | `z.object({...}).strict()` rejects unknown keys; `JSON.parse` plus Zod is safe vs prototype pollution in modern JS engines. |
| Oversized URL payload triggers denial of service on decode | DoS | `b: z.string().max(8192)` at the schema + `fromBase64Url` rejects over-long inputs before inflating. |
| Zip-bomb-style deflate payload | DoS | fflate's `inflateSync` has no built-in size limit; mitigate with a max inflated bytes check before JSON.parse (e.g. 200 kB hard cap since largest legit payload is ~6 kB uncompressed). |
| Malformed base64url causes `atob` exception crash | Availability | Wrap decode in try/catch; show friendly "URL inválida" error. |
| Local IndexedDB corruption from concurrent tab writes | Integrity | Dexie serialises writes per-origin; rely on Dexie's built-in transaction semantics. Use `bulkPut` for multi-row writes. |
| XSS via rendered build name in Resumen | Tampering | React auto-escapes text content; never use `dangerouslySetInnerHTML` for build names. |

## Project Constraints (from CLAUDE.md)

Directives this plan must honor:

1. **Static hosting only** — no backend, no runtime server. All Phase 8 work is client-side. [HARD]
2. **Spanish-first surface** — all UI copy in Spanish; new `shellCopyEs` keys added for footer + Resumen + dialogs. [HARD]
3. **Strict validation, not warnings** — version mismatch fails closed (D-07), malformed imports fail closed. [HARD]
4. **Server Scope: Puerta de Baldur** — rules version + dataset must identify PdB server rules, not base NWN1. [HARD]
5. **NWN1 data model** — builds target NWN1 EE specifically (no NWN2 terminology in copy). [HARD]
6. **Level 1-16** — `BuildDocument.build.levels` is fixed at 16 entries. [HARD]
7. **Sharing: URL + JSON both required** — D-04/D-05 locked; neither is optional. [HARD]
8. **Pure TS rules engine, no React** — new `persistence` feature lives in `apps/planner`, NOT in `packages/rules-engine`. [HARD]
9. **Zod at boundaries only** — not in rules engine. All Zod usage is under `apps/planner/src/features/persistence/`. [HARD]
10. **Use `dexie` for IndexedDB** (stack-lock) — no raw API, no alternatives. [HARD]
11. **Use `fflate` for URL compression** (stack-lock) — no pako/LZ-string. [HARD]
12. **Canonical kind-prefixed IDs** (Phase 1 decision) — no display names in storage format. [HARD]
13. **Mechanical truth ordering** (Phase 1) — manual override > Puerta snapshot > base game. Phase 8 doesn't change this; just consume `compiled-*.ts` as-is. [HARD]
14. **GSD workflow enforcement** — this phase runs under `/gsd:execute-phase`. [HARD]
15. **Use NwnButton / NwnFrame / ConfirmDialog** — reuse existing UI primitives; don't introduce a new dialog library. [SOFT, aesthetic]

## Sources

### Primary (HIGH confidence)
- TanStack Router history types — https://tanstack.com/router/v1/docs/framework/react/guide/history-types
- TanStack Router Zod 4 adapter issue — https://github.com/TanStack/router/issues/4322
- fflate GitHub README — https://github.com/101arrowz/fflate
- fflate vs pako API mapping — https://github.com/101arrowz/fflate/discussions/28
- Dexie TypeScript docs — https://dexie.org/docs/Typescript
- Dexie Table schema docs — https://dexie.org/docs/TableSchema.html
- Repo: `apps/planner/src/features/**/store.ts` (Zustand store shapes)
- Repo: `apps/planner/src/data/compiled-*.ts` (dataset IDs, canonical IDs)
- Repo: `packages/rules-engine/src/feats/bab-calculator.ts` (derived stats computation)
- Repo: `packages/data-extractor/src/contracts/dataset-manifest.ts` (datasetId regex spec)
- Repo: `excel simulador de fichas/Plantilla Base.xlsx` sheet1/sheet2/sheet3 (parsed directly)

### Secondary (MEDIUM confidence)
- URL length limits summary — https://www.sistrix.com/ask-sistrix/technical-seo/site-structure/url-length-how-long-can-a-url-be
- URL length cross-browser reference — https://saturncloud.io/blog/what-is-the-maximum-length-of-a-url-in-different-browsers/

### Tertiary (LOW confidence)
- None. All critical claims are verified against primary sources or the actual codebase.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified against npm registry 2026-04-17; primary libraries already in stack.
- Architecture: HIGH — mirror of existing feature layering (character-foundation / level-progression / skills / feats); no novel patterns.
- Build doc wire format: HIGH — derived directly from existing store shapes; field-by-field match.
- Pitfalls: HIGH for #1 (verified in-repo), MEDIUM for #2-#8 (general IndexedDB/deflate/URL knowledge).
- Plantilla Base layout: MEDIUM — sheet parsed programmatically (formulas extracted), but cell labels are empty in template (data is in formulas only); layout inferred from column formula patterns. Should be validated against a filled-in reference ficha before Plan lock.
- Validation/test architecture: HIGH — mirror of existing `tests/phase-*/` convention.

**Research date:** 2026-04-17
**Valid until:** 2026-05-17 (30 days — core libraries are stable; reconfirm `npm view` versions if research is older than that when planning resumes)
