# Architecture Patterns

**Domain:** Static NWN1 EE character planner for Puerta de Baldur  
**Researched:** 2026-03-29  
**Confidence:** HIGH for source-layer structure, MEDIUM for full server-rule completeness

## Recommended Architecture

Build this as two systems with a hard boundary:

1. **Offline data compiler**
   - Reads local NWN EE install data, locale TLK files, and Puerta NWSync metadata/blob shards.
   - Applies a final handwritten server rule pack for legality that is not recoverable from client assets alone.
   - Emits versioned static planner datasets.

2. **Static planner SPA**
   - Loads one compiled dataset.
   - Stores only player decisions.
   - Recomputes legality, progression, stats, spells, and summary from pure functions.

This is the maintainable shape because GitHub Pages cannot read BIF files or SQLite at runtime, and strict legality requires deterministic rule execution with no hidden browser-side extraction logic.

## Data Layers

| Layer | What it contains | What it must not contain | Why it exists |
|------|-------------------|--------------------------|---------------|
| **Extracted source data** | Raw 2DA/TLK/resources pulled from `KEY/BIF`, locale `dialog.tlk`, Puerta NWSync manifest/blob content, and source provenance | UI state, merged gameplay meaning, computed eligibility | Rebuildable audit trail; lets you diff source revisions safely |
| **Normalized canonical data** | Final overlaid tables, stable IDs, resolved cross-references, text references, dataset metadata, source provenance | Per-user choices, UI caches, derived build totals | Single runtime truth for the SPA |
| **Runtime planner state** | Versioned build document plus ephemeral UI state | Raw source files, duplicated rules, cached derived legality | Keeps sharing/import small and deterministic |

**Non-negotiable rule:** never let the SPA read raw install files or SQLite directly. The browser should only read compiled static dataset files.

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|----------------|-------------------|
| **Source adapters** | Read base install `KEY/BIF`, base and custom TLK, NWSync manifest DB, NWSync shard DB, and manual rule sources | Raw source store |
| **Raw source store** | Immutable extracted snapshots plus checksums, source URL/path, manifest SHA, extraction timestamp | Normalizer/merger, compiler tests |
| **Normalizer/merger** | Convert raw tables/resources into canonical entities; apply overlay precedence `base game -> server asset overrides -> manual server rules` | Text resolver, rule compiler, dataset packer |
| **Text resolver** | Keep `strref`-backed text separate from gameplay entities; resolve base locale TLK plus server custom TLK overlays | Normalizer/merger, SPA selectors |
| **Rule compiler** | Compile declarative legality/progression rules into runtime-friendly predicates and explanation codes | Planner engine |
| **Planner engine** | Pure functions for level progression, eligibility, skill caps, spell choices, stat math, summary generation, and illegal-state explanations | Runtime store, selectors, serializers |
| **Runtime store** | Versioned `BuildDocument` and current navigation/UI flags | Planner engine, serializers, screen selectors |
| **Serializers** | JSON import/export, URL share codec, schema migrations, dataset compatibility checks | Runtime store, planner engine |
| **Screen selectors** | Derive screen-specific view models for build, skills, spells, abilities, stats, summary, utilities | Runtime store, planner engine, text resolver |
| **UI screens** | Present decisions and legality explanations; never contain game-rule logic | Screen selectors |

## Canonical Model Rules

Use NWN-native identifiers where the engine uses them:

- Table-backed entities should use canonical IDs like `feat:123`, `spell:456`, `class:12`, `skill:8`.
- Text should keep `strref` identity separate from gameplay identity.
- Build choices should be stored as a `LevelDecision[]`, not as sixteen fixed screen objects.

That last point is what prevents a level-16 rewrite later. The first release can enforce `maxLevel = 16` from dataset config, while the core model remains open-ended.

## Data Flow

```text
Local NWN install (KEY/BIF + dialog.tlk)
        +
Local Puerta NWSync DBs (manifest index + blob shards)
        +
Manual Puerta rule pack (forum/script-only legality)
        |
        v
Offline extraction
        |
        v
Raw source snapshots with provenance
        |
        v
Normalization + overlay merge + text resolution + rule compilation
        |
        v
Static dataset pack
  - dataset-manifest.json
  - entities/*.json
  - texts/{locale}.json
  - rules.json
        |
        v
SPA boot loads one dataset
        |
        v
User edits BuildDocument
        |
        v
Planner engine recomputes derived state
        |
        v
Selectors feed build / skills / spells / abilities / stats / summary / utilities screens
        |
        v
Import/export/share serializes BuildDocument + schemaVersion + datasetId
```

## Rules and Override Strategy

Split legality into three sources, in order:

1. **Base game structure**
   - What the shipped tables and TLK define.
2. **Server asset overrides**
   - What Puerta changes through NWSync-distributed 2DA/TLK content.
3. **Server policy rules**
   - What is enforced by script, forum revisions, or explicit exceptions not recoverable from client assets.

Represent server policy rules as declarative data first, with a narrow imperative escape hatch inside the planner engine. Do not scatter exceptions through UI components or ad hoc selectors.

Each runtime validation result should return:

- `isLegal`
- `code`
- `messageKey`
- `sourceLayer`
- `evidence`

That traceability is important for a strict-legality planner because users need to know whether a rejection came from base NWN rules, a Puerta override, or a manual server exception.

## Suggested Build Order

1. **Define canonical schemas**
   - `BuildDocument`, entity IDs, text bundle shape, rules shape, dataset manifest.
   - Lock this first because everything else depends on it.
2. **Build the extraction/compiler pipeline**
   - Base install adapter, NWSync adapter, raw snapshot format, overlay merge.
   - This de-risks the project earlier than UI work.
3. **Build the planner engine**
   - Level progression, eligibility, skill math, spell selection, legality explanations.
   - Must be pure and heavily fixture-tested before screens exist.
4. **Build serializers and migrations**
   - JSON import/export, URL codec, dataset mismatch handling.
   - Sharing fidelity is a core product value, so this should not be bolted on later.
5. **Build screen selectors and runtime store**
   - One store, one event model, no duplicated derivation in components.
6. **Build UI areas**
   - Build -> abilities/stats -> skills -> spells -> summary -> utilities.
   - That order follows dependency direction from primary decisions toward read-mostly views.

## Static-Hosting Constraints

- Treat data refresh as a local developer utility, not an in-browser feature.
- Commit or publish compiled dataset artifacts; the hosted SPA only consumes them.
- Split large datasets by concern so the initial bundle is not forced to load every spell and text entry up front.
- Keep dataset identity explicit. Shared URLs and imports must include `datasetId`; otherwise the same build may render differently on another machine.

## Testability Requirements

- **Compiler tests:** raw extraction fixtures, overlay merge snapshots, provenance assertions.
- **Engine tests:** golden legal/illegal builds, rule explanation snapshots, progression prefix checks.
- **Serializer tests:** schema migration coverage, URL round-trips, dataset mismatch warnings.
- **UI tests:** only interaction and rendering. No legality logic should need component tests.

## Anti-Patterns To Avoid

### Runtime Source Parsing
Reading BIF/TLK/NWSync in the browser couples the hosted app to local filesystems and destroys determinism.

### Mixed Data Layers
Do not let canonical game data and user build state share one mutable store object. That turns every feature into incidental cache invalidation work.

### UI-Owned Rules
If a legality rule lives inside the skills or spells screen, it will drift from import, summary, and share behavior.

### Sharing Derived State
Never serialize final stats, legality booleans, or screen caches into share links. Serialize decisions only, then recompute.

## Architecture Note For Puerta

Local inspection shows:

- Base install data includes `base_2da.bif`, `bd_nui.bif`, `bd_ui.bif`, `nwn_base.key`, and locale `dialog.tlk` files.
- Puerta has a manifest row for `http://nwsync.puertadebaldur.com` in `nwsyncmeta.sqlite3`.
- That manifest indexes rules tables such as `classes`, `domains`, `feat`, `racialtypes`, `skills`, and `spells`.
- It also includes a custom TLK-like resource `pb_tlk_v6`.
- The shard database stores `NSYC`-wrapped blobs rather than plain files.

**Inference:** because the observed Puerta manifest metadata has `includes_client_contents = 1` and `includes_module_contents = 0`, NWSync should be treated as a strong client-data source, but not as proof that all server legality is recoverable from assets alone. Keep the manual server rule pack as a first-class architecture component.

## Sources

- Local inspection: `C:\Program Files (x86)\Steam\steamapps\common\Neverwinter Nights\data` and `...\lang\*\data\dialog.tlk`
- Local inspection: `C:\Users\pzhly\Documents\Neverwinter Nights\nwsync\nwsyncmeta.sqlite3`
- Local inspection: `C:\Users\pzhly\Documents\Neverwinter Nights\nwsync\nwsyncdata_0.sqlite3`
- https://github.com/niv/neverwinter.nim
- https://niv.github.io/nwn.py/moduleIndex.html
- https://nwn.wiki/spaces/NWN1/pages/190185475/Player+Modding+FAQ
- https://nwn.wiki/spaces/NWN1/pages/38175102/feat.2da
