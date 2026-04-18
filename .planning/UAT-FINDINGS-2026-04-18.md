# UAT Findings — 2026-04-18 (Post Phase 12.2 Close)

**Context:** After Phases 11 + 12 + 12.1 + 12.2 shipped, user ran walk-through UAT against `http://localhost:5173` and surfaced multiple critical bugs that block milestone v1.0 closure. Scripted MCP Chrome confirmation ran by agent. This doc catalogs every observed defect with reproduction + fix scope.

---

## Severity key

- **Critical (C)** — blocks char creation or produces illegal state
- **High (H)** — user-visible correctness bug, workflow surface
- **Medium (M)** — UX polish / formatting / clarity

---

## Defect catalog

### B1 [C] — Attributes point-buy allows negative budget
**Repro:** Humano + Caótico Neutral + reset atributos. Increment FUE to 14 (6 pts). Consume remaining budget via DES/CON/INT/SAB/CAR to exactly 0. Click `Aumentar Fuerza` once more (14→15 costs 2). Button is NOT disabled. `Puntos restantes` drops to **-2**. FUE accepts the increment.
**Evidence:** Scripted test recorded `fueBtnDisabledWhenCostExceedsBudget: false`, `remainingBeforeExpensiveClick: 0`, `remainingAfterExpensiveClick: -2`.
**Root cause:** `apps/planner/src/features/character-foundation/attributes-board.tsx:118-125` — `+` button disabled check only uses `baseValue >= maximum`; does not compute `costOfNextIncrement` and compare with `remainingPoints`. Store accepts any setter call; `ability-budget.ts:66` reports overspend post-hoc but never prevents it.
**Fix scope:** Small (1 file). Pre-compute cost delta before button click; disable when `remaining - costDelta < 0`.
**Affected requirements:** ABIL-01.

### B2 [C] — Multiclass progression broken at Level 2+
**Repro:** Complete origin + Humano Guerrero L1. Click level `2` in progression rail. Click any class (e.g. Pícaro). Rail updates to `1Pícaro 2 3...` — **L1 was overwritten, L2 remains empty**. Center header still reads `SELECCIONA LA CLASE DEL NIVEL 1`.
**Evidence:** Scripted test captured rail snapshot `"1Pícaro"` after clicking L2 + Pícaro. Expected `"1Guerrero 2Pícaro"`. Title confirmed still `NIVEL 1`.
**Root cause:** Clicking a level button in `apps/planner/src/features/level-progression/` rail does not switch `activeLevel` / `selectedLevelIndex` state. Class picker always writes to the stored `activeLevel`, which stays at 1. Without this, no multiclass is possible.
**Fix scope:** Medium (~level-progression selector + store setter). Rail click must update active-level; picker must read active-level when persisting class.
**Affected requirements:** CLAS-01, CLAS-02, CLAS-04, PROG-01, PROG-02.

### B3 [C] — Level-2+ Dotes sub-step falsely "blocked"
**Repro:** As B2 (Guerrero L1 only). Navigate Dotes sub-step. Right pane shows `"Completa una progresion valida en Construccion para seleccionar dotes por nivel."` — but progression AT level 1 is valid. Dotes cannot be added.
**Evidence:** Screenshot captured inline — detail pane renders the block message even with L1 class set. Picking Esquiva at L1 DID work (feat slot filled). The block appears specifically on higher levels once a class is missing from the progression, but Phase 12.1 roster cannot surface per-level slots without an active multiclass flow (B2).
**Root cause:** Likely `selectFeatBoardView` evaluates progression validity across all 1..16 levels; when any level has no class, the gate trips for every level. Should instead gate per-active-level.
**Fix scope:** Medium (feats/selectors.ts + likely level-progression integration).
**Affected requirements:** FEAT-01.

### B4 [H] — Feat slot count / "Debes elegir N dotes" prompt missing
**Repro:** Dotes sub-step with Guerrero L1 valid. Center header says `DOTE DE CLASE` or `DOTE GENERAL` after a pick, but no counter like `"Elige 2 dotes (1 restante)"` or `"Dote de clase disponible, Dote general disponible"`.
**Evidence:** DOM scan for `debes elegir|dotes disponible|restante` yields zero matches on Dotes sub-step.
**Root cause:** `FeatBoard` render site in `apps/planner/src/features/feats/feat-board.tsx` does not surface `FeatSlotsAtLevel { classBonusFeatSlot, generalFeatSlot }` data from the view model.
**Fix scope:** Small (UI prompt line + slot data passthrough from selector).
**Affected requirements:** FEAT-01 (quality).

### B5 [M] — Race + class descriptions render as wall-of-text (no paragraph breaks)
**Repro:** Select any race with multi-paragraph TLK description (e.g. `Enano Escudo`). DetailPanel body renders the full description as a single continuous paragraph.
**Evidence:** `detailBody.textContent.includes('\n') === true` (source has `\n` separators). `getComputedStyle(detailBody).whiteSpace === 'normal'` (collapses `\n` to space). `detailBody.children.length === 0` (no `<p>` tags generated from splits).
**Root cause:** `apps/planner/src/components/ui/detail-panel.tsx:14` renders raw string. Class picker uses same pattern (`build-progression-board.tsx`).
**Fix scope:** Small. Either apply `white-space: pre-wrap` to `.detail-panel__body` OR split body on `\n\n` → `<p>` array.

### B6 [H] — PG (hit points) stays `--` at L1
**Repro:** After Guerrero L1 selected with FUE/DES/CON/etc set, character sheet right pane shows `PG --`. Expected: Guerrero d10 + CON mod (e.g. 14 → +2 → 12 HP) or at least maximum (10 + 2 = 12).
**Evidence:** Screenshot confirms `PG --` next to other computed stats.
**Root cause:** HP selector not implemented or not wired through the sheet. Likely a Phase 4/5 gap that was never surfaced because prior UAT builds never reached the character sheet step meaningfully.
**Fix scope:** Medium (rules-engine HP helper + sheet selector + UI).
**Affected requirements:** ABIL-02 (derived stats).

### B7 [H] — Origin state regression when attributes go invalid
**Repro:** Select Humano + Caótico neutral. In Atributos step, reset + consume >30 pts (`Puntos restantes: -4`). The Origen rail rows for Raza + Alineamiento LOSE their `✓` checkmark + selected-value display.
**Evidence:** Rail text goes from `"✓ Raza: Humano ✓ Alineamiento: Caótico neutral"` to `"Raza Alineamiento"` (labels without ✓ or value).
**Root cause hypothesis:** Shell summary / stepper projection re-evaluates origin completeness via a predicate that includes "atributos válido" — so any invalid atributos state retroactively un-marks upstream steps cosmetically. State itself may still hold the values.
**Fix scope:** Small (stepper selector). Origin completeness should depend only on race+alignment selection, not downstream atributos state.

### B8 [M] — Header title `SELECCIONA LA CLASE DEL NIVEL 1` remains static on multiclass flow
**Repro:** Click any level N button. Header does not update to reflect current level.
**Evidence:** See B2.
**Root cause:** Title binding reads a hardcoded value or reads `activeLevel` that never updates due to B2.
**Fix scope:** Small (follows B2 fix).

### B9 [M] — Clase sub-step rail shows `✓ Clase` but header still on NIVEL 1
**Repro:** After picking a class at L1, the `Clase` sub-step entry in Construcción rail shows `✓` immediately, even though other levels have no class yet. Misleading for multi-level builds.
**Root cause:** Same as B2 — `activeLevel` never rolls forward, `Clase` completeness is evaluated only for L1.

---

## Summary table

| ID | Sev | Area | Module | Fix size |
|----|-----|------|--------|----------|
| B1 | C | Attributes overspend | character-foundation | Small |
| B2 | C | Multiclass L2+ broken | level-progression | Medium |
| B3 | C | Dotes blocked at L2+ | feats + progression | Medium |
| B4 | H | Slot count invisible | feats UI | Small |
| B5 | M | Descriptions wall-of-text | detail-panel UI | Small |
| B6 | H | PG `--` not computed | rules-engine + sheet | Medium |
| B7 | H | Origin rail unmarks on bad atributos | shell stepper | Small |
| B8 | M | Header stays on NIVEL 1 | level-progression | Small (follows B2) |
| B9 | M | Clase sub-step misleading check | level-progression | Small (follows B2) |

---

## Scope recommendation

**Phase 12.3 "UAT Correctness Closure"** — single gap-closure phase with 6 plans:

- **12.3-01 (Small)** — B1 attributes-board disable when cost > remaining (CRITICAL)
- **12.3-02 (Medium)** — B2 + B8 + B9: multiclass level switching (click L2 activates L2, header updates, per-level checks)
- **12.3-03 (Medium)** — B3 per-level Dotes gate + B4 slot-count prompt
- **12.3-04 (Medium)** — B6 PG hit-points pipeline
- **12.3-05 (Small)** — B7 stepper origin-completeness decoupling
- **12.3-06 (Small)** — B5 description paragraph rendering (white-space: pre-wrap or \n\n → <p>)

**Estimated effort:** 8–12 dev-hours across 6 plans (~1–2 dev-days with TDD per bug).

**Milestone v1.0 close is BLOCKED on B1, B2, B3, B6** (Critical + High HP). Cosmetic bugs (B5, B8, B9) could ship as Phase 12.4 or fold into 12.3 depending on scope discipline.

---

## Waves / parallelism

| Wave | Plans | Reason |
|------|-------|--------|
| 1 | 12.3-01, 12.3-05, 12.3-06 | File-disjoint: attributes-board + stepper selector + detail-panel. Parallel safe. |
| 2 | 12.3-02 | Touches level-progression selectors + store. Has downstream ripples (B8/B9). |
| 3 | 12.3-03, 12.3-04 | 12.3-03 depends on B2 fix (can't gate per-level until levels exist). 12.3-04 HP pipeline disjoint. |

---

## Out-of-UAT observations (not catalogued as defects)

- Pícaro + Alma Predilecta / Paladin Antiguos / Paladin Oscuro / Paladin Vengador / Artífice correctly blocked at L1 (12.2-03 fix verified in-browser).
- Race ability modifiers apply (Enano CON 8→10, CAR 8→6 observed). 12.2-02 verified.
- 45 parent races + 41 classes visible (12.1-01/02 verified).
- `SelectionScreen` scroll works (12.1-03 verified).

---

*Compiled 2026-04-18 by agent MCP Chrome scripted walk-through. Findings block milestone v1.0 close pending Phase 12.3 remediation.*
