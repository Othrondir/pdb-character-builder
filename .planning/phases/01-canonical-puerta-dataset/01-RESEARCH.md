# Phase 1: Canonical Puerta Dataset - Research

**Date:** 2026-03-29
**Status:** Ready for planning
**Phase:** 01 - Canonical Puerta Dataset

## Objective

Phase 1 must establish a versioned, provenance-aware Puerta dataset that can feed the planner without any runtime access to raw game assets. The key planning question is not how to render the UI, but how to make later phases trust the data contract.

## Planning Inputs That Matter

- The canonical precedence is already fixed: local Puerta snapshot plus curated manual overrides beats older forum documentation.
- Ambiguous rules must fail closed: blocked or not verifiable, never silently valid.
- The repo may version normalized JSON, manifests, and overrides, but not raw game assets.
- Dataset refreshes are manual and versioned, never silent.
- The local environment already gives two source layers:
  - base NWN EE install with KEY/BIF assets
  - local Neverwinter Nights `nwsync` metadata pointing at `http://nwsync.puertadebaldur.com`

## Recommended Source Matrix

### Source layers

1. **Base NWN EE assets**
   - Purpose: baseline classes, feats, spells, 2DA rows, and text IDs
   - Trust level: authoritative for unmodified stock content only
   - Output: extracted baseline entities and base provenance

2. **Local Puerta `nwsync` snapshot**
   - Purpose: current server payload overrides, custom tables, and custom text resources
   - Trust level: primary machine-readable source for server-specific content
   - Output: extracted Puerta-layer entities, overrides, and source hashes

3. **Curated manual overrides**
   - Purpose: script-only rules, admin policy, forum-only clarifications, and conflict corrections
   - Trust level: highest only for explicitly curated targets
   - Output: small audited override registry with explicit rationale and source citation

4. **Forum and website documentation**
   - Purpose: reconciliation input and override evidence
   - Trust level: never runtime truth
   - Output: citations that justify override entries or unresolved-rule blocks

### Compiler boundary

The compiler should be the only place that touches raw sources. The browser should consume only compiled JSON artifacts:

- `dataset-manifest.json`
- normalized entity datasets such as `classes.json`, `feats.json`, `spells.json`, `domains.json`, `skills.json`, `rules.json`
- curated override files or a compiled `overrides.json`
- optional provenance/debug summaries safe to publish

Do not let the app parse BIF, TLK, KEY, SQLite, or forum pages at runtime.

## Canonical Schema and ID Strategy

### Recommended ID rules

- IDs must be **stable, language-independent, and display-name-independent**.
- Prefer original machine identifiers where they exist:
  - resref
  - table row key
  - class/feat/spell numeric ID from extracted data
- When no stable machine ID exists, mint a canonical slug and keep the original evidence in provenance.
- Never use Spanish display labels as primary keys.

### Entity shape expectations

Every normalized entity should carry:

- `id`
- `kind`
- `sourceLayer` (`base`, `puerta`, `override`)
- `displayName`
- `displayNameEs`
- `descriptionEs` when available
- `prerequisites`
- `tags`
- `status` (`supported`, `blocked`, `deprecated`, `unknown`)
- `provenance[]`

For rules and exceptions, prefer explicit structured rule objects over opaque text blobs.

## Dataset Manifest and Provenance

### Minimum manifest fields

- `datasetId`
- `schemaVersion`
- `buildEncodingVersion`
- `gameVersion`
- `serverId` or `serverName`
- `createdAt`
- `sourceHashes`
- `sourceSummary`
- `precedencePolicyVersion`
- `overrideRegistryVersion`
- `locale`
- `compilerVersion`

### Provenance expectations

Each normalized record should be traceable back to:

- source layer
- extractor input identity (table, file, or override entry)
- source hash or snapshot identifier
- optional evidence note when a manual override exists

This is necessary so later phases can explain *why* something is blocked or differs from base NWN.

## Override Registry Shape

### Recommended structure

Use explicit override records rather than ad-hoc patches:

- `targetKind`
- `targetId`
- `operation` (`replace`, `append`, `block`, `annotate`, `split`, `merge`)
- `payload`
- `reason`
- `evidence`
- `introducedInDataset`
- `confidence`

Group override files by domain:

- `overrides/classes.json`
- `overrides/feats.json`
- `overrides/spells.json`
- `overrides/domains.json`
- `overrides/skills.json`
- `overrides/rules.json`

This keeps reviewable diffs and prevents one giant override blob from becoming unmaintainable.

## Unsupported and Conflicting Rule Handling

The planner must fail closed. That implies three concrete states at compile time:

- `supported`: enough evidence to evaluate legally
- `blocked`: explicitly known but not usable until evidence or implementation exists
- `unknown`: data present but not trustworthy enough to expose as valid

Recommended behavior:

- Conflicts between source layers create a structured conflict record.
- Conflict records never collapse into a silently chosen winner unless a curated override resolves them.
- Later UI phases consume these states so they can explain why an option is blocked or unavailable.

## Validation Architecture

Validation needs two layers even in Phase 1:

### 1. Compiler validation

Checks the dataset itself before any planner logic exists:

- every exported entity has a stable ID
- manifest fields are present
- provenance exists for every record
- source precedence is applied deterministically
- conflict records are emitted when sources disagree
- no published dataset references raw unpublished assets

### 2. Runtime contract validation

Defines what later phases may assume:

- the browser only loads compiled JSON artifacts
- any entity marked `blocked` or `unknown` cannot be treated as legal
- shared builds must reference a `datasetId`
- mismatch between build document and dataset must be detectable

This phase should not implement the full legality engine yet, but it should define the contract that makes legality explainable later.

## Risks That Must Shape the Plan

- **Script-only rules risk**: some Puerta legality may live outside machine-readable tables, forcing manual overrides.
- **Text mismatch risk**: custom Spanish labels may live in TLK or custom resources, so extraction must separate IDs from display text.
- **Snapshot drift risk**: if the compiler reads the latest local state without versioning, shared builds become non-deterministic.
- **Overextraction risk**: pulling too many raw artifacts into the repo would violate the agreed boundary and complicate publishing.
- **Premature UI coupling risk**: if schema decisions wait until UI work, later phases will churn heavily.

## Recommended Plan Breakdown

### 01-01: Freeze canonical schema, IDs, and source precedence

Focus:

- final source matrix
- stable ID rules
- entity schemas
- precedence policy
- conflict representation

Deliverable shape:

- schema docs or JSON schemas
- precedence contract
- canonical entity list by domain

### 01-02: Define dataset manifest, provenance, and override registry

Focus:

- manifest structure
- provenance fields
- override file layout
- safe publish boundary for compiled artifacts

Deliverable shape:

- manifest schema
- override registry schema
- published artifact list

### 01-03: Define unsupported/conflict handling for ambiguous rules

Focus:

- blocked/unknown/supported states
- conflict records
- fail-closed rules
- runtime contract expectations for later phases

Deliverable shape:

- validation-state model
- conflict-handling policy
- planner-facing contract for ambiguous data

## Open Questions for Later Phases

- Which exact Puerta custom entities are present in the current `nwsync` snapshot and which require manual override?
- Where do Spanish display strings come from for each domain: extracted data, TLK, or curated text?
- Which server legality rules remain script-only and therefore need explicit override entries?

## Planning Recommendation

Phase 1 should be planned as a compiler-and-contract phase, not an implementation-of-everything phase. The plans should create a durable source-of-truth boundary that later UI and rules-engine phases can consume without revisiting foundational data decisions.
