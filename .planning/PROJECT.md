# NWN 1 Character Builder

## What This Is

A static web-based character planner for Neverwinter Nights 1 Enhanced Edition, tailored to the Puerta de Baldur server rules and custom content. It mirrors the workflow and main screens of the NWN2DB builder, but with a visual identity inspired by NWN1 and a deployment model that works as a GitHub-rendered site with no backend.

The planner is primarily for personal use, but it must also make it easy to hand builds to other players as a preconfigured character sheet via shareable links and importable/exportable files. The product should be Spanish-first because the target server, its custom feats, and its rules material are in Spanish.

## Core Value

A player can build a Puerta de Baldur character from level 1 to 20 with strict server-valid validation and share that exact build reliably. _(Range extended 1-16 → 1-20 in Phase 12.6.)_

## Current State (post v1.0)

**Shipped 2026-04-26** — see `.planning/MILESTONES.md` and `.planning/milestones/v1.0-ROADMAP.md`.

- 27 phases / 99 plans / 597 commits / ~236k LOC
- Spanish-first SPA on TanStack Router + Zustand + Zod 4 + Dexie + fflate; Vite build to GitHub Pages
- Catalog data extracted via `packages/data-extractor` from local `nwsync` (2016 items across 6 catalogs)
- Persistence: IndexedDB save slots + JSON import/export + share URL (hash routing for GH Pages)
- A11y: focus-trap (drawer) + body-scroll-lock (5 surfaces, stacking counter) + jsdom HTMLDialogElement polyfill

## Requirements

### Validated (v1.0)

- [x] Versioned, provenance-aware Puerta rules contracts compile into public-safe planner datasets with fail-closed blocked states — Phase 1 ✓ v1.0
- [x] Spanish-first planner shell with NWN1 visual identity — Phase 2 ✓ v1.0
- [x] Legal character foundation: race/subrace/alignment/attributes with restriction feedback — Phase 3 + 12.2 ✓ v1.0
- [x] Stable level 1-20 progression with prerequisite + multiclass legality + per-level gains — Phase 4 + 12.6 ✓ v1.0
- [x] Guided wizard flow with compact information display + clear visual hierarchy — Phase 05.2 ✓ v1.0
- [x] Feats + proficiencies with exact prerequisite feedback per level — Phase 6 + 12.4 + 12.8 ✓ v1.0
- [x] Skills with server-accurate restrictions + synchronized derived stats — Phase 5 + 12.7 ✓ v1.0
- [x] Save/load/import/export/share builds via files + URLs — Phase 8 + 14 ✓ v1.0
- [x] Strict server-valid validation: illegal builds blocked not warned — Phases 1, 4, 12.2, 12.8 ✓ v1.0
- [x] All 37 active v1 REQ-IDs satisfied — see `milestones/v1.0-REQUIREMENTS.md`

### Descoped (v1.0 → v2)

- ~~CHAR-03~~ deity picker — server manages deities via scripts, not 2DA
- ~~MAGI-01..04~~ domain/spell pickers — Phase 07.2 product pivot to server's `Plantilla Base.xlsx`

### Active (v1.1 candidates — to be locked via `/gsd-new-milestone`)

- [ ] Phase 16: Feat Engine Completion — close Phase 06 bonus-feat TODOs (feat-eligibility.ts L45+L49) + Humano L1 feat-slot store capacity (2→3)
- [ ] A1 point-buy cost per race (blocked on extractor enrichment or Puerta snapshot override)
- [ ] P5 level-table redesign (open-ended UX)
- [ ] 3 carry-forward quick tasks from 2026-04-25 (q1m bruja dotes, qzv auto-dotes-por-clase, r5j scroll progresión)
- [ ] Nyquist VALIDATION.md coverage (systemic process gap; 4/27 currently compliant)
- [ ] @playwright/test installation + Phase 12.4-09 SPEC R9 e2e migration off RTL fallback

### Out of Scope

- Live integration with the Puerta de Baldur server or game client — this is a standalone planner for now.
- PHP or any server-rendered backend — the site must compile to static assets suitable for GitHub Pages.
- Public hosting, accounts, or cloud persistence in v1 — the first target is local use with portable builds.

## Context

The reference product is `https://nwn2db.com/builder.php`, specifically its workflow and screen model rather than its visual style. The target game is Neverwinter Nights 1 Enhanced Edition, with local game installs available at `C:\Program Files (x86)\Steam\steamapps\common\Neverwinter Nights` and `C:\Users\pzhly\Documents\Neverwinter Nights`.

The planner targets the Puerta de Baldur server. Known documentation sources include the public forum threads for domains, spells, feats, and class revisions, the character rules page, and other module-feature threads such as prestige classes and skills. Some of these sources appear to have been updated at different times, so data collection should prefer authoritative local assets when possible and treat forum pages as rule references rather than perfect machine-readable truth.

Character creation and progression must model server-specific restrictions, not only base NWN behavior. Confirmed examples already in scope include the level-16 target cap for the initial planner, multiclass progression constraints, heavy-armor tumble limitations, and explicit class combination exceptions from the server's character rules.

The product is intended first as a personal planning tool and second as a way to pass finished builds to third parties. That means sharing fidelity matters as much as on-screen usability: a shared build must reproduce the same decisions and validation state on another machine.

Phase 1 locked the compiler-first contract layer: canonical IDs, public-safe dataset manifests, repo-scoped override registry inputs, and fail-closed legality outcomes now exist as reviewed TypeScript and JSON contracts before extractor or UI-heavy work begins.

## Constraints

- **Platform**: Static web app only — must build into HTML/CSS/JS assets that can be hosted on GitHub Pages.
- **Reference UX**: Match NWN2DB flow and main planner screens — same mental model, but not the same aesthetic.
- **Visual Direction**: NWN1-inspired look and feel — the UI should feel native to NWN1 rather than generic web tooling.
- **Language**: Spanish-first product surface — interface, custom content names, and shared build presentation should prioritize Spanish.
- **Rules Fidelity**: Strict validation — illegal server builds must be blocked, not merely warned about.
- **Game Scope**: Neverwinter Nights 1 Enhanced Edition — data model and terminology must align with NWN1 EE, not NWN2.
- **Server Scope**: Puerta de Baldur rules and custom content — planner must support custom domains, feats, spells, classes, and other server-specific logic.
- **Level Range**: 1 to 20 — extended from original 1-16 in Phase 12.6 (UAT-2026-04-20 P6).
- **Sharing**: Must support both URL-based sharing and JSON import/export — both are required for the intended workflow.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Build a static SPA instead of PHP/server-rendered app | Deployment must work locally first and later on GitHub Pages with no backend | — Pending |
| Use NWN2DB as the workflow reference | The desired user experience is explicit: same flow and screens as the existing builder | — Pending |
| Enforce Puerta de Baldur legality strictly | The planner's main value is trustworthy builds, not approximate drafts | — Pending |
| Limit initial scope to the planner only | The user wants a character planner, not a broader encyclopedia product in v1 | — Pending |
| Support both shareable URLs and JSON files | The tool is for personal planning plus handing builds to other players | — Pending |
| Use an NWN1 visual identity instead of copying NWN2DB styling | UX parity is required, but the product should feel like NWN1 | — Pending |
| Make the product Spanish-first | The target server and its custom gameplay vocabulary are Spanish-speaking | — Pending |
| Use kind-prefixed stable canonical IDs instead of localized display labels | Shared builds, manifests, and validation need language-agnostic identifiers that do not drift with Spanish naming | Adopted in Phase 1 |
| Resolve mechanical truth as manual override > Puerta snapshot > base-game, with forum material preserved as evidence-only | Runtime legality must fail closed and never silently promote forum prose into trusted data | Adopted in Phase 1 |
| Reject absolute machine-local paths from manifests and override payloads | Published planner datasets must stay public-safe and portable across machines | Adopted in Phase 1 |
| Keep missing-source and mechanically conflicting rules blocked by default | Illegal or unverifiable Puerta rules must never appear legal in the planner | Adopted in Phase 1 |
| Build the planner shell as a dedicated `apps/planner` SPA with stable routed sections | The shell needs one persistent frame and deep-linkable section entries before feature phases start filling screens | Adopted in Phase 2 |
| Ship visible shell copy in Spanish from the first frontend pass | Spanish-first framing is a product requirement, not later polish | Adopted in Phase 2 |
| Encode the NWN1 shell identity through reusable fonts and CSS tokens instead of generic utility styling | The product must feel intentional and distinct without copying NWN2DB's skin | Adopted in Phase 2 |
| Keep Phase 3 legality in pure rules-engine helpers projected through selectors | The routed origin board, attributes board, and summary panel need one consistent legality source instead of duplicated JSX conditionals | Adopted in Phase 3 |
| Gate the attribute board behind a coherent origin and expose budget feedback inline | Players should see server-facing restrictions before later progression screens consume invalid foundation state | Adopted in Phase 3 |
| Keep `Construcción` as one screen with the origin summarized above the progression editor | The locked UX decision was one Build route, but Phase 4 still needed inline origin editing and progression ownership in the same place | Adopted in Phase 4 |
| Preserve downstream levels after upstream edits and project repair state instead of truncating progression | Players should not lose later planning work when revisiting an earlier class choice | Adopted in Phase 4 |
| Share progression severity through pure legality and revalidation helpers | The rail, active sheet, summary strip, and shell summary must not drift on blocked versus invalid states | Adopted in Phase 4 |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `$gsd-transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `$gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check -> still the right priority?
3. Audit Out of Scope -> reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-26 after v1.0 milestone close*
