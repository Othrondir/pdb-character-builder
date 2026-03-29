# Phase 1: Canonical Puerta Dataset - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-29
**Phase:** 01-canonical-puerta-dataset
**Areas discussed:** Source precedence, Unverified rules handling, Repository artifacts, Snapshot policy

---

## Source precedence

| Option | Description | Selected |
|--------|-------------|----------|
| Local Puerta snapshot + curated manual overrides | Treat the local Puerta snapshot plus curated manual overrides as canonical, using older forum material only as fallback evidence. | ✓ |
| Public forum text first | Treat the visible forum and rules pages as canonical even when local extracted data differs. | |
| Mixed merge | Merge all discovered sources opportunistically without a strict precedence ladder. | |

**User's choice:** Local Puerta snapshot + curated manual overrides.
**Notes:** User explicitly chose `snapshot local de Puerta + overrides manuales curados > foro viejo`.

---

## Unverified rules handling

| Option | Description | Selected |
|--------|-------------|----------|
| Block as not verifiable | Mark ambiguous or unresolved rules as blocked or not verifiable, never as valid. | ✓ |
| Allow with warning | Let the build proceed but warn that confidence is low. | |
| Fall back to base NWN | Assume base NWN legality when Puerta data is incomplete. | |

**User's choice:** Block as not verifiable.
**Notes:** User explicitly chose `mostrarla como no verificable / bloqueada, nunca como válida`.

---

## Repository artifacts

| Option | Description | Selected |
|--------|-------------|----------|
| Commit normalized datasets only | Version normalized JSON, manifests, and curated overrides, but exclude raw game assets. | ✓ |
| Commit raw extracted assets | Commit extracted raw source files from game data and `nwsync` into the repo. | |
| Commit no datasets | Keep all compiled data local and regenerate per-machine without versioned artifacts in git. | |

**User's choice:** Commit normalized datasets only.
**Notes:** User explicitly chose `JSON normalizado + manifiesto + overrides, pero no assets crudos del juego`.

---

## Snapshot policy

| Option | Description | Selected |
|--------|-------------|----------|
| Manual versioned snapshots | Refresh datasets manually and record explicit versions. | ✓ |
| Automatic regeneration | Regenerate datasets whenever local source files change. | |
| Always use latest local data | Load the most recent local snapshot with no pinned versioning. | |

**User's choice:** Manual versioned snapshots.
**Notes:** User explicitly chose `snapshots manuales y versionados, no regeneración automática silenciosa`.

---

## the agent's Discretion

- Exact schema layout, hashing, and manifest field naming within the constraints agreed above.
- Exact organization of override files and generated dataset folders.

## Deferred Ideas

None.
