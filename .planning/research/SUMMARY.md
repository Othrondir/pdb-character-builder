# Project Research Summary

**Project:** NWN1 EE Puerta de Baldur character planner
**Domain:** Static character-planning SPA backed by an offline NWN/Puerta rules compiler
**Researched:** 2026-03-29
**Confidence:** MEDIUM

## Executive Summary

This product should be treated as a strict-legality planner, not a generic character sheet and not a backend app. The research converges on one credible implementation shape: an offline compiler extracts base NWN EE data plus Puerta de Baldur `nwsync` content, layers a curated manual rule pack for script-only or forum-only exceptions, and emits one versioned dataset for a static React SPA. The browser should only load compiled data, store player decisions, and recompute legality, progression, stats, and summaries from pure rules functions.

For v1, the product needs to match the NWN2DB planner mental model while staying local-first and deterministic. The roadmap should not start with UI polish. The main delivery risk is source-of-truth drift across base assets, synced overrides, and human-authored server rules. Freeze schemas, IDs, provenance, and source precedence first; then build the extractor; then build the rules engine; only then build the rich planner screens. Share fidelity is part of the core value, so URL/JSON versioning must ship with the engine rather than as a later convenience feature.

## Recommended Implementation Path

### Phase 1: Canonical rules contract and source matrix
**Rationale:** Everything downstream depends on stable IDs, schema boundaries, provenance, and conflict resolution.
**Delivers:** `BuildDocument` schema, canonical entity ID scheme, dataset manifest format, source precedence rules, manual override registry.
**Supports:** Version-pinned builds, deterministic sharing, future migrations.
**Must avoid:** Mixed-vintage rule truth, display-name identities, undocumented overrides.
**Research flag:** YES. Puerta-specific manual exceptions still need a final source-of-truth pass.

### Phase 2: Extraction pipeline and versioned dataset snapshot
**Rationale:** GitHub Pages cannot read BIF/TLK/SQLite at runtime, so the extractor is effectively the backend.
**Delivers:** Repeatable compiler from local NWN install + Puerta `nwsync` snapshot + manual overrides, normalized JSON artifacts, dataset hashes, provenance metadata.
**Supports:** Legal option catalogs for classes, feats, skills, spells, domains, and texts.
**Must avoid:** Manual one-off exports, hand-edited generated data, assuming the server ships loose files.
**Research flag:** YES. Confirm exact `nwsync`/`NSYC` coverage and custom TLK/table handling.

### Phase 3: Pure rules engine and per-level validation
**Rationale:** Product trust comes from deterministic legality across the whole level path, not from a final-level summary.
**Delivers:** Pure TypeScript planner engine, `legal/illegal/unsupported` validation states, explanation codes/evidence, per-level recomputation of stats, skills, feats, domains, and spells.
**Supports:** Strict server-legal blocking, live recalculation, explain-why validation.
**Must avoid:** Treating parsed 2DA files as the full rules engine, final-state-only validation, UI-owned rule logic.
**Research flag:** YES. Script-only Puerta exceptions and hardcoded NWN behaviors need targeted follow-up.

### Phase 4: Serialization, sharing, and persistence
**Rationale:** Build handoff is a core use case, so share/import fidelity cannot be bolted on after the UI exists.
**Delivers:** Versioned JSON format, URL codec with compression and size budget, dataset mismatch handling, IndexedDB save/load.
**Supports:** URL sharing, JSON import/export, local drafts and presets.
**Must avoid:** Unversioned payloads, silent revalidation drift, serializing derived state or display names.
**Research flag:** LOW. Implementation pattern is standard once schemas are locked.

### Phase 5: Planner shell and screen delivery
**Rationale:** Once the engine is stable, the UI can stay thin and mirror the NWN2DB planner flow without owning rules.
**Delivers:** Seven planner areas (`Build`, `Skills`, `Spells`, `Abilities`, `Stats`, `Summary`, `Utilities`), selectors, runtime store, legality messaging.
**Supports:** The full v1 user workflow.
**Must avoid:** NWN2 terminology drift, duplicated rule logic per screen, hiding core screens behind dialogs.
**Research flag:** LOW. The UX reference is already clear.

### Phase 6: Regression corpus and refresh discipline
**Rationale:** Data refreshes will become unsafe unless changed outcomes are testable and attributable.
**Delivers:** Goldens suite of legal/illegal/unsupported builds, snapshot diff review, acceptance log for changed outcomes.
**Supports:** Safe ruleset refreshes and long-term planner trust.
**Must avoid:** Silent behavior drift, fear-driven stale data, eyeballing JSON diffs as the only QA.
**Research flag:** MEDIUM. Needs a curated corpus of real Puerta examples.

### Phase Ordering Rationale

- Put schemas and source precedence first because they decide every later serialization, validation, and migration choice.
- Put extraction before UI because the browser runtime cannot inspect local game assets or `nwsync` databases.
- Put the rules engine before rich screens because legality must be centralized and reused by import, summary, and share flows.
- Put sharing early because cross-machine fidelity is part of the product promise, not optional polish.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** Final Puerta exception inventory and precedence decisions.
- **Phase 2:** Exact compiler coverage for `nwsync` blobs, custom TLK resources, and provenance capture.
- **Phase 3:** Hardcoded NWN behaviors versus asset-driven rules, especially multiclass and server exception logic.
- **Phase 6:** Representative legal/illegal regression corpus tied to source references.

Phases with standard patterns:
- **Phase 4:** URL/JSON versioning, IndexedDB persistence, and codec validation.
- **Phase 5:** React/Vite SPA composition, router/store wiring, and selector-driven screens.

## Table-Stakes for v1

- NWN2DB-style planner shell with first-class `Build`, `Skills`, `Spells`, `Abilities`, `Stats`, `Summary`, and `Utilities` areas.
- Level-by-level progression from 1 to 16 with editable earlier levels and full downstream recomputation.
- Full character identity setup at build start: race, subrace, alignment, deity, starting abilities, and any roots needed for later legality.
- Strict server-legal blocking for classes, prestige classes, feats, skills, domains, and spells.
- Live derived stats and prerequisite recalculation for both current level and final build state.
- Dedicated skills and spells workflows rather than collapsing them into a generic form.
- Readable final summary suitable for handing a build to another player.
- Deterministic URL sharing plus JSON import/export.
- Ruleset-pinned build serialization so old links do not silently change meaning.

## Key Source-of-Truth Decisions

- The browser must consume only compiled planner datasets. It must never read raw BIF/TLK files, raw `nwsync` SQLite data, or forum HTML at runtime.
- Use base NWN EE install data as the mechanical baseline, then overlay Puerta-distributed `nwsync` assets, then layer a curated manual rule pack for script-only or forum-only exceptions.
- Record provenance on normalized records and on the dataset manifest: source path or URL, snapshot identity, extraction timestamp, and hash.
- Use stable internal IDs based on NWN-native identifiers, row/label identity, or equivalent canonical keys. Display text is presentation only.
- Embed `schemaVersion` and `datasetId` or rules hash in every URL and JSON payload. Snapshot mismatches should open in read-only or explicit migration mode, never silently revalidate.
- Treat legality as three-state: `legal`, `illegal`, or `unsupported`. If a Puerta rule cannot be confirmed, the planner must not present the build as canonical.
- Keep every manual override in an explicit registry with rationale and source reference. Untraceable overrides are blockers, not harmless TODOs.

## Risks That Must Shape Roadmap Phases

1. **Mixed source truth will invalidate the whole product**  
Source precedence must be frozen before UI work. If base assets, synced overrides, and forum rules are merged informally, the planner will encode rules that never existed together.

2. **Extraction is a core system, not setup work**  
Puerta data appears to live in `nwsync` databases and wrapped blobs rather than a neat loose-file pack. The roadmap needs a dedicated compiler phase, not ad hoc exports feeding the app.

3. **2DA parsing alone is not enough for legality**  
The engine needs explicit buckets for data-driven rules, hardcoded NWN behavior, and Puerta-specific exceptions. This is a rules-engine problem, not a UI problem.

4. **Final-build validation is insufficient**  
The planner must recompute legality level by level after every upstream change. If intermediate levels can go illegal, the summary page cannot be the first place to discover that.

5. **Sharing will drift without snapshot identity**  
If links and files do not carry schema and dataset versions, a build can become legal or illegal later for unrelated reasons. Serialization must be designed alongside the engine.

6. **Maintenance will fail without a regression corpus**  
Once Puerta data changes, the team needs goldens to prove whether changed results are intentional. Otherwise every refresh becomes a risky manual judgment call.

## Confidence and Open Questions

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | The static SPA stack is well-supported and matches the hosting/runtime constraints cleanly. |
| Features | MEDIUM | Core planner expectations are clear, but the full set of Puerta-specific exceptions is not yet fully harvested. |
| Architecture | HIGH | Offline compiler + static SPA + pure rules engine is strongly supported by both the data shape and GitHub Pages constraints. |
| Source of truth | MEDIUM | Local `nwsync` data is a strong authority, but script/forum-only rules still require curation. |
| Pitfalls | HIGH | The main risks are consistent across the research docs and local environment findings. |

**Overall confidence:** MEDIUM

### Open Questions

- Which Puerta legality rules still live only in forum posts, scripts, or admin policy rather than in client-distributed assets?
- Does the current local `nwsync` snapshot expose every custom table and text resource needed for v1, including `pb_tlk_v6` resolution?
- What should the exact user experience be for dataset mismatches: strict read-only, guided migration, or dual-mode support?
- Which real Puerta builds should seed the regression corpus for known legal, illegal, and unsupported cases?
- Can any Beamdog/NWN UI assets be redistributed, or should the visual layer stay strictly NWN1-inspired rather than asset-reusing?

## Sources

### Internal research
- `.planning/PROJECT.md`
- `.planning/research/STACK.md`
- `.planning/research/FEATURES.md`
- `.planning/research/ARCHITECTURE.md`
- `.planning/research/PITFALLS.md`

### Primary evidence
- Local NWN EE install data (`KEY/BIF`, base resources, locale `dialog.tlk`)
- Local Puerta `nwsync` metadata and shard databases for `http://nwsync.puertadebaldur.com`

### Secondary references
- `neverwinter.nim` documentation and releases
- Official Vite, React, TypeScript, TanStack Router, Dexie, Zod, Playwright, and Vitest docs/releases
- NWN technical references on 2DA files, feats, and custom-content packaging
- NWN2DB builder flow as UX reference only

---
*Research completed: 2026-03-29*
*Ready for roadmap: yes*
