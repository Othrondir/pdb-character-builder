# NWN 1 Character Builder

## What This Is

A static web-based character planner for Neverwinter Nights 1 Enhanced Edition, tailored to the Puerta de Baldur server rules and custom content. It mirrors the workflow and main screens of the NWN2DB builder, but with a visual identity inspired by NWN1 and a deployment model that works as a GitHub-rendered site with no backend.

The planner is primarily for personal use, but it must also make it easy to hand builds to other players as a preconfigured character sheet via shareable links and importable/exportable files.

## Core Value

A player can build a Puerta de Baldur character from level 1 to 16 with strict server-valid validation and share that exact build reliably.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can plan a character from level 1 to level 16 using Puerta de Baldur rules.
- [ ] User can choose race, subrace, alignment, deity, classes, prestige classes, feats, skills, domains, spells, and level progression.
- [ ] User can use a UI flow equivalent to the NWN2DB builder's main planner screens.
- [ ] User can only create legal builds according to the server's enforced rules and exceptions.
- [ ] User can save, load, import, export, and share builds through both files and URLs.

### Out of Scope

- Live integration with the Puerta de Baldur server or game client — this is a standalone planner for now.
- PHP or any server-rendered backend — the site must compile to static assets suitable for GitHub Pages.
- Public hosting, accounts, or cloud persistence in v1 — the first target is local use with portable builds.

## Context

The reference product is `https://nwn2db.com/builder.php`, specifically its workflow and screen model rather than its visual style. The target game is Neverwinter Nights 1 Enhanced Edition, with local game installs available at `C:\Program Files (x86)\Steam\steamapps\common\Neverwinter Nights` and `C:\Users\pzhly\Documents\Neverwinter Nights`.

The planner targets the Puerta de Baldur server. Known documentation sources include the public forum threads for domains, spells, feats, and class revisions, the character rules page, and other module-feature threads such as prestige classes and skills. Some of these sources appear to have been updated at different times, so data collection should prefer authoritative local assets when possible and treat forum pages as rule references rather than perfect machine-readable truth.

Character creation and progression must model server-specific restrictions, not only base NWN behavior. Confirmed examples already in scope include the level-16 target cap for the initial planner, multiclass progression constraints, heavy-armor tumble limitations, and explicit class combination exceptions from the server's character rules.

The product is intended first as a personal planning tool and second as a way to pass finished builds to third parties. That means sharing fidelity matters as much as on-screen usability: a shared build must reproduce the same decisions and validation state on another machine.

## Constraints

- **Platform**: Static web app only — must build into HTML/CSS/JS assets that can be hosted on GitHub Pages.
- **Reference UX**: Match NWN2DB flow and main planner screens — same mental model, but not the same aesthetic.
- **Visual Direction**: NWN1-inspired look and feel — the UI should feel native to NWN1 rather than generic web tooling.
- **Rules Fidelity**: Strict validation — illegal server builds must be blocked, not merely warned about.
- **Game Scope**: Neverwinter Nights 1 Enhanced Edition — data model and terminology must align with NWN1 EE, not NWN2.
- **Server Scope**: Puerta de Baldur rules and custom content — planner must support custom domains, feats, spells, classes, and other server-specific logic.
- **Initial Level Range**: 1 to 16 — the first shipped planner targets the current agreed progression range.
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
*Last updated: 2026-03-29 after initialization*
