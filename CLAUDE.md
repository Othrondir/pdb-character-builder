<!-- GSD:project-start source:PROJECT.md -->
## Project

**NWN 1 Character Builder**

Static web character planner for Neverwinter Nights 1 Enhanced Edition, tailored to Puerta de Baldur server rules + custom content. Mirrors NWN2DB builder workflow/screens, with NWN1-inspired visuals, deploys as GitHub-rendered site, no backend.

Primarily personal use. Must also hand builds to other players as preconfigured sheets via shareable links + importable/exportable files. Spanish-first: target server, custom feats, rules material all Spanish.

**Core Value:** Player builds Puerta de Baldur character level 1-20 with strict server-valid validation, shares exact build reliably.

### Constraints

- **Platform**: Static web app only — builds to HTML/CSS/JS assets hostable on GitHub Pages.
- **Reference UX**: Match NWN2DB flow + main planner screens — same mental model, different aesthetic.
- **Visual Direction**: NWN1-inspired — UI feels native to NWN1, not generic web tooling.
- **Language**: Spanish-first surface — interface, custom content names, shared build presentation prioritize Spanish.
- **Rules Fidelity**: Strict validation — illegal server builds blocked, not warned.
- **Game Scope**: Neverwinter Nights 1 Enhanced Edition — data model + terminology align with NWN1 EE, not NWN2.
- **Server Scope**: Puerta de Baldur rules + custom content — support custom domains, feats, spells, classes, server-specific logic.
- **Level Range**: 1-20 — extended from original 1-16 per UAT-2026-04-20 P6.
- **Sharing**: URL-based sharing + JSON import/export — both required.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
| Layer | Technology | Version | Confidence | Why |
|---|---|---:|---|---|
| Dev runtime | Node.js | 24.x LTS | MEDIUM | Best greenfield baseline March 2026: Active LTS, works with current web tooling, avoids maintenance-line runtime. |
| Package manager | pnpm | 10.x | MEDIUM | Best fit for two-package workspace (`app` + `extractor`): fast installs, clean lockfile. |
| Language | TypeScript | 5.9.2 | HIGH | Strict typing critical: classes, feats, spell progression, import/export schemas, server exceptions benefit from exhaustive discriminated unions + compile-time checks. |
| SPA framework | React | 19.2.3 | HIGH | Planner is dense, stateful, desktop-like UI. React has safest long-term ecosystem for this shape, with route/state/testing support. |
| DOM renderer | react-dom | 19.2.3 | HIGH | Required with React 19.2.3; stable baseline. |
| Build tool | Vite | 8.0.3 | HIGH | Fastest path to static bundle, simple GitHub Pages deployment, zero server assumptions, clean React + test tooling integration. |
| React build plugin | @vitejs/plugin-react | 5.0.2 | HIGH | Official Vite React plugin; use default path, not custom Babel stack. |
| Routing + URL state | @tanstack/react-router | 1.147.0 | HIGH | Best fit for builder treating URL as product surface. Gives typed search params, validation hooks, custom serialization for shared builds. |
| URL schema adapter | @tanstack/zod-adapter | 1.147.0 | HIGH | Pairs with TanStack Router so invalid shared URLs fail closed, not partially mutate planner state. |
| App state | zustand | 5.0.10 | HIGH | Small external store for planner state + derived selectors; keep rules engine as pure framework-agnostic functions. Redux unnecessary. |
| Boundary validation | zod | 4.3.5 | HIGH | Zod only at boundaries: URL payloads, JSON import/export, local persisted saves, generated rules snapshots. Not core rules engine. |
| Local persistence | dexie | 4.2.1 | HIGH | IndexedDB is right runtime persistence for static local-first planner. Dexie is safest thin layer over browser IndexedDB. |
| URL payload compression | fflate | 0.8.2 | MEDIUM | Good tradeoff for client-side share URLs: small bundle, fast compression, no backend. Pair with base64url + hard length budget. |
| Offline shell | vite-plugin-pwa | 1.0.3 | MEDIUM | Right way to add offline asset caching later without leaving static hosting. Good for GitHub Pages, not phase-1 critical. |
| Rule/unit testing | Vitest | 4.0.16 | MEDIUM | Best match for Vite TypeScript codebase. Use heavily on rules engine + extractor normalization. |
| Browser E2E | @playwright/test | 1.58.0 | HIGH | Required to lock down dangerous flows: level progression, strict validation, shared URLs, JSON import/export round-trips. |
| `nwsync` DB access | better-sqlite3 | 12.2.0 | HIGH | Best current build-time SQLite for Node. Stable, production-proven; better than Node's evolving built-in SQLite. |
| NWN asset extraction | neverwinter.nim CLI | 2.1.2 | HIGH | Best source-of-truth extractor for NWN EE assets. Used in NWN EE dev, handles resman/BIF/2DA/TLK/NWSync, avoids fragile custom Aurora parser. |
## Source-of-Truth Recommendation
## Prescriptive Shape
- `apps/planner`: React SPA, static output only.
- `packages/rules-engine`: pure TypeScript domain model + validation engine, no React imports.
- `packages/data-extractor`: Node CLI reading `nwsync` SQLite metadata, calling `neverwinter.nim` utilities for BIF/2DA/TLK extraction, emits normalized JSON snapshots.
## GitHub Pages / Local-First Notes
- Keep v1 on single deployable SPA entrypoint.
- Shared build state in validated search params, not deep path routing.
- If multiple page paths on GitHub Pages later, prefer hash history over rewrite-dependent browser history.
- Save drafts + presets locally in IndexedDB; reserve JSON export/import for portable artifacts, URL sharing for lightweight handoff.
- Impose URL size budget. If compressed build exceeds it, fall back to JSON export, not brittle long links.
## What To Build With This Stack
- Pure TypeScript functions over normalized data.
- Deterministic validation output: `valid`, `errors[]`, `warnings[]`, `derivedStats`, `allowedChoices`.
- No React hooks, no browser APIs, no mutable singleton state in validation core.
- Versioned JSON document, compact but readable schema.
- Zod-validated on import before touching app state.
- Include `plannerVersion`, `rulesetVersion`, `buildEncodingVersion`.
- Serialize only minimum build payload.
- Compress with `fflate`, encode base64url, validate with Zod on decode.
- Use stable integer IDs from generated rules snapshot, not display names.
## What Not To Use
| Do Not Use | Why |
|---|---|
| Next.js, Nuxt, Remix, Astro SSR/SSG stacks | Wrong deployment model. Add server or filesystem-routing assumptions unneeded for static planner. |
| TanStack Query / React Query for core data | No backend data-fetch problem in v1. Rules dataset static + local. |
| Redux Toolkit | Too much ceremony for local deterministic planner when Zustand + pure domain functions enough. |
| `node:sqlite` as extractor DB layer | Node docs mark `Stability: 1.1 - Active development`. Use `better-sqlite3` instead. |
| Browser-time scraping/parsing of Puerta forum pages | Fragile, slow, wrong source-of-truth boundary. Convert forum rules into curated override files during extraction. |
| Custom TypeScript BIF/KEY/TLK parser in v1 | Avoid reimplementing Aurora tooling when `neverwinter.nim` covers hard part. |
| Shipping raw Beamdog UI art as default | Mechanical data extraction justified; public redistribution of game UI assets needs separate verification. Use NWN1-inspired styling unless asset rights confirmed. |
## Installation Baseline
# external binary, not npm
# install neverwinter.nim 2.1.2 and put its CLI tools on PATH
## Confidence Notes
| Area | Level | Notes |
|---|---|---|
| Browser stack | HIGH | Strong official-source coverage, standard static-SPA fit. |
| URL sharing approach | HIGH | TanStack Router supports custom search serialization; remaining risk is URL-length discipline, not tooling capability. |
| Local-first persistence | HIGH | IndexedDB + Dexie is normal browser-native answer for static apps. |
| NWN extraction toolchain | HIGH | `neverwinter.nim` is strongest source-backed recommendation for NWN EE asset/NWSync handling. |
| Offline/PWA layer | MEDIUM | Strong tooling, but follow core planner correctness, not lead it. |
## Sources
- Vite docs (`v8.0.2` docs page, Node requirement `20.19+ / 22.12+`): https://vite.dev/guide/
- Vite GitHub releases (`v8.0.3`, 2026-03-26): https://github.com/vitejs/vite/releases
- React GitHub releases (`19.2.3`, 2025-12-11): https://github.com/facebook/react/releases
- TypeScript GitHub releases (`5.9.2`, stable 2025-07-31): https://github.com/microsoft/TypeScript/releases
- TanStack Router custom search param serialization docs: https://tanstack.com/router/latest/docs/guide/custom-search-param-serialization
- TanStack Router GitHub releases (`1.147.0`, includes `@tanstack/react-router` and `@tanstack/zod-adapter`): https://github.com/TanStack/router/releases
- Zustand GitHub releases (`5.0.10`): https://github.com/pmndrs/zustand/releases
- Zod GitHub releases (`4.3.5`): https://github.com/colinhacks/zod/releases
- Dexie GitHub releases (`4.2.1`): https://github.com/dexie/Dexie.js/releases
- `vite-plugin-pwa` npm package (`1.0.3`): https://www.npmjs.com/package/vite-plugin-pwa
- `better-sqlite3` npm package (`12.2.0`): https://www.npmjs.com/package/better-sqlite3
- Node.js release schedule (`24.x` Active LTS, `22.x` Maintenance LTS): https://github.com/nodejs/Release
- Node.js SQLite docs (`node:sqlite` stability 1.1 active development): https://nodejs.org/download/release/v24.2.0/docs/api/sqlite.html
- Playwright release notes (`1.58`): https://playwright.dev/docs/release-notes
- Vitest GitHub releases (`4.0.16`): https://github.com/vitest-dev/vitest/releases
- neverwinter.nim README and tool list: https://github.com/niv/neverwinter.nim
- neverwinter.nim releases (`2.1.2`): https://github.com/niv/neverwinter.nim/releases
- Radoub.Formats format coverage reference for Aurora formats: https://github-wiki-see.page/m/LordOfMyatar/Radoub/wiki/Radoub-Formats
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Populate as patterns emerge.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing codebase patterns.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before Edit/Write/other file-changing tools, start work via GSD command so planning artifacts + execution context stay in sync.

Entry points:
- `/gsd:quick` — small fixes, doc updates, ad-hoc tasks
- `/gsd:debug` — investigation + bug fixing
- `/gsd:execute-phase` — planned phase work

No direct repo edits outside GSD workflow unless user explicitly bypasses.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate developer profile.
> Section managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
