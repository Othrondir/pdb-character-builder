---
date: 2026-04-23
phase_origin: 12.7 (UAT post-execution, master)
status: pending-triage
severity_summary:
  blocker: 0
  major: 4
  minor: 2
---

# UAT Findings — Post Phase 12.7 (2026-04-23)

Agent-driven UAT against master `809ff11` surfaced 6 findings: 2 Habilidades defects, 2 Dotes defects, 1 Prestige gate coverage gap, 1 roster dedupe gap. Dotes multi-slot UX + Habilidades scroll-snap are the highest-impact items — both regressed against Phase 12.7-03 R3's intent (scroll reset) and Phase 12.4-07's intent (summary-card ergonomics).

Evidence captured via MCP Chrome on tab `761726835` (`http://localhost:5173/`) 2026-04-23, fixture: Elfo + Neutral puro + Elfo default attrs (FUE 8 DES 10 CON 6 INT 8 SAB 8 CAR 8) + Guerrero L1. DOM snapshots inline.

---

## F1. Habilidades opens scrolled to row 206 — major

**Symptom**: First entry to Habilidades sub-step lands the scroller at `scrollTop=206` (row 1 of class-skills list) instead of top. Sheet top clipped 128px above viewport.

**Root cause**: `apps/planner/src/styles/app.css:473` declares `.skill-board .selection-screen__content { scroll-snap-type: y proximity }` with `.skill-board .skill-sheet__row { scroll-snap-align: start }` at `app.css:477`. Browser snaps to the first snap-anchor (first `.skill-sheet__row` at offset 206) regardless of any programmatic `scrollTop=0`.

**Evidence**:
```
document.querySelector('.selection-screen__content').scrollTop // → 206
document.querySelector('.skill-sheet').scrollTop              // → 0  (wrong element)
.skill-sheet clientHeight === scrollHeight (1982 === 1982)    // not scrollable
.selection-screen__content scrollHeight=1990 clientHeight=744 // real scroller
// Setting scrollTop=0 reverts to 206 on next frame (snap re-applies)
// No scrollIntoView or .focus() call intercepted during rerender.
```

**Phase 12.7-03 R3 miss**: `useLayoutEffect` + `useRef<HTMLElement>` wiring in `<SkillSheet />` resets `.skill-sheet.scrollTop`, but `.skill-sheet` is not the overflow owner — `.selection-screen__content` is. Fix landed on the wrong element; regression was never observable in jsdom (no layout engine → no snap).

**Suggested fix**:
- Remove `scroll-snap-type` from `.skill-board .selection-screen__content` (primary fix).
- Re-wire `useLayoutEffect` in `skill-sheet.tsx` to reset `.selection-screen__content.scrollTop` on `[activeSheet.level]`.
- Regression test must run in Playwright (real layout engine), not jsdom, per UI-SPEC viewport invariant.

---

## F2. Habilidades "la caja se mueve" on +/- — major

**Symptom**: Clicking `+` or `-` on any skill row causes visible shift of the list. Row dimensions themselves are stable.

**Evidence**:
```
// Before +        row0 top=78  height=42  scrollTop=206
// After +         row0 top=78  height=42  scrollTop=206
// Rows don't move; perceived shift driven by snap re-binding
// during React commit + overflow-anchor: auto carry.
```

**Root cause**: Same `scroll-snap-type: y proximity` as F1. On each state commit, React reconciles + DOM mutates; browser re-evaluates snap-proximity + overflow-anchor; any transient offset during reconciliation gets snapped back to the nearest `.skill-sheet__row` anchor, producing perceived jitter.

**Suggested fix**: Same as F1 (removing `scroll-snap-type` resolves both).

---

## F3. Dotes — cannot fill general slot after class slot — major

**Symptom**: User fills class-bonus dote, then clicks a second feat expecting to fill general slot. Second click overwrites class-bonus pick. Counter stays at 1/2.

**Architecture**: `feat-sheet.tsx:347-416` renders two sections simultaneously:
- `[data-slot-section="class-bonus"]` (180 rows), `handleSelectClassFeat` wired
- `[data-slot-section="general"]` (219 rows), `handleSelectGeneralFeat` wired

Sequential pill state works (`"Ahora"` switches to general after class fills, `feat-sheet.tsx:350`), but visual class `feat-sheet__group--current` only swaps highlight — scroll position stays on class section.

**Evidence** (Elfo Guerrero L1, fresh fixture):
```
Initial:                    cPill="Ahora"   gPill="Pendiente"  counter 0/2
click carrera (class):      cNote="Carrera" cPill="Elegida"    gPill="Ahora"  counter 1/2
click twoweap (class):      cNote="Combate con dos armas"                     counter 1/2  (carrera OVERWRITTEN)
click aguante (general):    gNote="Aguante"                                   counter 2/2
```

**User perception**: clicking second feat "doesn't do anything" or "replaces the first" because the visual cue (pill color, current-section highlight) is subtle + the scroll stays on class section. User can't see the general section without scrolling.

**Suggested fix** (one of):
- Auto-scroll to `[data-slot-section="general"]` when class-bonus fills.
- Dim/collapse completed section; render only the active one.
- Keep both visible but add a prominent "Elegida" banner on completed section + viewport-nudge to active section.

---

## F4. Dotes — cannot deselect after completion — major

**Symptom**: Once all level-N dote slots fill, sheet unmounts and `<FeatSummaryCard>` replaces it (`apps/planner/src/features/feats/feat-summary-card.tsx`, Phase 12.4-07). Summary card shows chip list + single "Modificar selección" button. User's instinct to click a chip to deselect has no effect.

**Evidence**:
```
// After both slots filled:
hasSheet: false
hasSummary: true
summaryText: "Combate con dos armasAguanteModificar selección"
modifyBtn: "Modificar selección"
// Footer advances to next deficit: "Faltan 4 puntos de habilidad por gastar"
```

**Pre-completion toggle works** (`feat-sheet.tsx:270-288` — `handleSelectClassFeat` / `handleSelectGeneralFeat` detect re-click of current pick and call `clearClassFeat` / `clearGeneralFeat`). But collapse-on-complete hides those rows entirely.

**Suggested fix** (one of):
- Add dedicated × / "quitar" button per chip in `<FeatSummaryCard>`.
- Don't collapse while user remains on Dotes sub-step; only collapse when they advance to next level or sub-step.
- Make whole chip a toggle button that clears its slot on click.

---

## F5. Prestige gate — 2 classes fail OPEN + 1 too permissive — minor

**Symptom**: At L2 (Elfo Guerrero, BAB=2), prestige picker gates 19/21 classes with concrete prereqs. 2 classes render with no gate, 1 class gates too permissively.

**Evidence** (live DOM at L2, all 21 prestige rows):
```
shadowdancer: Requiere BAB ≥ 2           ← TOO PERMISSIVE (real req: +Move Silent 8 +Tumble 5 +Dodge +Mobility)
harper: Requiere 6 rangos de Engañar
arcane-archer: Requiere BAB ≥ 4
assassin: Requiere 8 rangos de Moverse sigilosamente
campeondivino: Requiere BAB ≥ 7
weaponmaster: Requiere BAB ≥ 5
pale-master: OPEN                         ← FAIL-OPEN (real req: non-good align + Hechizar 4 + Saber religion 2 + Toughness)
shifter: Requiere dote: Alerta
dwarven-defender: Requiere BAB ≥ 7
discipulodedragon: Requiere 8 rangos de Saber (arcano)
tirador-espesura: Requiere BAB ≥ 5
bribon-arcano: Requiere 6 rangos de Descifrar escritura
ladron-sombras-amn: Requiere 3 rangos de Engañar
caballero-arcano: OPEN                    ← FAIL-OPEN (real req: BAB + spellcasting)
shadowadept: Requiere 8 rangos de Saber (arcano)
teurgo: Requiere 6 rangos de Saber (religión)
orc-warlord: Requiere BAB ≥ 5
cavalier: Requiere BAB ≥ 8
archmage: Requiere 17 rangos de Saber (arcano)
```

**Root cause**: Phase 12.4-06 designed fail-closed `'Requisitos en revisión'` fallback when extractor enrichment missing. Current state shows pale-master + caballero-arcano have SOME prereq data (enough to skip fail-closed branch) but not ENOUGH to surface real gates — partial enrichment defaults to OPEN.

**Shadowdancer** has only BAB surfaced; feat + skill-rank prereqs missing from extractor output for this class.

**Suggested fix**:
- Tighten fail-closed branch: if prereq list is non-empty BUT known to be incomplete (feature flag or heuristic), still block.
- Enrichment pass over `compiled-classes.ts` for the 3 classes using the Puerta override pattern from `quick-260422-h9k` (harper/campeondivino/weaponmaster overrides).

**At L1**: all 21 prestige rows disabled with placeholder `Disponible a partir del nivel 2`. Copy is misleading (most need BAB 5+, not just L2) but functionally correct as a blanket L1 gate.

---

## F6. Race roster: Semielfo duplicated — minor

**Symptom**: Race picker shows 45 rows, Semielfo appears twice.

**Evidence**:
```
45 rows; duplicates = ["Semielfo"]
```

**Root cause**: Phase 12.1-02 landed `dedupeByCanonicalId` first-wins guard at `foundation-fixture.ts` — but extractor emits the second semielfo row with a different canonical id path that escapes the dedupe key. `race:drow` duplicate was closed; `race:halfelf` analogous row still slips through.

**Suggested fix**: Audit `dedupeByCanonicalId` key derivation; add sub-race / variant disambiguation OR extend dedupe to label-collision detection.

---

## Fixture for reproduction

All findings reproducible via:
1. Clean `localStorage.clear() + indexedDB.deleteDatabase` + reload.
2. Pick Elfo → Neutral puro → Atributos Aceptar (default) → Clase Guerrero → Dotes.
3. F3/F4: in Dotes, click Carrera (class) then any other feat in the class section.
4. F1/F2: switch to Habilidades — observe `selection-screen__content.scrollTop=206` + +/- triggers jitter.
5. F5: spend 4 skill points → advance to L2 → Clase step → inspect prestige section.
6. F6: on first Raza selection screen, visually scan for duplicate Semielfo.

---

## Suggested scoping for Phase 12.8

Priority order:
1. **F1 + F2 (Habilidades scroll-snap)** — one CSS removal + useLayoutEffect re-target. Single plan. User-visible every Habilidades open.
2. **F3 + F4 (Dotes multi-slot UX)** — auto-scroll to active section + summary-chip deselect. Single plan, 2 waves.
3. **F5 (Prestige fail-closed tightening + 3-class enrichment)** — plan.
4. **F6 (Semielfo dedupe)** — quick task, not a plan.
