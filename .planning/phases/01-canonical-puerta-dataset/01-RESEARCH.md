# Phase 1: Canonical Puerta Dataset - Research

**Researched:** 2026-03-29
**Domain:** Canonical dataset contract, source precedence, and fail-closed validation boundary for Puerta de Baldur
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Canonical rules precedence is `local Puerta snapshot + curated manual overrides > older forum posts or stale public documentation`.
- **D-02:** Forum material is a fallback and reconciliation aid, not a runtime or compiler source of truth.
- **D-03:** If a rule, feat, class, spell, domain, race, or exception cannot be verified confidently, the planner must mark it as `not verifiable / blocked`.
- **D-04:** The planner must never present an ambiguous rule as valid or silently fall back to base NWN legality.
- **D-05:** The repo will version normalized JSON datasets, a dataset manifest, and curated override files.
- **D-06:** The repo will not commit or publish raw game assets, raw extracted Beamdog assets, or other crude payloads from the local installation or `nwsync` snapshot.
- **D-07:** Dataset refreshes are manual and explicitly versioned.
- **D-08:** The toolchain must not regenerate or replace the active dataset silently when local game or `nwsync` data changes.

### Claude's Discretion
- Exact manifest schema fields beyond the required versioning and provenance identifiers.
- Exact override file layout and naming conventions.
- Exact hashing, diffing, and dataset build pipeline details, as long as they preserve the decisions above.

### Deferred Ideas (OUT OF SCOPE)
None - discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VALI-04 | El planner evita marcar una build como valida cuando falten datos o exista conflicto entre fuentes de reglas. | Fail-closed source precedence, explicit `blocked` status, conflict records, provenance fields, and validation gates that refuse silent fallback. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Ship a static web app only; runtime output must remain HTML, CSS, and JS suitable for GitHub Pages.
- Keep the browser boundary strict: runtime consumes compiled datasets only and must not parse raw game assets or raw `nwsync` databases.
- Preserve Spanish-first data and presentation, including custom Puerta labels and rules text where available.
- Block illegal or unverified builds instead of warning only.
- Keep scope to NWN1 EE, Puerta de Baldur, and level range 1 to 16.
- Share URLs and JSON must carry dataset identity fields such as `schemaVersion`, `datasetId`, and encoding version.
- Treat forum posts as curated override inputs, not runtime truth.
- Do not publish raw Beamdog UI assets unless redistribution rights are confirmed.
- Preferred workspace shape remains `apps/planner`, `packages/rules-engine`, and `packages/data-extractor`.
- Recommended implementation stack remains Node.js 24.x LTS, pnpm 10.x, TypeScript 5.9.x, Zod 4.x, Dexie 4.x, better-sqlite3, Vitest 4.x, Playwright 1.58.x, and `neverwinter.nim`.

## Summary

Phase 1 should freeze a compiler-first contract, not just describe data sources. Local inspection confirms the three concrete source layers that matter: base NWN EE assets from `data/nwn_base.key` and `data/base_2da.bif`, language TLKs including Spanish `dialog.tlk`, and a real Puerta `nwsync` snapshot composed of `nwsyncmeta.sqlite3` plus a 15.2 GB `nwsyncdata_0.sqlite3`. The Puerta manifest row points to `http://nwsync.puertadebaldur.com`, advertises `includes_client_contents = 1`, and indexes named resources including `classes`, `domains`, `feat`, `racialtypes`, `skills`, `spells`, and `pb_tlk_v6`.

The key planning decision is to separate data truth from evidence truth. Runtime data truth should be `manual override entry > Puerta snapshot resource > base NWN EE resource`. Evidence truth should be `override evidence > forum or rules post > stale public docs`, but evidence never becomes runtime truth unless it is captured in the override registry. That distinction prevents the planner from mixing old forum claims with newer synced assets while still allowing script-only server rules to be modeled.

This phase should produce a namespaced canonical ID scheme, a public-safe manifest schema, a diff-friendly override registry, and a fail-closed blocked or conflict model. If a rules decision affects legality and cannot be proven from the snapshot plus a curated override entry, the compiler should emit an explicit blocked record and the runtime should never surface the result as valid.

**Primary recommendation:** Treat Phase 1 as a contract-definition phase with executable schemas and fixtures, not as extraction code or UI work.

## Standard Stack

### Core

| Library / Tool | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js | 24.x LTS | Extractor and rules workspace runtime | Project baseline; matches the approved stack and future workspace tooling. |
| TypeScript | 5.9.x | Canonical schema types and rule contract types | Required for exhaustive entity and validation modeling. |
| Zod | 4.x | Boundary validation for manifests, overrides, and generated artifacts | Best fit for fail-closed dataset parsing at build and runtime boundaries. |
| better-sqlite3 | 12.2.0 | Read `nwsyncmeta.sqlite3` and related metadata during extraction | Stable SQLite layer for Node build tools. |
| `neverwinter.nim` CLI | 2.1.2 | Read NWN EE assets and NWSync resources without hand-rolling parsers | Officially provides `nwn_resman_*`, `nwn_tlk`, `nwn_twoda`, and NWSync utilities. |
| Vitest | 4.0.16 | Contract and fixture tests for precedence, manifest, and blocked states | Fastest way to enforce fail-closed behavior before later UI work. |

### Supporting

| Library / Tool | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| pnpm | 10.x | Workspace package manager | Use once the repo is bootstrapped beyond planning docs. |
| sqlite3 CLI | 3.44.3 local | Ad hoc schema inspection and debugging | Useful for investigation; not the long-term extractor API. |
| Python | 3.13.12 local | Temporary local inspection of SQLite contents | Fine for research and fixtures; not the canonical extractor implementation. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `neverwinter.nim` | Hand-rolled TypeScript BIF/TLK/2DA/NWSync readers | Not acceptable in v1; too many format and resman edge cases. |
| `better-sqlite3` | `node:sqlite` | Current project research still favors `better-sqlite3` for stability. |
| Zod schemas | Untyped JSON contracts | Fails the phase goal because ambiguous or malformed artifacts can slip through. |

**Installation:**
```bash
pnpm add -D typescript@5.9.2 zod@4.3.5 better-sqlite3@12.2.0 vitest@4.0.16
# install neverwinter.nim 2.1.2 separately
# use nwn_resman_*, nwn_tlk, nwn_twoda, and nwn_nwsync_print
```

**Version verification:** Stack versions are inherited from `.planning/research/STACK.md`. This pass verified local availability instead: Node `22.20.0` is installed, `pnpm` is missing, and `neverwinter.nim` CLI binaries are not yet installed locally.

## Architecture Patterns

### Recommended Project Structure

```text
packages/
|-- data-extractor/
|   |-- src/
|   |   |-- contracts/          # zod + ts schemas for manifest, entities, overrides
|   |   |-- sources/
|   |   |   |-- base-game/      # nwn_base.key, base_2da.bif, dialog.tlk adapters
|   |   |   |-- puerta-nwsync/  # nwsyncmeta + nwsyncdata readers and resref mapping
|   |   |   `-- manual/         # override registry loader
|   |   |-- normalize/          # canonical entity builders and merge logic
|   |   |-- validate/           # conflict detection and fail-closed dataset checks
|   |   `-- emit/               # normalized JSON artifacts + manifest writer
|   `-- fixtures/               # minimal base/snapshot/override test fixtures
|-- rules-engine/
|   `-- src/contracts/          # runtime-facing dataset and blocked/conflict types
`-- overrides/
    |-- registry.json           # active entry index
    |-- rules/                  # per-rule mechanical overrides
    |-- text/                   # text-only overrides
    `-- blocked/                # unresolved or intentionally unsupported items
```

### Pattern 1: Source Boundary and Precedence

**What:** Build the dataset from three explicit layers and never collapse them mentally into "the data."

**Use this precedence for mechanical truth:**
1. `manual override entry`
2. `Puerta nwsync snapshot resource`
3. `base NWN EE resource`

**Use this precedence for evidence only:**
1. Override evidence already captured in the repo
2. Current server rule or forum post
3. Older or conflicting public documentation

**Concrete source boundaries:**
- **Base NWN EE assets:** `data/nwn_base.key`, `data/base_2da.bif`, and locale `lang/*/data/dialog.tlk`.
- **Puerta snapshot:** `nwsyncmeta.sqlite3` plus `nwsyncdata_0.sqlite3`; current manifest SHA is `cf6e8aad5751930e345266b84a3be31d9d67f3b1`.
- **Manual overrides:** repo-authored normalized deltas only; no copied raw forum pages, no raw scripts, no pasted asset dumps.
- **Published runtime artifacts:** normalized JSON, manifest JSON, override registry JSON, blocked/conflict JSON; never raw install assets or raw sqlite blobs.

**When to use:** Every canonical entity and every legality-sensitive rule.

**Anti-pattern to avoid:** Treating forum text as an equal peer to synced resources.

### Pattern 2: Canonical ID Strategy

**What:** Use stable namespaced IDs for runtime references, and keep raw source anchors separate.

**Recommended ID rules:**
- Use row-based engine identities when NWN legality depends on row index.
- Keep the ID small and deterministic: `kind:nativeId`.
- Add `sourceAnchors[]` for provenance instead of encoding provenance into the ID.
- Add `aliases[]` only for migrations, never for display names.

**Recommended formats:**
- `class:5`
- `feat:289`
- `spell:42`
- `skill:8`
- `race:6`
- `domain:17`
- `rule:heavy-armor-tumble-block`
- `conflict:feat:289`

**Recommended entity shape:**
```ts
type CanonicalId = `${EntityKind}:${string | number}`;

interface SourceAnchor {
  layer: 'base' | 'puerta-snapshot' | 'manual-override';
  resref?: string;
  restype?: number;
  rowIndex?: number;
  label?: string;
  strref?: number;
  manifestSha1?: string;
  evidenceId?: string;
}

interface CanonicalRecord {
  id: CanonicalId;
  kind: EntityKind;
  sourceAnchors: SourceAnchor[];
  aliases?: string[];
}
```

**When to use:** All runtime references, shared build payloads, and cross-table links.

**Anti-pattern to avoid:** Keying feats, spells, or domains by Spanish text or forum labels.

### Pattern 3: Public-Safe Manifest and Provenance

**What:** Emit one manifest per dataset snapshot that can be committed publicly without leaking machine-local paths.

**Required fields:**
- `schemaVersion`
- `datasetId`
- `datasetHash`
- `generatedAt`
- `defaultLocale`
- `supportedLocales`
- `levelCap`
- `precedencePolicy`
- `ambiguityPolicy`
- `sourceSummary`
- `artifactHashes`

**Recommended `sourceSummary` shape:**
```ts
interface DatasetManifest {
  schemaVersion: '1';
  datasetId: string;
  datasetHash: string;
  generatedAt: string;
  defaultLocale: 'es';
  supportedLocales: string[];
  levelCap: 16;
  precedencePolicy: {
    mechanics: ['manual-override', 'puerta-snapshot', 'base-game'];
    evidence: ['override-evidence', 'forum-doc', 'stale-doc'];
  };
  ambiguityPolicy: 'blocked';
  sourceSummary: {
    baseGame: {
      keyFile: 'data/nwn_base.key';
      mechanicalBif: 'data/base_2da.bif';
      locales: ['de', 'en', 'es', 'fr', 'it', 'pl'];
    };
    puertaSnapshot: {
      originUrl: 'http://nwsync.puertadebaldur.com';
      manifestSha1: string;
      manifestCreatedAt: string;
      includesClientContents: true;
      includesModuleContents: false;
      resourceCount: number;
      snapshotSerial?: string;
    };
    manualOverrides: {
      registryVersion: string;
      entryCount: number;
      registryHash: string;
    };
  };
  artifactHashes: Record<string, string>;
}
```

**Important constraint:** Do not commit absolute paths like `C:\Users\...` into the public manifest. Keep only repo-safe path hints and source identifiers.

### Pattern 4: Override Registry Shape

**What:** Keep one registry index plus one file per override entry so diffs stay reviewable.

**Recommended layout:**
```text
packages/overrides/
|-- registry.json
|-- rules/
|   |-- heavy-armor-tumble-block.json
|   `-- multiclass-exception-paladin-blackguard.json
|-- text/
|   `-- custom-domain-labels.json
`-- blocked/
    `-- unsupported-script-rule.json
```

**Recommended registry entry shape:**
```ts
interface OverrideRegistryEntry {
  id: string;
  kind: 'rule' | 'text' | 'conflict-resolution' | 'blocked-marker';
  targetIds: string[];
  operation:
    | 'replace-fields'
    | 'append-values'
    | 'suppress-record'
    | 'add-synthetic-rule'
    | 'mark-blocked';
  evidence: Array<{
    type: 'forum-post' | 'admin-note' | 'script-review' | 'manual-reconciliation';
    reference: string;
    capturedAt: string;
  }>;
  rationale: string;
  confidence: 'high' | 'medium' | 'low';
  appliesTo: {
    manifestSha1?: string[];
    datasetRange?: string;
  };
  reviewStatus: 'verified' | 'needs-review' | 'blocked';
  payloadFile: string;
}
```

**When to use:** Any rule or text change that is not directly reconstructable from base assets plus the Puerta snapshot.

**Anti-pattern to avoid:** Embedding manual overrides inline in generated entity JSON with no evidence trail.

### Pattern 5: Unsupported and Conflicting Rule Handling

**What:** Separate invalid builds from unverifiable builds. Both are non-valid, but only one is a rules violation.

**Recommended status model:**
```ts
type ValidationStatus = 'legal' | 'illegal' | 'blocked';

type BlockKind =
  | 'unsupported'
  | 'conflict'
  | 'missing-source'
  | 'not-verifiable';

interface ValidationOutcome {
  status: ValidationStatus;
  blockKind?: BlockKind;
  code: string;
  messageKey: string;
  evidence: SourceAnchor[];
  affectedIds: string[];
}
```

**Rules:**
- `illegal` means the rule is known and the build fails it.
- `blocked` means the planner cannot prove legality from canonical data.
- Any unresolved conflict on legality-critical fields must become `blocked`, not `legal`.
- Text-only conflicts can be emitted with a manifest warning if mechanical fields agree.
- The compiler should refuse to emit a "clean" dataset if unresolved legality-critical conflicts remain outside the blocked registry.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| NWN asset parsing | Custom TS parser for KEY, BIF, TLK, and NWSync blobs | `neverwinter.nim` CLI and resman tools | Aurora and NWSync formats are full of edge cases already solved upstream. |
| NWSync manifest reading | String or binary parsing of sqlite files | SQLite readers plus explicit manifest queries | `nwsyncmeta.sqlite3` already exposes the source graph cleanly. |
| Provenance | Comments inside generated JSON | Structured `sourceAnchors[]` and manifest `sourceSummary` | Planner and future migrations need machine-readable traceability. |
| Rule exceptions | Inline if-statements scattered across future UI code | Override registry plus blocked/conflict records | Keeps legality logic auditable and centralized. |
| Ambiguity handling | Silent fallback to base NWN legality | Explicit `blocked` outcomes | This is the core requirement behind `VALI-04`. |

**Key insight:** Phase 1 is mostly about refusing shortcuts. Every "temporary" shortcut here becomes silent rules drift later.

## Common Pitfalls

### Pitfall 1: Mixing runtime truth and evidence truth
**What goes wrong:** A forum statement wins over synced assets without an override entry, so the dataset reflects an undocumented hybrid ruleset.
**Why it happens:** The team treats "source" as one bucket instead of separating mechanical inputs from evidence.
**How to avoid:** Only base game, snapshot resources, and override files may feed runtime JSON. Forum or admin material must first become an override entry with evidence.
**Warning signs:** Generated records cannot explain why a field value came from a forum post.

### Pitfall 2: Leaking local machine details into public artifacts
**What goes wrong:** The manifest stores full local Windows paths or raw snapshot internals that should not be committed publicly.
**Why it happens:** Provenance is added late and copied from ad hoc scripts.
**How to avoid:** Use normalized path hints like `data/nwn_base.key` and public source identifiers like manifest SHA or origin URL.
**Warning signs:** `C:\Users\...` or `C:\Program Files...` appears in committed dataset JSON.

### Pitfall 3: Treating text conflicts as the same as mechanical conflicts
**What goes wrong:** The compiler blocks everything for a Spanish description mismatch, or worse, lets a prerequisite mismatch through because it was treated like text.
**Why it happens:** Conflict severity is not classified.
**How to avoid:** Separate mechanical fields from presentation fields in the canonical schema and only fail closed on legality-critical conflicts.
**Warning signs:** Every diff becomes either red-alert or ignored.

### Pitfall 4: Using display labels as entity identity
**What goes wrong:** A translated label change breaks saved references or creates duplicate entities.
**Why it happens:** Labels are easier to read than engine IDs, so they get reused as keys.
**How to avoid:** Use `kind:nativeId` canonical IDs and keep labels in locale bundles only.
**Warning signs:** The same feat exists twice because one source used English text and another Spanish text.

### Pitfall 5: Letting unsupported rules collapse into legal
**What goes wrong:** The planner appears trustworthy while actually guessing on missing Puerta exceptions.
**Why it happens:** Teams optimize for "usable now" instead of fail-closed correctness.
**How to avoid:** Require `blocked` results whenever a legality path cannot be proven.
**Warning signs:** A build becomes legal after removing an override entry or losing a source file.

## Code Examples

Verified patterns for this phase should stay small and strongly typed.

### Canonical Record With Provenance
```ts
export const canonicalRecordSchema = z.object({
  id: z.string().regex(/^[a-z-]+:[A-Za-z0-9._-]+$/),
  kind: z.enum(['class', 'feat', 'spell', 'skill', 'race', 'domain', 'rule']),
  sourceAnchors: z.array(
    z.object({
      layer: z.enum(['base', 'puerta-snapshot', 'manual-override']),
      resref: z.string().optional(),
      restype: z.number().int().optional(),
      rowIndex: z.number().int().optional(),
      label: z.string().optional(),
      strref: z.number().int().optional(),
      manifestSha1: z.string().optional(),
      evidenceId: z.string().optional(),
    }),
  ).min(1),
  aliases: z.array(z.string()).optional(),
});
```
Source: Project-specific recommendation based on locked decisions and local source inspection.

### Fail-Closed Resolution
```ts
function resolveLegality(input: {
  hasKnownRule: boolean;
  passesRule: boolean;
  hasConflict: boolean;
  hasMissingEvidence: boolean;
}): ValidationOutcome {
  if (input.hasConflict) {
    return {
      status: 'blocked',
      blockKind: 'conflict',
      code: 'RULE_CONFLICT',
      messageKey: 'validation.blocked.conflict',
      evidence: [],
      affectedIds: [],
    };
  }

  if (!input.hasKnownRule || input.hasMissingEvidence) {
    return {
      status: 'blocked',
      blockKind: 'not-verifiable',
      code: 'RULE_NOT_VERIFIABLE',
      messageKey: 'validation.blocked.notVerifiable',
      evidence: [],
      affectedIds: [],
    };
  }

  return input.passesRule
    ? {
        status: 'legal',
        code: 'RULE_OK',
        messageKey: 'validation.legal',
        evidence: [],
        affectedIds: [],
      }
    : {
        status: 'illegal',
        code: 'RULE_FAILED',
        messageKey: 'validation.illegal',
        evidence: [],
        affectedIds: [],
      };
}
```
Source: Project-specific recommendation aligned to `VALI-04` and Phase 1 success criteria.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Runtime reads raw assets or sqlite | Browser reads compiled JSON only | Locked before Phase 1 planning | Keeps GitHub Pages viable and datasets reproducible. |
| Forum pages treated as direct rule source | Forum pages become override evidence only | Locked in Phase 1 context | Prevents mixed-vintage rules truth. |
| Names or labels as IDs | Namespaced canonical IDs plus source anchors | Recommended for Plan `01-01` | Makes share payloads and migrations deterministic. |
| Silent fallback to base legality | `blocked` status for conflicts or missing proof | Required by `VALI-04` | Preserves planner trust even when support is incomplete. |
| One opaque generated dump | Manifest + normalized entities + override registry + blocked/conflict lists | Recommended for Plan `01-02` | Makes refreshes reviewable and future phases testable. |

**Deprecated or outdated:**
- Treating `nwsync` as optional evidence. Local inspection shows it is the primary Puerta source layer, not a side channel.
- Assuming a `nwn_2da` binary exists. The official `neverwinter.nim` README documents `nwn_twoda`.

## Recommended Plan Breakdown

| Plan | Scope | Must Decide | Exit Criteria |
|------|-------|-------------|---------------|
| `01-01` Freeze canonical schema, IDs, and source precedence | Canonical entity taxonomy, ID grammar, source anchors, precedence matrix, emitted artifact boundary | `kind:nativeId` strategy, mechanical vs evidence precedence, legality-critical field classification | A written schema contract exists for core entities plus a precedence table and fixture examples showing base vs snapshot vs override resolution. |
| `01-02` Define dataset manifest, provenance, and override registry | Public-safe manifest schema, artifact hash policy, override registry layout, per-entry evidence rules | Manifest field list, path sanitization rule, registry index shape, override entry schema | One manifest schema and one override registry schema are frozen, with example JSON and naming rules for per-entry files. |
| `01-03` Define unsupported or conflict handling for ambiguous rules | `legal` or `illegal` or `blocked` contract, block kinds, conflict severity model, compiler/runtime gates, test map | Whether unresolved legality conflicts fail emit or emit as blocked records, and where blocked lists live | Validation semantics are explicit enough that later rules-engine work cannot silently reclassify ambiguity as legal. |

**Recommended sequence:** `01-01` before `01-02`, and `01-02` before `01-03`. The blocked/conflict model depends on canonical IDs and provenance fields already being frozen.

## Open Questions

1. **How much of Puerta legality is still script-only?**
   - What we know: local snapshot resources cover core mechanical tables and a custom TLK-like resource.
   - What's unclear: which server restrictions still live only in script or admin policy.
   - Recommendation: treat every known script-only rule as an override candidate until proven extractable.

2. **Should `datasetId` be hash-first or semver-first?**
   - What we know: the manifest must include `schemaVersion`, `datasetId`, and `datasetHash`.
   - What's unclear: whether the human-facing identifier should be `puerta-ee-2026-03-29` or derived from manifest hash.
   - Recommendation: use a human-readable dataset version plus hash, for example `puerta-ee-2026-03-29+cf6e8aad`.

3. **How should `pb_tlk_v6` integrate with Spanish-first text bundles?**
   - What we know: the Puerta manifest references `pb_tlk_v6`, and the base game ships multiple locale TLKs including Spanish.
   - What's unclear: whether custom text resolution should overlay one server TLK over every locale or maintain separate text bundles later.
   - Recommendation: Phase 1 should only freeze the reference model, not final localization behavior; require `sourceAnchors` and locale metadata so later phases can refine text assembly safely.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Workspace tooling and extractor implementation | Partial | `22.20.0` | Upgrade to 24.x before implementation work. |
| pnpm | Planned monorepo package management | No | - | None recommended; install pnpm 10.x. |
| Python | Research-time sqlite inspection | Yes | `3.13.12` | sqlite3 CLI |
| sqlite3 CLI | Research-time sqlite inspection | Yes | `3.44.3` | Python `sqlite3` module |
| `neverwinter.nim` CLI | NWN asset and NWSync extraction | No | - | None for implementation; install before Phase 2 extraction work. |
| Base NWN EE install | Base mechanical source layer | Yes | observed locally | None |
| Puerta `nwsync` snapshot | Primary server overlay source layer | Yes | manifest `cf6e8aad5751930e345266b84a3be31d9d67f3b1`, serial `7532` | None |

**Missing dependencies with no fallback:**
- `pnpm`
- `neverwinter.nim` CLI

**Missing dependencies with fallback:**
- Node 24.x specifically. Current Node 22 can support some planning and scaffolding work, but it should be upgraded before implementing the extractor workspace.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None yet in repo; standardize on Vitest `4.0.16` for Phase 1 contract tests |
| Config file | none - Wave 0 |
| Quick run command | `pnpm vitest run packages/data-extractor/fixtures/phase1-contract.test.ts` |
| Full suite command | `pnpm vitest run` |

### Validation Gates

| Gate | Enforced In | What Must Fail Closed |
|------|-------------|-----------------------|
| Source gate | extractor source adapters | Missing base source, missing manifest identity, or unreadable override registry |
| Merge gate | canonical normalizer | Any legality-critical field conflict without an explicit override entry |
| Contract gate | manifest and entity schemas | Missing `schemaVersion`, `datasetId`, `sourceAnchors`, or blocked/conflict metadata |
| Runtime gate | rules-engine consumers later | Any unresolved rule path must remain `blocked`, never auto-promote to `legal` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VALI-04 | Missing or conflicting rule data never results in `legal` | unit / contract | `pnpm vitest run packages/data-extractor/fixtures/phase1-contract.test.ts -t "VALI-04"` | No - Wave 0 |

### Sampling Rate

- **Per task commit:** `pnpm vitest run packages/data-extractor/fixtures/phase1-contract.test.ts`
- **Per wave merge:** `pnpm vitest run`
- **Phase gate:** All precedence, manifest, and blocked/conflict contract tests green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `pnpm-workspace.yaml` - repo is still planning-only.
- [ ] `packages/data-extractor/package.json` - needed for contract-test entrypoint.
- [ ] `packages/data-extractor/fixtures/phase1-contract.test.ts` - precedence and blocked-state fixtures for `VALI-04`.
- [ ] `packages/data-extractor/src/contracts/*.ts` - manifest, canonical ID, and override registry schemas.
- [ ] Vitest install and config - `pnpm add -D vitest` plus `vitest.config.ts` if needed.

## Sources

### Primary (HIGH confidence)

- Local phase context: `.planning/phases/01-canonical-puerta-dataset/01-CONTEXT.md`
- Local roadmap and requirements: `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md`
- Prior project research: `.planning/research/SUMMARY.md`, `.planning/research/ARCHITECTURE.md`, `.planning/research/STACK.md`, `.planning/research/PITFALLS.md`
- Local NWN install inspection:
  - `C:\Program Files (x86)\Steam\steamapps\common\Neverwinter Nights\data\nwn_base.key`
  - `C:\Program Files (x86)\Steam\steamapps\common\Neverwinter Nights\data\base_2da.bif`
  - `C:\Program Files (x86)\Steam\steamapps\common\Neverwinter Nights\lang\*\data\dialog.tlk`
- Local Puerta snapshot inspection:
  - `C:\Users\pzhly\Documents\Neverwinter Nights\nwsync\nwsyncmeta.sqlite3`
  - `C:\Users\pzhly\Documents\Neverwinter Nights\nwsync\nwsyncdata_0.sqlite3`

### Secondary (MEDIUM confidence)

- Official `neverwinter.nim` README and release page: https://github.com/niv/neverwinter.nim
- `neverwinter.nim` latest release `2.1.2`: https://github.com/niv/neverwinter.nim/releases
- NWN wiki `Player Modding FAQ`: https://nwn.wiki/spaces/NWN1/pages/190185475/Player+Modding+FAQ
- NWN wiki `feat.2da`: https://nwn.wiki/spaces/NWN1/pages/38175102/feat.2da

### Tertiary (LOW confidence)

- None in this pass.

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM - inherited from prior research, with local environment audit but no new registry verification in this pass.
- Architecture: HIGH - strongly supported by local install inspection, local snapshot inspection, and locked project constraints.
- Pitfalls: HIGH - directly tied to the fail-closed requirement, source precedence decisions, and observed environment shape.

**Research date:** 2026-03-29
**Valid until:** 2026-04-28
