---
phase: 16-feat-engine-completion
created: 2026-04-26
mode: discuss
---

# Phase 16 — Feat Engine Completion · CONTEXT

## Phase Goal (from ROADMAP)

Cerrar TODOs de bonus feats en `feat-eligibility.ts` y resolver Humano L1 advance gate.

**Requirements:** FEAT-05 (extractor surfaces bonus-feat schedules) + FEAT-06 (Humano L1 extra slot).

## Surface Scout

- `packages/rules-engine/src/feats/feat-eligibility.ts:78-87` — `CLASS_BONUS_FEAT_SCHEDULES` hardcoded 6 entries (fighter, swashbuckler, caballero-arcano, wizard, monk, rogue).
- `packages/rules-engine/src/feats/feat-eligibility.ts:100` — single TODO: "Add human bonus feat logic when race-aware feat selection is implemented" (in `determineFeatSlots` JSDoc).
- `packages/rules-engine/src/feats/feat-eligibility.ts:102-107` — `determineFeatSlots(characterLevel, classId, classLevelInClass, classFeatLists)` — no `raceId` arg.
- `apps/planner/src/features/feats/store.ts:11-13` — `FeatRecord = { bonusGeneralFeatIds: CanonicalId[]; classFeatId: CanonicalId | null; generalFeatId: CanonicalId | null }`.
- `apps/planner/src/features/persistence/build-document-schema.ts:30` — `schemaVersion: z.literal(2)` + `featSelections` shape persists `classFeatId` / `generalFeatId` / `bonusGeneralFeatIds[]`.
- Existing UI rendering walks store record per chip (Phase 12.8-03 D-06 invariant) — feat-summary-card.tsx + feat-board.tsx.
- Phase 12.4-07 known limitation (12.4-07 SUMMARY): "Humano L1 budget.featSlots.total = 3 but useFeatStore holds only 2 slots ... collapse-on-complete only fires for non-Humano cases." Phase 16 closes this.

## Locked Decisions

### D-01 Schedule data origin (G-1 → C)

**Decision:** Extractor emits per-class `bonusFeatSchedule: number[] | null` field on `CompiledClass`. When `null` (extractor unaware of the class), runtime falls back to the existing `CLASS_BONUS_FEAT_SCHEDULES` hardcoded map. Extractor-derived takes precedence per-class.

**Why:** Preserves green baseline (6 hardcoded entries cover the live-tested cases). Allows incremental enrichment as `cls_feat_*.2da` parsing lands. Fail-closed not needed — schedules are mechanical canon, hardcoded values are correct for the listed classes.

**Implication for planner:** New `class-fixture` projection step + schema field. Hardcoded map stays in `feat-eligibility.ts` as `LEGACY_CLASS_BONUS_FEAT_SCHEDULES` (renamed to signal fallback role), runtime checks compiled value first, falls back if `null`.

**Implication for researcher:** Investigate `cls_feat_*.2da` shape (rows per class level, GrantedOnLevel column meaning, GrantedFeat list filtering). Cross-reference Phase 5.1 extraction patterns.

### D-02 Humano L1 store shape (G-2 → A)

**Decision:** Reuse existing `bonusGeneralFeatIds: CanonicalId[]` array. Capacity is dynamic — at Humano L1 the array holds at most 1 entry (the race bonus slot); for non-Humano levels it stays `[]` (current behavior unchanged).

**Why:** Zero share-URL schema impact (SHAR-05 invariant preserved). Zero migration. Zero schemaVersion bump. The array shape was already designed for "extra general-pool feats" — Humano L1 is exactly that semantically.

**Implication for planner:** Store mutators stay shape-stable. New `setRaceBonusFeat(level, featId)` action OR reuse existing `setBonusGeneralFeat(level, index, featId)` with explicit slot intent comment. Validation must enforce `bonusGeneralFeatIds.length <= raceBonusSlots(raceId, level)` (currently always 0; Humano L1 = 1; future races/levels extensible).

**Implication for share-URL:** `bonusGeneralFeatIds` already serialized — no encoding change.

### D-03 Race-aware `determineFeatSlots` signature (G-3 → C)

**Decision:** Replace 4-arg signature with `determineFeatSlots(buildState: BuildStateAtLevel, classFeatLists)`. `BuildStateAtLevel` already carries race + level + class info — minimal call-site churn, no per-arg drift across 5+ call sites.

**Why:** Race detection needs `raceId` access; threading full state matches the pattern used by other rules-engine helpers post Phase 12.8 (`evaluateFeatPrerequisites(buildState, ...)` etc.). Single point of truth, easier to extend (subrace bonus, class-feat-list-by-race-restriction, future races).

**Implication for planner:** Migrate ~6 call sites in `apps/planner/src/features/feats/`. Each call site already has `BuildStateAtLevel` available (it's the input to selectFeatBoardView).

**Implication for researcher:** Verify NWN1 EE racial bonus feat rules — Humano = +1 general feat at L1; check if other races in current PDB roster (Elfo, Enano, Mediano, Semielfo, Semiorco, Drow, Gnomo) have any analogous racial feat schedules. If not, scope stays Humano-only.

### D-04 UI surface for Humano L1 third slot (G-4 → B)

**Decision:** Dedicated "Dote racial" section between class-bonus and general slots in feat-board.tsx + feat-summary-card.tsx. New `slotKind: 'race-bonus'` branch on `FeatSummaryChosenEntry` (extends Phase 12.8-03 D-06 chip shape).

**Why:** User clarity — "this slot is because you're Humano" is distinct from "you have a class bonus" or "you get a general feat at L1". The Phase 12.8-03 chip projection already supports per-slot kind dispatch; adding a third kind is a minimal, structurally-consistent extension.

**Implication for planner:**
- Section heading copy: `'Dote racial: Humano'` or similar (D-NO-COPY relaxed for v1.1 — adding new copy keys is allowed, but keep them under `shellCopyEs.feats.*` namespace).
- `<FeatSummaryCard>` chips render with `slotKind: 'race-bonus'` and matching `data-slot-kind="race-bonus"` for E2E selectors.
- Counter math: `featSlots.total` already returns 3 for Humano L1 (12.4-07 budget computation correct); UI only needs to surface the third row.

**Implication for researcher:** No new research needed — existing 12.4-07 budget math + 12.8-03 chip projection cover the underpinning.

### D-05 Backward compat (G-5 → C)

**Decision:** No schemaVersion bump (G-2=A keeps shape stable). Existing v1.0 saved builds with `bonusGeneralFeatIds: []` load identically into v1.1 — only Humano L1 builds will start populating the array; non-Humano builds stay byte-identical.

**Why:** Zero migration burden. v1.0 saves were in fact already validating against this exact shape (per build-document-schema.ts line 81 `featSelections` array). Nothing to do.

**Implication for planner + verifier:** Add a regression spec confirming a v1.0-shaped JSON build (Elfo Guerrero L1) round-trips through hydrate → project on v1.1 unchanged.

## Invariants (carry-forward from v1.0)

- **D-NO-DEPS:** Zero new npm packages. Use existing rules-engine + extractor primitives.
- **share-URL contract preserved:** No `schemaVersion` bump; no new field in `featSelections`. (D-02 + D-05 lock this.)
- **diffRuleset still gates all 4 hydration paths** — no change to fail-closed posture.
- **Phase 12.8-03 D-06 chip projection stable** — extends with `slotKind: 'race-bonus'` branch, doesn't rewrite.

## Post-Research Updates (2026-04-26)

### D-06 Mediano Fortecor scope expansion

**Decision (resolves research Assumption A1):** FEAT-06 covers BOTH `race:humano` AND `race:mediano-fortecor`. Mediano Fortecor TLK description carries identical "Aprendizaje rápido: Ganan 1 dote adicional a 1.er nivel" text — same Puerta rule, different race.

**Why:** Same canonical mechanic, no 2DA encoding for either; treating them differently is bookkeeping debt. Plan 16-02 race-bonus helper takes a Set, not a single canonical id.

**Implication for planner:** `RACE_L1_BONUS_FEATS: Set<CanonicalId>` constant in rules-engine (or extractor-emitted via race catalog field if research surfaces a 2DA hook later — but research confirmed there is none). Both races trigger the same `slotKind: 'race-bonus'` UI section; section heading parameterizes by race name.

### D-07 Store cap correction

**Decision (resolves research finding 4):** D-02 reasoning was based on Phase 12.4-07's stale "store cap 2 vs total 3" claim. Research verified `bonusGeneralFeatIds[]` already supports N entries; persistence already iterates `.entries()` without length cap. **FEAT-06 is purely UI labelling + onDeselect dispatch branch + race-aware slot-count math.** No store mutator changes needed.

**Why:** Reduces Plan 16-02 scope to UI-layer + rules-engine helper. Schema unchanged (D-05 confirmed).

### Research-derived Pitfall locks (in addition to D-01..D-05)

- **PIT-01:** Puerta cadences DIVERGE from vanilla NWN1 (rogue [7,10,13,15,17,19] vs [10,13,16,19]; cleric L3 grant; ranger L1+L2+L4+L9+L14+L19). Phase 12.4-03 hardcoded `LEGACY_CLASS_BONUS_FEAT_SCHEDULES` will be SILENTLY OVERRIDDEN once extractor lands. Plan 16-01 must update Phase 12.4-03 fixtures to consume extractor-derived values (not silent breakage).
- **PIT-02:** `BuildStateAtLevel` does NOT carry `raceId` today (`feat-prerequisite.ts:13-28`). D-03 threading requires extending the interface with `raceId: string | null` + `activeClassIdAtLevel: string | null`. ~5 call sites + ~9 fixture sites — enumerated in `16-RESEARCH.md` § Plan Decomposition Hints.
- **PIT-03:** `cls_bfeat_*.2da` is single-column (col `Bonus`, row idx = class level, value 0/1). `classes.2da` carries `BonusFeatsTable` at column 12 — currently UNREAD by `class-assembler.ts:188` (only reads `FeatsTable`). Plan 16-01 wires the column.

### Extract verification (2026-04-26 14:03)

Ran `corepack pnpm extract` — current code regenerated catalogs (datasetId bumped to `puerta-ee-2026-04-26+cf6e8aad`; 1611 items / 100 warnings). Reverted compiled-* artifacts to baseline `puerta-ee-2026-04-17+cf6e8aad` so Plan 16-01 can re-extract atomically with the new `bonusFeatSchedule` field included in the same commit.

## Deferred Ideas (out of phase 16 scope)

- Subrace-driven feat bonuses other than Mediano Fortecor (none surfaced; defer if UAT raises a third race).
- Per-feat exclusion lists per race (Drow tiene restricciones específicas que no tocan slot count) — separate phase if surfaced by UAT.
- Bonus feat schedule migration for prestige classes not in `LEGACY_CLASS_BONUS_FEAT_SCHEDULES` — covered by D-01 fallback path; no proactive enrichment without extractor data.

## Plan Decomposition (research-suggested)

- **Plan 16-01** — Extractor adds `bonusFeatSchedule: number[] | null` to compiled-classes (FEAT-05). Files: `class-catalog.ts` schema + `class-assembler.ts:188` parse + regenerated `compiled-classes.ts`. New spec `tests/phase-16/bonus-feat-schedule-extractor.spec.ts`. Phase 12.4-03 fixtures updated to consume extractor values.
- **Plan 16-02** — Rules-engine race-aware threading + UI section + Humano + Mediano Fortecor (FEAT-06 + half of FEAT-05 consumer wiring). Files: `feat-eligibility.ts` + `feat-prerequisite.ts` + new `race-constants.ts`; planner `selectors.ts` + `feat-board.tsx` + `feat-summary-card.tsx` + `es.ts` copy; ~10 files total. Spec: `tests/phase-16/race-bonus-feat.spec.tsx`.
- **Plan 16-03** — Persistence round-trip regression spec. Single new spec file `tests/phase-16/humano-l1-build-roundtrip.spec.ts`. Schema unchanged. D-05 lock test.

## Resume Options

- `/gsd-plan-phase 16` — recommended; CONTEXT + RESEARCH both authored, decisions locked, 3-plan decomposition prescribed
- Discuss further if user wants to revisit D-06 (Mediano Fortecor) or any other lock
