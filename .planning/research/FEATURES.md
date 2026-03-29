# Feature Landscape

**Domain:** Static NWN1 EE / Puerta de Baldur character planner
**Researched:** 2026-03-29
**Overall confidence:** MEDIUM

## User Expectation Baseline

Users coming from NWN2DB will expect the same planner mental model, even if the visual design changes:

- Top-level planner areas: `Build`, `Skills`, `Spells`, `Abilities`, `Stats`, `Summary`, `Utilities`.
- A level-by-level flow where changing an earlier choice immediately recalculates later legality.
- A planner that can inspect both the current level state and the finished build state.
- A final build summary that another player can read without needing the author's local machine or notes.
- Share/import behavior that reproduces the exact same build state, not an approximation.

## Table Stakes

Features users expect. Missing these will make the planner feel incomplete or untrustworthy.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| NWN2DB-style planner shell | The project explicitly targets the same flow and major screens as NWN2DB; users already know that navigation model. | Medium | Must expose `Build`, `Skills`, `Spells`, `Abilities`, `Stats`, `Summary`, and `Utilities` as first-class areas, not hidden dialogs. |
| Level-by-level progression editor to 16 | Character planning is primarily about progression order, not only final state. | High | Users must be able to choose classes/prestige classes, feats, skills, spells, and domains per level, then jump back and edit earlier levels safely. |
| Full character identity setup at build start | NWN-style builders are expected to start from race/subrace, alignment, deity, and base ability choices because those decisions unlock later options. | Medium | This is the root dependency for class legality, domain availability, feat prerequisites, and spellcasting tracks. |
| Strict server-legal blocking | For Puerta de Baldur, trust depends on legality. Users will leave if the planner permits builds the server rejects. | High | Illegal choices must be blocked, not merely warned about. Blocking should happen at selection time and after upstream edits. |
| Live derived stats and prerequisite recomputation | Builders in this space are expected to continuously recalculate BAB, saves, caster progression, skill budgets, feat prerequisites, and other derived values. | High | `Stats` cannot be a static summary page; it must reflect the currently selected level and final build. |
| Skills and spells as dedicated workflows | NWN2DB users expect separate planning surfaces for skills and spells, not a collapsed one-page form. | High | Spell selection must respect class, level, domains, and server custom content. Skill planning must enforce rank caps and server-specific rules such as heavy-armor tumble constraints. |
| Readable final summary / handoff sheet | The stated use case includes passing finished builds to third parties. | Medium | Summary should show the final level path, key choices, and legality state in a format another player can review quickly. |
| URL sharing plus JSON import/export | This is explicitly required, and users of planner tools expect portability. | Medium | Shared builds must round-trip exactly. `Utilities` should center on save/load/import/export/share, not community features. |
| Version-pinned rules snapshot | Static planners become untrustworthy if server data drifts and old links silently change meaning. | High | Each shared build should carry a ruleset/version identifier tied to the imported Puerta de Baldur data snapshot. |

## Differentiators

Features that create a real advantage for this product versus a generic NWN1 planner.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Puerta de Baldur-exact data pack | Most planners stop at base-game logic. A builder grounded in the server's actual content and exceptions is the main reason to use this product. | High | Primary source should be local NWN assets plus the local `nwsync` content snapshot for `http://nwsync.puertadebaldur.com`, with forum/rules posts layered on top for exceptions not encoded in assets. |
| Explain-why legality blocking | Hard blocking is table stakes here; explaining the exact failing rule is the differentiator that makes the planner usable instead of frustrating. | Medium | Error messages should identify the blocked choice, the affected level, and the specific prerequisite or server exception that failed. |
| Deterministic cross-machine handoff | The planner's second job is build transmission, not only authoring. | Medium | Shared URLs and JSON should reproduce the same choices, same validation result, and same ruleset version on another machine. |
| Static/offline-first behavior | A no-backend planner that still behaves like a serious builder is materially more convenient for local planning and long-term preservation. | Medium | The builder should not require login, cloud persistence, or server calls to open, validate, or share a build once the data bundle is generated. |

## Anti-Features

Features to deliberately not build in v1.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Public accounts, comments, votes, watched builds, and member profiles | These are NWN2DB community features, not core planner value. They force backend work and distract from legality fidelity. | Keep v1 local/static and focus `Utilities` on import/export/share. |
| Full encyclopedia / armory / item database clone | The project is planner-only in v1. Recreating NWN2DB's library and armory expands scope without improving build fidelity enough. | Surface only the rules/help text needed to make planner choices understandable. |
| Soft-warning mode for illegal builds | This directly conflicts with the stated product value of strict server-valid planning. | Block illegal choices and explain why. |
| Equipment, loot, or combat simulation | These systems are expensive, server-specific, and not required to answer "is this build legal and how does it progress?" | Restrict v1 to character progression and legality. |
| Freeform raw data editing in the normal UI | Letting users override internals undermines trust in exported builds and makes support/debugging harder. | Allow JSON import/export, but validate imported payloads strictly against the same rules engine. |

## Data And Source-of-Truth Recommendations

Sharing, validation, and ingestion quality depend on using the right authority for each kind of data.

| Concern | Recommended Source | Why |
|---------|--------------------|-----|
| Base NWN1 EE entities and terminology | Local NWN1 EE game data | More reliable than forum posts for baseline races, classes, feats, skills, and spells. |
| Puerta de Baldur custom content payload | Local `nwsync` metadata DB and synced content for the manifest `http://nwsync.puertadebaldur.com` | Closest machine-readable representation of what the server actually distributes to players. |
| Server-specific legality exceptions | Puerta de Baldur rules pages and forum rule posts | Some restrictions and exceptions will not exist as clean asset metadata and need curated rule logic. |
| Share fidelity | Ruleset/version identifier embedded in URL and JSON | Prevents old shared builds from silently revalidating against a newer rules snapshot. |

## Feature Dependencies

```text
Rules/data snapshot -> legal option catalogs -> all planner screens
Build identity (race/subrace/alignment/deity/abilities) -> class/domain/feat availability
Level progression -> skills/spells/derived stats -> summary
Validation engine -> share/export eligibility
Versioned serialization -> URL sharing + JSON import/export
```

## MVP Recommendation

Prioritize:

1. NWN2DB-style planner shell with the seven major areas and stable navigation.
2. A strict level-1-to-16 progression engine covering race/subrace, alignment, deity, classes, prestige classes, feats, skills, domains, spells, abilities, and derived stats.
3. Deterministic sharing via URL plus JSON import/export, all pinned to a concrete Puerta de Baldur rules snapshot.

Defer:

- Community/library features: they add backend and moderation scope without improving planner trust.
- Encyclopedic browsing: helpful later, but not necessary to plan or hand off a legal build.
- Simulation systems: too much complexity for weak v1 value.

## Sources

- [NWN2DB builder](https://nwn2db.com/builder.php) - reference workflow and planner mental model. Confidence: HIGH for screen/flow intent.
- [NWN2DB search builds](https://nwn2db.com/builds/search) - confirms surrounding product expectations such as start/build/manage/public-build flows and non-planner community surfaces. Confidence: HIGH.
- [Example NWN2DB build page](https://nwn2db.com/build/?260027=) - confirms shared-build behavior and level-adjustment expectations. Confidence: MEDIUM.
- [Beamdog NWN:EE Patch 1.78 announcement](https://forums.beamdog.com/discussion/73421/neverwinter-nights-enhanced-edition-patch-1-78) - official confirmation that NWN:EE introduced `NWSync` for auto-downloaded server content. Confidence: HIGH.
- [PROJECT.md](../PROJECT.md) - project scope, constraints, and required coverage. Confidence: HIGH for local product intent.
- User-provided research context on 2026-03-29 - confirms the reference builder's major areas and the existence of a populated local `nwsync` metadata DB for `http://nwsync.puertadebaldur.com`. Confidence: HIGH for local environment assumptions.

## Confidence Notes

- HIGH confidence on planner behavior expectations tied to NWN2DB flow, sharing needs, and the project's explicit constraints.
- MEDIUM confidence on the exact breadth of Puerta de Baldur custom rule exceptions until the forum/rules corpus is fully harvested and normalized.
