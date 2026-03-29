# Domain Pitfalls

**Domain:** Static NWN1 EE / Puerta de Baldur character planner
**Researched:** 2026-03-29
**Overall confidence:** MEDIUM

## Recommended Phase Buckets

| Phase | Focus |
|------|-------|
| Phase 1 | Source inventory and canonical precedence |
| Phase 2 | Extraction pipeline and versioned data snapshot |
| Phase 3 | Rules engine and per-level validation |
| Phase 4 | Serialization, imports, and share fidelity |
| Phase 5 | Regression QA and drift monitoring |

## Critical Pitfalls

### Pitfall 1: Mixed-vintage source of truth
**What goes wrong:** Forum threads, rules pages, local base-game data, and local Puerta de Baldur sync data get merged without an explicit precedence rule. The planner then mixes old forum text with newer distributed assets and produces rules that never existed together on the real server.
**Warning signs:**
- A feat, spell, class, or domain definition exists in more than one source and the project does not record which source won.
- Manual notes like "forum says X but local data says Y" are not turned into a tracked override.
- Generated data lacks per-record provenance, source URL/path, and snapshot date/hash.
**Prevention strategy:** Define a canonical hierarchy before building screens: `Puerta de Baldur synced assets snapshot -> local NWN1 EE base data -> server rules/forum posts for script-only or policy-only exceptions -> explicit manual overrides`. Store provenance on every normalized rule. Treat undocumented conflicts as blockers, not TODO comments.
**Address in phase:** `Phase 1`

### Pitfall 2: Underestimating extraction because the server data is not a neat loose-file pack
**What goes wrong:** The implementation assumes custom content will be available as easy-to-parse `hak`, `tlk`, or `module` files. In practice, the local environment already shows the opposite pattern: the user folder has a populated `nwsync`/`database` area and empty loose-content folders, so the real authoritative payload may live in synced snapshot storage rather than hand-curated files.
**Warning signs:**
- Extraction starts from ad hoc manual exports instead of a repeatable pipeline.
- The project cannot answer "which exact synced snapshot produced this JSON bundle?"
- Generated planner data is hand-edited after export.
**Prevention strategy:** Build extraction as a first-class pipeline with pinned inputs: base install path, local sync snapshot, manifest URL, tool version, and output hash. Generate normalized JSON plus a manifest file that records source paths and snapshot identity. Never treat generated rule data as hand-maintained application code.
**Address in phase:** `Phase 2`

### Pitfall 3: Assuming 2DA tables are the whole rules engine
**What goes wrong:** The planner reads tables and assumes that is enough to model legality. NWN character generation is only partly data-driven: some behaviors are hardcoded, some `ruleset.2da` values are keyed by label rather than row number, and some skills/feats/classes have engine-specific behavior that a raw table parser will miss.
**Warning signs:**
- Validation logic is described as "we just parse the 2das."
- There is no catalog of hardcoded or script-backed exceptions.
- Edge cases cluster around skills, feats, spellcasting progressions, or class feature timing.
**Prevention strategy:** Split rule sources into three buckets: `data-driven`, `engine-hardcoded`, and `server-exception`. Keep a curated rules layer for hardcoded behavior and a separate override layer for Puerta-specific exceptions. Require known-build fixtures for every rule that is not directly and safely derivable from extracted data.
**Address in phase:** `Phase 3`

### Pitfall 4: Validating only the final level instead of the whole progression
**What goes wrong:** The planner says the level-16 build is legal while hiding that level 3, 6, or 11 is illegal. This is the most common way a builder becomes misleading: it evaluates the destination instead of the path.
**Warning signs:**
- Revalidation happens only on the summary screen.
- Changing an early-level choice does not immediately invalidate later feats, spells, or skills.
- Illegal intermediate states can survive until export or share.
**Prevention strategy:** Model progression as a deterministic state machine from level 1 upward. Every upstream change must recompute all later levels. Record derived state at each level and validate server-specific checkpoints where they actually apply, including multiclass exceptions and other Puerta-specific restrictions.
**Address in phase:** `Phase 3`

### Pitfall 5: Using display names as identities
**What goes wrong:** The project keys content by human-readable names from forum posts or TLK text. That breaks when text is renamed, localized, corrected, or duplicated. Shared builds then deserialize to the wrong feat/spell/domain or fail to round-trip exactly.
**Warning signs:**
- URLs or JSON store `"name"` values but no stable internal IDs plus snapshot version.
- Matching logic relies on case-insensitive string equality.
- Renaming text requires migration of core planner logic.
**Prevention strategy:** Use stable internal IDs based on extracted row/label/strref identity plus a rules snapshot version. Treat display text as presentation only. Add a migration table for renamed content and keep import/export formats explicitly versioned.
**Address in phase:** `Phase 2` and `Phase 4`

### Pitfall 6: Unversioned sharing and silent revalidation drift
**What goes wrong:** A shared URL or JSON file reproduces different legality results a month later because the planner always revalidates against the latest rules bundle. That breaks the stated requirement that shared builds reproduce exactly on another machine.
**Warning signs:**
- Share payloads omit ruleset hash, manifest revision, or schema version.
- Import always upgrades to the latest rules without user choice.
- Old links can change from legal to illegal with no visible explanation.
**Prevention strategy:** Embed `schema version + rules snapshot ID/hash` in every shared build. If a snapshot is unavailable, open the build in `legacy/read-only` or `migrate` mode instead of silently mutating it. Maintain compatibility tests for old links and files.
**Address in phase:** `Phase 4`

### Pitfall 7: Presenting guesses as legality
**What goes wrong:** The planner falls back to generic NWN1 defaults or partially documented assumptions for missing Puerta data, but still labels the build `valid`. That is worse than an incomplete planner because it is confidently wrong.
**Warning signs:**
- Unsupported checks are collapsed into green `valid` status.
- Missing rules are handled with default NWN behavior and no warning.
- Block reasons cannot cite the underlying source or rule family.
**Prevention strategy:** Use a three-state model: `legal`, `illegal`, `unsupported/unknown`. If a rule cannot be confirmed from the current snapshot plus documented exceptions, the planner must say so explicitly and block "canonical" share/export. Show provenance and the exact rule gap behind every unsupported result.
**Address in phase:** `Phase 3`

### Pitfall 8: No regression corpus for drift and maintenance
**What goes wrong:** Every data refresh becomes risky because nobody can prove whether behavior changed intentionally or by accident. Over time the team becomes afraid to update the data pack, so the planner freezes on a stale snapshot or ships silent regressions.
**Warning signs:**
- There is no suite of known legal, known illegal, and known edge-case builds.
- Snapshot refreshes are reviewed only by eyeballing generated JSON diffs.
- Forum/rules thread changes are not linked to a test or fixture update.
**Prevention strategy:** Build a goldens suite early: canonical legal builds, illegal builds, and borderline cases tied to source references. On every snapshot refresh, diff the extracted data, rerun the suite, and require an explicit decision log for every changed outcome.
**Address in phase:** `Phase 5`

## Moderate Pitfalls

### Pitfall 1: Copying NWN2DB too literally
**What goes wrong:** The planner copies NWN2DB labels or assumptions that belong to NWN2 instead of using the same screen flow with NWN1/Puerta semantics. The result feels familiar but gives subtly wrong guidance.
**Warning signs:** NWN2 terminology leaks into tooltips, derived stat labels, or prerequisite explanations.
**Prevention strategy:** Reuse the workflow, not the rules language. Maintain an NWN1/Puerta terminology contract and review every planner surface against it.
**Address in phase:** `Phase 1` and `Phase 3`

### Pitfall 2: Rule logic duplicated across UI screens
**What goes wrong:** Each screen reimplements parts of validation. Small rule changes then require multi-file UI edits and eventually diverge.
**Warning signs:** `Build`, `Skills`, `Spells`, and `Summary` each compute legality independently.
**Prevention strategy:** Keep one rules engine and expose screen-ready queries from it. UI components should render options, block reasons, and derived values returned by the engine, not reconstruct them.
**Address in phase:** `Phase 3`

### Pitfall 3: Manual override sprawl
**What goes wrong:** As gaps appear, the project adds one-off JSON or TypeScript patches with no source trace. This fixes today’s blocker but destroys long-term maintainability.
**Warning signs:** Growing lists of hand-authored exception files without provenance or expiry criteria.
**Prevention strategy:** Put every manual override in a dedicated override registry with source, rationale, owner, and review date. Anything untraceable should be treated as technical debt, not normal data.
**Address in phase:** `Phase 2` and `Phase 5`

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Source inventory | Starting UI work before source precedence is frozen | Finish a source matrix first and require provenance fields in normalized data |
| Extraction pipeline | Depending on manually exported assets or today's local folder shape | Build a reproducible generator from base game + Puerta snapshot inputs |
| Rules engine | Equating parsed tables with full legality | Maintain explicit hardcoded-rule and server-exception layers |
| Validation UX | Showing a single green/red status with no provenance | Return `legal/illegal/unsupported` with source-backed explanations |
| Share/import | Serializing choices without rules snapshot identity | Embed snapshot hash and schema version in every URL/JSON payload |
| Maintenance | Refreshing rules data without goldens or diff review | Require corpus re-runs and explicit acceptance of changed outcomes |

## Sources

- [PROJECT.md](../PROJECT.md) - local product intent, strict-legality requirement, and documented risk of source drift. Confidence: HIGH.
- User-provided local environment context from 2026-03-29 - confirms a populated local `nwsync` metadata DB for `http://nwsync.puertadebaldur.com`, plus the need to prefer local data over mixed-age forum pages where possible. Confidence: HIGH.
- Local environment observation from 2026-03-29 - the NWN install contains base-game data folders, while the user data folder contains `database/nwsyncdata_0.sqlite3` and `database/nwsyncmeta.sqlite3` but empty loose `hak`, `tlk`, and `modules` directories. Confidence: HIGH for extraction-risk assessment.
- [2da Files - nwn.wiki](https://nwn.wiki/spaces/NWN1/pages/38174875/2da%2BFiles) - current technical notes on client/server-loaded tables, hardcoded limits, row/label semantics, and why naive table parsing is risky. Confidence: MEDIUM.
- [feat.2da - nwn.wiki](https://nwn.wiki/spaces/NWN1/pages/38175102/feat.2da) - current notes on hardcoded feats and why replacing or reinterpreting feat data naively is dangerous. Confidence: MEDIUM.
- [Player Modding FAQ - nwn.wiki](https://nwn.wiki/spaces/NWN1/pages/190185475/Player%2BModding%2BFAQ) - current overview of hak/TLK/custom-content packaging expectations in NWN:EE. Confidence: MEDIUM.
- [NWN:EE Patch 1.78 announcement - Beamdog Forums](https://forums.beamdog.com/discussion/73421/neverwinter-nights-enhanced-edition-patch-1-78) - official confirmation that NWSync is part of the NWN:EE distribution model for server content. Confidence: HIGH.
- [NWN2DB builder](https://nwn2db.com/builder.php) - confirms the reference planner flow that should be copied at the UX level but not treated as NWN1 rules truth. Confidence: HIGH for workflow expectations.

## Confidence Notes

- HIGH confidence on the source-of-truth, extraction, sharing, and drift risks because they are directly supported by the local environment and the project brief.
- MEDIUM confidence on the full set of Puerta de Baldur rule exceptions because the live forum/rules corpus was not exhaustively harvested in this pass.
