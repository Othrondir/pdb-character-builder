---
phase: 08-summary-persistence-shared-builds
reviewed: 2026-04-17T00:00:00Z
depth: standard
files_reviewed: 20
files_reviewed_list:
  - apps/planner/src/data/ruleset-version.ts
  - apps/planner/src/features/persistence/build-document-schema.ts
  - apps/planner/src/features/persistence/project-build-document.ts
  - apps/planner/src/features/persistence/hydrate-build-document.ts
  - apps/planner/src/features/persistence/dexie-db.ts
  - apps/planner/src/features/persistence/slot-api.ts
  - apps/planner/src/features/persistence/json-export.ts
  - apps/planner/src/features/persistence/json-import.ts
  - apps/planner/src/features/persistence/share-url.ts
  - apps/planner/src/features/persistence/url-budget.ts
  - apps/planner/src/features/persistence/version-mismatch.ts
  - apps/planner/src/features/persistence/share-entry.tsx
  - apps/planner/src/features/persistence/index.ts
  - apps/planner/src/features/summary/resumen-selectors.ts
  - apps/planner/src/features/summary/resumen-board.tsx
  - apps/planner/src/features/summary/resumen-table.tsx
  - apps/planner/src/features/summary/save-slot-dialog.tsx
  - apps/planner/src/components/ui/toast.tsx
  - apps/planner/src/components/ui/version-mismatch-dialog.tsx
  - apps/planner/src/components/shell/planner-footer.tsx
  - apps/planner/src/router.tsx
  - scripts/verify-phase-08-copy.cjs
findings:
  critical: 0
  warning: 4
  info: 6
  total: 10
status: issues_found
---

# Phase 08: Code Review Report

**Reviewed:** 2026-04-17T00:00:00Z
**Depth:** standard
**Files Reviewed:** 20 (plus `router.tsx` and `verify-phase-08-copy.cjs` as part of the delta)
**Status:** issues_found

## Summary

Phase 08 ships a clean, well-layered persistence + sharing surface. The Zod schema is
consistently `.strict()` at every nested level (Pitfall 6 handled), fail-closed guards
are in place for incomplete builds (`IncompleteBuildError`), URL decode (`ShareDecodeError`
with diagnostic messages), and version mismatch (`diffRuleset` + `VersionMismatchDialog`
renders on both JSON and URL paths). Zip-bomb cap (200 kB) is appropriate, base64url
encoding is RFC-4648-compliant, and hash history wiring matches GitHub Pages constraints.

Review surfaced **no critical issues** but **4 warnings** worth addressing before UAT
closure — chiefly a global toast-queue race that can swallow messages, a `LoadSlotDialog`
that silently no-ops when the row fails Zod re-validation, and a stale/incorrect
architecture-note in the docstrings regarding the number of version fields compared by
`diffRuleset`. A handful of info-level improvements cover minor robustness and UX polish.

The planner-footer, resumen-board, and resumen-table all use the expected NWN1 tokens
(`var(--color-panel)`, `var(--border-frame)`, `var(--font-display)`). Token usage in the
new styles is consistent with Phase 07.1 chrome.

Test scaffolding (`tests/phase-08/*`) covers the critical contract boundaries (round-trip,
schema strictness, slot API, version-mismatch dialog, share entry). The copy verifier
(`scripts/verify-phase-08-copy.cjs`) catches every Phase-08 copy key present in
`apps/planner/src/lib/copy/es.ts`.

## Warnings

### WR-01: Toast queue races swallow second message if two `pushToast` calls land before render

**File:** `apps/planner/src/components/ui/toast.tsx:18-21,42-48`
**Issue:** `pushToast` overwrites the `current` module-scoped toast on every call and
notifies listeners synchronously. If a flow fires two toasts back-to-back (e.g. the share
fallback path in `resumen-board.tsx:86-88` pushes a toast, and a subsequent error path
pushes another before the user sees the first), the earlier toast is replaced instantly
with no hand-off animation — meaning the user can miss the first message entirely. The
5-second auto-dismiss timer is also reset only when `msg?.id` changes, so two rapid
pushes with the same effect-batch (React 19 batching) could leave the stale timer running
against the new message. Note the code comment itself admits "If a new toast arrives
while another is visible, the old one is replaced" — this is acknowledged design, but the
practical risk in Phase-08 flows (import-error + incomplete-build + share-fallback can
chain) warrants either a short FIFO queue or at minimum a min-display time.

**Fix:** Introduce a short queue + minimum display duration, or enforce that overlapping
pushes append rather than clobber. Minimum viable change:

```ts
const queue: ToastMessage[] = [];
export function pushToast(body: string, tone: ToastMessage['tone'] = 'info'): void {
  const msg = { id: nextId++, body, tone };
  queue.push(msg);
  if (!current) {
    current = msg;
    listeners.forEach((fn) => fn(current));
  }
}
export function dismissToast(): void {
  queue.shift();
  current = queue[0] ?? null;
  listeners.forEach((fn) => fn(current));
}
```

### WR-02: `LoadSlotDialog.onPick` silently no-ops when `loadSlot` returns null, AND bubbles raw `ZodError` when Dexie row fails strict re-validation

**File:** `apps/planner/src/features/summary/save-slot-dialog.tsx:139-148`
**Issue:** Two distinct failure modes are mishandled:

1. `loadSlot(slotName)` returns `null` when the row was deleted between `listSlots()` and
   the click. `onPick` just returns — no toast, no UI feedback. The dialog stays open with
   no indication that anything happened.
2. `slot-api.ts:28` calls `buildDocumentSchema.parse(row.payload)` on load — if a row was
   persisted by an older build (schema drift) or tampered with, this throws a raw
   `ZodError`. The `onPick` handler has no try/catch, so the error propagates up to
   React's error boundary (none present in this surface) and likely crashes the dialog.
   A tampered/stale Dexie row is exactly the scenario Pitfall-6 mitigation is meant to
   defend against — but the current code hands the user a blank screen instead of a
   graceful fallback.

**Fix:**

```ts
async function onPick(slotName: string) {
  try {
    const doc = await loadSlot(slotName);
    if (!doc) {
      pushToast(shellCopyEs.persistence.loadError ?? 'Slot no encontrado', 'warn');
      return;
    }
    hydrateBuildDocument(doc);
    pushToast(
      shellCopyEs.persistence.loadSuccess.replace('{name}', slotName),
      'info',
    );
    onClose();
  } catch (err) {
    const reason = err instanceof ZodError ? 'esquema incompatible' : 'error desconocido';
    pushToast(`No se pudo cargar "${slotName}": ${reason}`, 'error');
  }
}
```

(Also add a `loadError` copy key if needed. Consider running `diffRuleset` against the
loaded Dexie row and surfacing `VersionMismatchDialog` for rows whose ruleset/dataset
has drifted since save — this is the same fail-closed gate used on JSON import.)

### WR-03: `version-mismatch.ts` docstring mis-states the scope of the check

**File:** `apps/planner/src/features/persistence/version-mismatch.ts:13-14`
**Issue:** The docstring claims "Returns null when incoming matches current on BOTH
rulesetVersion AND datasetId" — which is accurate — but the phase-level design docs
(08-CONTEXT.md D-07 and `08-01-PLAN.md` line 161) and the review context both state
that `schemaVersion + plannerVersion + rulesetVersion + datasetId` are the version
header. The current implementation deliberately excludes `plannerVersion` from the diff.
That is a valid design choice (bumping PLANNER_VERSION shouldn't invalidate prior saves
unless rules or data changed), but it is NOT documented. A future maintainer reading
`ruleset-version.ts:10-11` sees "PLANNER_VERSION: app identity. Bump per release" and
will reasonably expect bumping it to fail-closed stale saves — but it won't, because
`diffRuleset` ignores it. Result: a silent contract between module-level comments.

**Fix:** Add a sentence to `version-mismatch.ts` explaining the policy, and mirror the
note in `ruleset-version.ts:10-11`:

```ts
// In version-mismatch.ts above diffRuleset:
// NOTE: plannerVersion is INTENTIONALLY omitted from the diff. The planner version bumps
// on every release (UI changes, bug fixes, etc.) and should not invalidate prior builds
// on its own. Only rulesetVersion (rules engine identity) and datasetId (data snapshot)
// gate hydration. If you need to force-invalidate for a specific release, bump
// rulesetVersion instead.
```

### WR-04: `resumen-selectors.ts` has type-unsafe cast and magic `10` fallback for skill ability modifier

**File:** `apps/planner/src/features/summary/resumen-selectors.ts:133-134,199`
**Issue:** Two related soundness gaps:

1. Line 133-134 casts `abilityAdjustments` to `Record<AttributeKey, number>` without
   validating the shape. If the compiled catalog entry is partial or missing keys, the
   total computation silently drops racial adjustments for that key.
2. Line 199 falls back to `abilityScore = 10` when the skill's `abilityKey` is not in the
   attribute map. This is the same "substitute 0" anti-pattern the `ResumenTable` code
   comment explicitly warns against ("NEVER substitute `0` — a ficha showing BAB/Fort/Ref
   /Will = 0 for every level is misleading, not a clear handoff (SHAR-01)"). A skill
   whose ability mapping is missing will show a modifier of `+0` as if that were a valid
   computed value, instead of rendering the `—` em-dash that the progression rows use for
   unavailable stats. Contradicts the stated invariant.

**Fix:** Change `SkillRow.abilityMod` and `SkillRow.total` to `number | null`, render
`—` when lookup fails, and keep the strict typing on racial adjustments:

```ts
// In the skills loop:
const abilityScore = abilityTotalByKey.get(skill.abilityKey as AttributeKey);
const abilityMod = abilityScore === undefined ? null : abilityModifier(abilityScore);
return {
  skillId: skill.id,
  skillLabel: skill.label,
  ranks,
  abilityMod,
  total: abilityMod === null ? null : ranks + abilityMod,
};
```

Then in `resumen-table.tsx:126-127`, render `s.abilityMod === null ? dash : …`.

## Info

### IN-01: `buildShareUrl` can produce a double `/` when deployed to sub-path with trailing slash

**File:** `apps/planner/src/features/persistence/url-budget.ts:40-52`
**Issue:** When `origin` is omitted and `window.location.pathname` is `/`, the code does
`trimmedPath = ''` (correctly strips the trailing slash) → `${base}/${SHARE_URL_HASH_PREFIX}…`.
When pathname is `/pdb-character-builder/`, `trimmedPath = '/pdb-character-builder'`, giving
`${base}/pdb-character-builder/${SHARE_URL_HASH_PREFIX}…`. Both are fine. But when pathname
is `/pdb-character-builder/index.html` (user on a direct file URL) the constructed URL
becomes `https://host/pdb-character-builder/index.html/#/share?b=…` — the `/index.html`
segment gets treated as a subpath, and `HashRouter` may or may not match cleanly.
Low probability on GitHub Pages, but the pathname includes query/hash artifacts in
some recovery flows.

**Fix:** Normalize the pathname by stripping any trailing filename segment (anything after
the last `/` that contains a `.`) before concatenating. Or document that share URL is only
produced against directory-rooted paths and rely on GitHub Pages' canonicalization.

### IN-02: `share-url.ts` base64 handling uses `String.fromCharCode` loop → O(n) but correct

**File:** `apps/planner/src/features/persistence/share-url.ts:28-34,46-50`
**Issue:** Stylistic only. The hand-rolled byte-to-string loops work, but
`btoa(String.fromCharCode(...bytes))` with spread breaks at ~125k args on some engines.
The `for` loop accumulation is safe for URL payloads (budget cap 1900 bytes). No bug,
just worth a comment explaining why the loop is preferred over the spread idiom.

**Fix:** Add a one-line comment noting the spread-arg limit and the deliberate choice to
loop. No code change required.

### IN-03: `slot-api.saveSlot` error message mixes Spanish + English

**File:** `apps/planner/src/features/persistence/slot-api.ts:9`
**Issue:** `throw new Error('Slot name requerido')` mixes "Slot name" (English) with
"requerido" (Spanish). Project convention is Spanish-first. This string is unlikely to
reach the user (caller validates first), but if it does via unhandled path, it's
inconsistent.

**Fix:**
```ts
throw new Error('El nombre del slot es obligatorio');
```

### IN-04: `hydrate-build-document.ts` does not restore `build.name` to any store

**File:** `apps/planner/src/features/persistence/hydrate-build-document.ts:27-76`
**Issue:** `projectBuildDocument(name?: string)` serializes `build.name` but
`hydrateBuildDocument` never reads it back. The only consumer of `build.name` post-hydrate
is the import-error branch in `resumen-board.tsx:201` (for the "re-download as JSON" fallback
filename). This is acceptable given the current UI has no persistent name field — the
Resumen header uses `shellCopyEs.resumen.emptyNamePlaceholder` — but it means
`sampleBuildDocument({name: 'x'}) → project → hydrate → project` produces a doc without
`name`. Silent information loss on round-trip.

**Fix:** Either (a) add a `name` field to the foundation store and restore it, or (b) add
a comment in `hydrate-build-document.ts` documenting that `build.name` is save-only
metadata intentionally not hydrated (since the store has no home for it). Prefer (b) until
the UI actually shows a name.

### IN-05: `dexie-db.__resetPlannerDbForTests` is reachable from the barrel if re-exported accidentally

**File:** `apps/planner/src/features/persistence/dexie-db.ts:61-70` + `index.ts`
**Issue:** The comment says "Test helper … NOT exported from the package barrel" and
`index.ts` correctly omits it. Good. But any future refactor that re-exports the module
as a namespace (`export * from './dexie-db'`) would expose it. Consider moving the test
helper to a sibling `dexie-db.testing.ts` module so barrels cannot accidentally surface it.

**Fix:** Optional — move helper to a separate file only imported by tests:

```ts
// dexie-db.testing.ts
import { getPlannerDb, __dbInstance } from './dexie-db-internal';
export function __resetPlannerDbForTests(): void { … }
```

### IN-06: `share-entry.tsx` useEffect depends on `search.b` but ignores route-level `validateSearch` fallback

**File:** `apps/planner/src/features/persistence/share-entry.tsx:36,42`
**Issue:** `router.tsx:33` declares `b: z.string().min(1).max(8192).default('').catch('')`
— meaning the router will coerce invalid/missing `b` to the empty string. `share-entry.tsx`
then checks `if (!search.b)` and shows `emptyPayload`. That works, but:

1. The `as { b: string }` cast on line 36 drops the schema typing that `useSearch({ from:
   '/share' })` would give you automatically. If the route search schema is ever expanded
   (e.g. adding `?from=discord`), this cast shadows the real shape.
2. An 8192-char overly-large `b` param currently passes the route validator but will fail
   inside `decodeSharePayload` with a terse error ("Payload base64url inválido"). The
   router-level validator could reject over-budget payloads more cleanly by matching the
   `MAX_ENCODED_PAYLOAD_LENGTH = 1900` constant.

**Fix:** Drop the cast (`useSearch({ from: '/share' })` is already typed) and align the
router's `max(8192)` with `MAX_ENCODED_PAYLOAD_LENGTH` (or a safety multiple):

```ts
// router.tsx
import { MAX_ENCODED_PAYLOAD_LENGTH } from '@planner/features/persistence';
const shareSearchSchema = z.object({
  b: z.string().min(1).max(MAX_ENCODED_PAYLOAD_LENGTH * 2).default('').catch(''),
});
```

---

_Reviewed: 2026-04-17T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
