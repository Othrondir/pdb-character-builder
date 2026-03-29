## Project

**NWN 1 Character Builder**

A static web-based character planner for Neverwinter Nights 1 Enhanced Edition, tailored to the Puerta de Baldur server rules and custom content. It mirrors the workflow and main screens of the NWN2DB builder, but with a visual identity inspired by NWN1 and a deployment model that works as a GitHub-rendered site with no backend.

The planner is primarily for personal use, but it must also make it easy to hand builds to other players as a preconfigured character sheet via shareable links and importable/exportable files. The product is Spanish-first because the target server, its custom feats, and its rules material are in Spanish.

**Core Value:** A player can build a Puerta de Baldur character from level 1 to 16 with strict server-valid validation and share that exact build reliably.

### Constraints

- **Platform**: Static web app only; must build into HTML, CSS, and JS assets that can be hosted on GitHub Pages.
- **Reference UX**: Match NWN2DB flow and main planner screens, but not its visual skin.
- **Visual Direction**: NWN1-inspired look and feel; avoid generic web-tool styling.
- **Language**: Spanish-first UI, custom content labels, rules text, and shared build presentation.
- **Rules Fidelity**: Illegal server builds must be blocked, not merely warned about.
- **Game Scope**: Neverwinter Nights 1 Enhanced Edition, not NWN2.
- **Server Scope**: Puerta de Baldur custom rules and content.
- **Initial Level Range**: 1 to 16.
- **Sharing**: Must support both URL-based sharing and JSON import/export.

## Technology Stack

### Recommended Stack

- **Runtime**: Node.js 24.x LTS
- **Package manager**: pnpm 10.x
- **Language**: TypeScript 5.9.x
- **SPA**: React 19.2.x + react-dom 19.2.x
- **Build tool**: Vite 8.0.x + `@vitejs/plugin-react`
- **Routing / URL state**: `@tanstack/react-router` + `@tanstack/zod-adapter`
- **State**: Zustand 5.x
- **Boundary validation**: Zod 4.x
- **Local persistence**: Dexie 4.x
- **Share payload compression**: `fflate`
- **Testing**: Vitest 4.x + Playwright 1.58.x
- **SQLite access**: `better-sqlite3`
- **NWN extraction**: `neverwinter.nim` CLI

### Source-of-Truth Shape

- `apps/planner`: static React SPA
- `packages/rules-engine`: pure TypeScript legality and derivation engine
- `packages/data-extractor`: build-time compiler that reads base NWN EE data, local Puerta `nwsync`, and curated manual overrides, then emits versioned JSON datasets

### Important Rules

- The browser runtime must consume only compiled datasets; do not parse raw game assets in the browser.
- Share URLs and JSON must carry version identifiers such as `schemaVersion`, `datasetId`, and encoding version.
- Forum posts are curated override inputs, not runtime truth.
- Do not ship raw Beamdog UI assets publicly unless redistribution rights are confirmed.

## Workflow

Before using file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Preferred entry points:

- `/gsd:quick` for small fixes and doc updates
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless explicitly asked to bypass it.
