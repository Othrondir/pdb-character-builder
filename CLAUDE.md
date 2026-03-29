<!-- GSD:project-start source:PROJECT.md -->
## Project

**NWN 1 Character Builder**

A static web-based character planner for Neverwinter Nights 1 Enhanced Edition, tailored to the Puerta de Baldur server rules and custom content. It mirrors the workflow and main screens of the NWN2DB builder, but with a visual identity inspired by NWN1 and a deployment model that works as a GitHub-rendered site with no backend.

The planner is primarily for personal use, but it must also make it easy to hand builds to other players as a preconfigured character sheet via shareable links and importable/exportable files. The product should be Spanish-first because the target server, its custom feats, and its rules material are in Spanish.

**Core Value:** A player can build a Puerta de Baldur character from level 1 to 16 with strict server-valid validation and share that exact build reliably.

### Constraints

- **Platform**: Static web app only — must build into HTML/CSS/JS assets that can be hosted on GitHub Pages.
- **Reference UX**: Match NWN2DB flow and main planner screens — same mental model, but not the same aesthetic.
- **Visual Direction**: NWN1-inspired look and feel — the UI should feel native to NWN1 rather than generic web tooling.
- **Language**: Spanish-first product surface — interface, custom content names, and shared build presentation should prioritize Spanish.
- **Rules Fidelity**: Strict validation — illegal server builds must be blocked, not merely warned about.
- **Game Scope**: Neverwinter Nights 1 Enhanced Edition — data model and terminology must align with NWN1 EE, not NWN2.
- **Server Scope**: Puerta de Baldur rules and custom content — planner must support custom domains, feats, spells, classes, and other server-specific logic.
- **Initial Level Range**: 1 to 16 — the first shipped planner targets the current agreed progression range.
- **Sharing**: Must support both URL-based sharing and JSON import/export — both are required for the intended workflow.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
| Layer | Technology | Version | Confidence | Why |
|---|---|---:|---|---|
| Dev runtime | Node.js | 24.x LTS | MEDIUM | Best greenfield baseline in March 2026: Active LTS, works with current web tooling, and avoids starting a new project on a maintenance-line runtime. |
| Package manager | pnpm | 10.x | MEDIUM | Best fit for a two-package workspace (`app` + `extractor`) with fast installs and clean lockfile behavior. |
| Language | TypeScript | 5.9.2 | HIGH | Strict typing matters here more than usual: classes, feats, spell progression, import/export schemas, and server exceptions all benefit from exhaustive discriminated unions and compile-time checks. |
| SPA framework | React | 19.2.3 | HIGH | The planner is a dense, stateful, desktop-like UI. React still has the safest long-term ecosystem for this shape of app, especially with route/state/testing support. |
| DOM renderer | react-dom | 19.2.3 | HIGH | Required with React 19.2.3; stable baseline. |
| Build tool | Vite | 8.0.3 | HIGH | Fastest path to a static bundle, simple GitHub Pages deployment, zero server assumptions, and clean integration with React and test tooling. |
| React build plugin | @vitejs/plugin-react | 5.0.2 | HIGH | Official Vite React plugin; use the default path, not a custom Babel stack. |
| Routing + URL state | @tanstack/react-router | 1.147.0 | HIGH | Best fit for a builder that treats the URL as part of the product surface. It gives typed search params, validation hooks, and custom serialization for shared builds. |
| URL schema adapter | @tanstack/zod-adapter | 1.147.0 | HIGH | Pairs cleanly with TanStack Router so invalid shared URLs fail closed instead of partially mutating planner state. |
| App state | zustand | 5.0.10 | HIGH | Use a small external store for planner state and derived selectors, while keeping the actual rules engine as pure framework-agnostic functions. Redux is unnecessary here. |
| Boundary validation | zod | 4.3.5 | HIGH | Use Zod only at boundaries: URL payloads, JSON import/export, local persisted saves, and generated rules snapshots. Do not use it as the core rules engine. |
| Local persistence | dexie | 4.2.1 | HIGH | IndexedDB is the right runtime persistence model for a static local-first planner. Dexie is the safest thin layer over browser IndexedDB. |
| URL payload compression | fflate | 0.8.2 | MEDIUM | Good tradeoff for client-side share URLs: small bundle, fast compression, no backend dependency. Pair with base64url encoding and a hard length budget. |
| Offline shell | vite-plugin-pwa | 1.0.3 | MEDIUM | Correct way to add offline asset caching later without leaving the static-hosting model. Good fit for GitHub Pages, but not phase-1 critical. |
| Rule/unit testing | Vitest | 4.0.16 | MEDIUM | Best match for a Vite TypeScript codebase. Use it heavily on the rules engine and extractor normalization layer. |
| Browser E2E | @playwright/test | 1.58.0 | HIGH | Required to lock down the dangerous flows: level progression, strict validation, shared URLs, and JSON import/export round-trips. |
| `nwsync` DB access | better-sqlite3 | 12.2.0 | HIGH | Best current build-time SQLite access for Node. Stable and production-proven; better choice than Node's still-evolving built-in SQLite API. |
| NWN asset extraction | neverwinter.nim CLI | 2.1.2 | HIGH | Best source-of-truth extractor for NWN EE assets. It is used in NWN EE development, handles resman/BIF/2DA/TLK/NWSync workflows, and avoids writing your own fragile Aurora parser. |
## Source-of-Truth Recommendation
## Prescriptive Shape
- `apps/planner`: React SPA, static output only.
- `packages/rules-engine`: pure TypeScript domain model and validation engine with no React imports.
- `packages/data-extractor`: Node CLI that reads `nwsync` SQLite metadata, calls `neverwinter.nim` utilities for BIF/2DA/TLK extraction, and emits normalized JSON snapshots.
## GitHub Pages / Local-First Notes
- Keep v1 on a single deployable SPA entrypoint.
- Put shared build state in validated search params, not in deep path routing.
- If you later introduce multiple page paths on GitHub Pages, prefer hash history over rewrite-dependent browser history.
- Save drafts and presets locally in IndexedDB; reserve JSON export/import for portable artifacts and URL sharing for lightweight handoff.
- Impose a URL size budget. If a compressed build exceeds it, fall back to JSON export rather than generating brittle long links.
## What To Build With This Stack
- Pure TypeScript functions over normalized data.
- Deterministic validation output: `valid`, `errors[]`, `warnings[]`, `derivedStats`, `allowedChoices`.
- No React hooks, no browser APIs, no mutable singleton state in the validation core.
- Versioned JSON document with a compact but readable schema.
- Zod-validated on import before touching app state.
- Include `plannerVersion`, `rulesetVersion`, and `buildEncodingVersion`.
- Serialize only the minimum build payload.
- Compress with `fflate`, encode with base64url, validate with Zod on decode.
- Use stable integer IDs from the generated rules snapshot, not display names.
## What Not To Use
| Do Not Use | Why |
|---|---|
| Next.js, Nuxt, Remix, Astro SSR/SSG stacks | Wrong deployment model. They add server or filesystem-routing assumptions you do not need for a static planner. |
| TanStack Query / React Query for core data | There is no backend data-fetch problem in v1. The rules dataset is static and local. |
| Redux Toolkit | Too much ceremony for a local deterministic planner when Zustand + pure domain functions is enough. |
| `node:sqlite` as the extractor database layer | Current Node docs still mark it `Stability: 1.1 - Active development`. For this project, use `better-sqlite3` instead. |
| Browser-time scraping or parsing of Puerta forum pages | Fragile, slow, and the wrong source-of-truth boundary. Convert forum rules into curated override files during extraction. |
| A custom TypeScript BIF/KEY/TLK parser in v1 | Avoid spending roadmap time reimplementing Aurora tooling when `neverwinter.nim` already covers the hard part. |
| Shipping raw Beamdog UI art as a default strategy | Mechanical data extraction is justified; public redistribution of game UI assets needs separate verification. Use NWN1-inspired styling unless asset rights are confirmed. |
## Installation Baseline
# external binary, not npm
# install neverwinter.nim 2.1.2 and put its CLI tools on PATH
## Confidence Notes
| Area | Level | Notes |
|---|---|---|
| Browser stack | HIGH | Strong official-source coverage and standard static-SPA fit. |
| URL sharing approach | HIGH | TanStack Router supports custom search serialization; the remaining risk is URL-length discipline, not tooling capability. |
| Local-first persistence | HIGH | IndexedDB + Dexie is the normal browser-native answer for static apps. |
| NWN extraction toolchain | HIGH | `neverwinter.nim` is the strongest current source-backed recommendation for NWN EE asset/NWSync handling. |
| Offline/PWA layer | MEDIUM | Strong tooling, but it should follow core planner correctness rather than lead it. |
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

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
