---
captured: 2026-04-20
session: post-phase-12.4
tester: user (verbal UAT, browser tab 761726329 on http://127.0.0.1:5173/)
scope: Construccion flow — sequential gating, atributos racial logic, progresión picker/skills/feats/range
status: findings-only — route: P1 via /gsd-debug (CLAS-01 regression); remainder via /gsd-insert-phase 12.5
confirmed_scope_changes:
  - level_range: 1..16 → 1..20 (breaks CLAUDE.md Constraint; ripples buildDocumentSchema + share-URL + rules-engine + extractor + E2E)
live_dom_verification:
  - tab: 761726329 (http://127.0.0.1:5173/)
  - persisted_state: Raza Humano / Alineamiento Legal neutral / Atributos complete / L1 Guerrero is-legal
  - G1_live: level-rail buttons L2..L16 all disabled=false + class=level-rail__button is-pending — CONFIRMED unlocked despite upstream levels empty. Clicking L2 opens class picker without completing L1 further.
  - G2_live: button "Utilidades" present at div.creation-stepper__bottom > button.nwn-button.nwn-button--primary — CONFIRMED.
  - P1_live: After clicking L2 → document.querySelectorAll('[class*=class-picker__]').length === 0; document.querySelectorAll('.option-list__item').length === 39; single <section class="nwn-frame selection-screen"> heading "Selecciona la clase del nivel 2" with 39 flat items. No base/prestige split. CONFIRMED regression per STATE.md (commit 6389abe -X ours dropped JSX wiring in level-sheet.tsx).
---

# UAT Findings — 2026-04-20

Session immediately after Phase 12.4 closed functionally (9/9 plans). User dictated bugs section by section. Captured verbatim intent; candidate remediations flagged but not prescribed. Real plans emerge from `/gsd-spec-phase 12.5` + `/gsd-discuss-phase 12.5`. P1 peeled off to `/gsd-debug` because root cause already diagnosed in STATE.md.

## G — General

### G1 — Sequential gating across origin → progression

**User quote:** *"Por defecto el orden debe ser Raza, Alineamiento, atributos y seguidamente progresión, empezando por nivel 1, ninguna sección puede estar disponible si no está la anterior terminada, debemos poner algún elemento en la ui que señale correctamente u oscurezca para tener buen ui feedback de donde estamos, la progresión de niveles es critica para esto, no podemos rellenar el nivel 16 antes del 1"*

**Contract:**

- Fixed linear order: Raza → Alineamiento → Atributos → Progresión L1 → L2 → ... → L20.
- Each section locked (disabled + visually dimmed) until prior section complete.
- Within Progresión, each level locked until prior level complete.
- UI feedback: visual dim + disabled click + optional lock glyph on locked rows / stepper steps.

**Current behavior (STATE + 12.3 history):** Creation-stepper currently allows free navigation; LevelRail dispatch exists (12.3-02) but no gate prevents clicking L16 while L1 is empty.

**Candidate surfaces:**

- `apps/planner/src/features/shell/creation-stepper.tsx` — stepper nav gating
- `apps/planner/src/features/level-progression/level-rail.tsx` — per-level lock predicate
- `packages/rules-engine/src/progression/` — new `selectNextUnlockedLevel` / `selectStepGateStatus` selectors

### G2 — Remove "Utilidades" button from creation-stepper

**User quote:** *"el botón de utilidades no tiene razón de ser"*

**Contract:** Delete `Utilidades` step + route + any sidebar entry. Quick task 260419-47a pinned it to bottom of stepper grid; that pin stays as pattern but the step itself goes.

**Candidate surfaces:**

- `apps/planner/src/features/shell/creation-stepper.tsx` — remove step entry
- TanStack Router route tree — drop `/utilidades` (or equivalent) if present
- Shared copy under `shellCopyEs` — remove `Utilidades` label

---

## A — Atributos

### A1 — Point-buy cost varies per race

**User quote:** *"en cada raza el coste de puntos es distinto"*

**Contract:** Point-buy cost table is a function of the race. Current implementation uses a uniform NWN1 base-game cost curve (1:1 up to 14, 2:1 at 15-16, 3:1 at 17-18). Puerta de Baldur assigns different cost curves per race (evidence: server rules material, to verify via extractor-emitted race rows or Puerta snapshot).

**Open question (block spec):** Where does the per-race cost table live — compiled race catalog field (extractor must enrich) or Puerta-snapshot override file?

**Candidate surfaces:**

- `packages/rules-engine/src/foundation/ability-budget.ts` — parametrize `nextIncrementCost` by race
- `packages/data-extractor/` + Puerta snapshot — source data
- `compiled-races.ts` — add `pointBuyCurve` field (schema change)

**CLOSED-BY:** Phase 17 (per-race-point-buy)

**Disposition:** User claim of per-race variance was contradicted by user's own 2026-04-20 in-game verification + racialtypes.2da extraction; Phase 17 ships the engineering deliverable (extractor pipeline) on the truthful uniform curve.

**Evidence pointer:** `packages/rules-engine/src/foundation/data/puerta-point-buy.md § "Plan 06 Source Resolution"` (deleted in Phase 17 closeout commit; preserved via git history at commit `bf55129` and earlier 12.6 commits — accessible via `git log --follow --all -- packages/rules-engine/src/foundation/data/puerta-point-buy.md`).

### A2 — Race ability modifiers not folded into base attributes

**User quote:** *"no aplicamos los bonificadores que se especifican en la descripción de laraza"*

**Contract:** Race-granted ability modifiers (e.g. Elfo DEX +2 / CON −2, Enano CON +2 / CAR −2, Semiorco FUE +2 / INT −2 / CAR −2) must apply automatically to base attributes shown in the Atributos board.

**History:** This is CHAR-02 — previously flagged Phase 12.2-02 as "race ability modifiers never fold into attributes". Need to verify whether 12.2-02 shipped the selector but the UI never consumes it, or whether the work never landed, or whether it regressed.

**Candidate surfaces:**

- `apps/planner/src/features/attributes/selectors.ts` — compose base + race-mod derivation
- `apps/planner/src/features/attributes/attributes-board.tsx` — render derived total
- `packages/rules-engine/src/races/ability-modifiers.ts` — canonical source

---

## P — Progresión

### P1 — Base classes rendered as prestige (dark title)

**User quote:** *"Las clases básicas como clérigo, monje, paladin, mago, brujo, espadachin, alma predilecta, caballero de la luz, paladin vengador, paladin oscuro o artífice tienen el título oscuro, dando a entender que son clase de prestigio no seleccionable."*

**Root cause (already diagnosed — STATE.md):** Phase 12.4-06 R1 regression. `<ClassPicker>` component at `apps/planner/src/features/level-progression/class-picker.tsx` exists but NOT mounted in tree. Live DOM shows single `<section>`  with all 39 classes intermingled, legacy `option-list__item` className. Commit `6389abe fix(12.4-06): replay CSS namespace dropped by -X ours merge` hints `-X ours` merge strategy dropped JSX wiring in `level-sheet.tsx`. User perceives "clases básicas oscuras" because prestige-filter marks them `is-blocked` at L1 when mixed into a single flat list.

**Note:** User lists "Brujo, Espadachin, Alma Predilecta, Caballero de la Luz, Paladín Vengador, Paladín Oscuro, Artífice" as "básicas". These are Puerta-custom base classes (not core NWN1 base 11). Route: extend `BASE_CLASS_ALLOWLIST` in `packages/rules-engine/src/classes/base-class-allowlist.ts` (set in 12.2-03) with these canonical IDs — already planned as shrink-to-empty once extractor enriches prereqs.

**Route:** `/gsd-debug` — standalone mount-restore fix; does not need full spec.

**Partial resolution (2026-04-20):** `/gsd-debug class-picker-not-mounted` closed the mount gap. Root cause was `BuildProgressionBoard` (the component actually mounted by `center-content.tsx:33`), not `level-sheet.tsx` as first diagnosed. Fix: swap `<OptionList>` → `<ClassPicker>` in `build-progression-board.tsx`; migrate 3 phase-04 RTL tests from `role="option"` + `.is-blocked` (OptionList) contract to `[data-class-id]` + `aria-disabled="true"` (ClassPicker). Follow-on CSS: `.class-picker__list { max-height: 34vh; min-height: 0 }` to cap list heights within the `.selection-screen__content` grid cell (session evidence: before cap, list0=684px + list1=1560px → parent grid overflowed; after cap, each list 292px with internal scroll). Suite 629/630 baseline mantenida (DEF-12.4-02 deferred).

**Residual sub-issues surfaced after mount fix (verified live on tab 761726329, 2026-04-20):**

- **P1-a** — `class:warlock` (Brujo) y `class:swashbuckler` (Espadachin) emitidos por extractor con `isBase: false` pese a que la descripción arranca con "CLASE BASICA". Resultado: aparecen en sección *Clases de prestigio* cuando deben ir en *Clases básicas*. Fix: patch compiled-classes.ts + overlay en `class-fixture.ts` forzando `isBase: true` vía kind, o extractor fix en data-extractor que detecte la marca textual "CLASE BASICA" (o via PreReqTable pattern — Brujo/Espadachin tienen `PreReqTable` presente, otras base no).

- **P1-b** — `class:cleric` aparece disabled en *Clases básicas* porque `CLASS_SERVER_RULE_OVERLAY['class:cleric'].implementedRequirements = { requiresDeity: true }` (apps/planner/src/features/level-progression/class-fixture.ts:168-170) y `foundation.deityId === null` siempre (Puerta maneja deidades vía scripts, no 2DA — Phase 05.1 decision: "Deity catalog emitted as null"). El gate `class-entry-rules.ts:148-164` marca `status='blocked'` y el picker emite `aria-disabled='true'`. Fix: eliminar overlay de cleric (o el campo `requiresDeity` del overlay) + actualizar `tests/phase-12.2/prestige-filter-l1.spec.ts:168-170` que assertea `cleric?.implementedRequirements.requiresDeity).toBe(true)`.

- **P1-c** — `class:almapredilecta` (Alma Predilecta) y `class:artifice` (Artífice) emitidos correctamente con `isBase: true` pero NO están en `BASE_CLASS_ALLOWLIST` (class-fixture.ts:142-154, 11-class classic allowlist). Resultado: flagged con `DEFERRED_LABEL_UNVETTED_BASE` = `'Prerrequisitos específicos del servidor. Revisa las dotes, nivel de lanzador o atributos requeridos.'` → row disabled en *Clases básicas*. Fix: extender `BASE_CLASS_ALLOWLIST` para incluir canonical IDs Puerta custom base: `class:almapredilecta`, `class:paladin-antiguos` (Caballero de Luz), `class:paladin-oscuro`, `class:paladin-vengador`, `class:artifice`, `class:warlock` (post-P1-a), `class:swashbuckler` (post-P1-a). Allowlist pasa de 11 → 18. STATE.md Phase 12.2-03 decision note: "allowlist shrinks to empty in lockstep" ← todavía válido pero escala con extractor enrichment; ampliar ahora es el paso intermedio correcto.

- **Note consolidación:** P1-a/b/c no son el bug original (mount ya arreglado). Son gaps de data model / server overlay que el picker revela. Scope = fix-phase 12.5 junto al resto.

### P2 — Auto-advance class → habilidades

**User quote:** *"cuando seleccionas la clase, debería llevarte automaticamente a habilidades"*

**Contract:** After user picks class at level N, the sub-step pointer advances to `skills` automatically (equivalent to current advance-to-next-level dispatch but at sub-step granularity). Mirrors pattern from 12.4-09 `<LevelEditorActionBar>` atomic dispatch, but intra-level.

**Candidate surfaces:**

- `apps/planner/src/features/level-progression/class-picker.tsx` — onSelect hook
- `apps/planner/src/stores/level-sub-step-store.ts` — `setActiveLevelSubStep('skills')` after class set
- Conflict: 12.4-09 locks `setActiveLevelSubStep('class') FIRST` on L→L+1 advance. Intra-level N→skills is a different code path.

### P3 — Skill points per class × INT modifier

**User quote:** *"las habilidades y el numero de puntos asignados es distinto dependiendo de la clase y la inteligencia"*

**Contract:** Skill points per level = `(class.skillPointsPerLevel + intModifier) × (level === 1 ? 4 : 1)`; human race gets +1 per level. Floor at 1.

**Current behavior:** Per `.planning/STATE.md` 12.3-03 ("per-level Dotes gate + slotPrompt") and Phase 12.4-03 feat-slot budget selectors, per-level math exists for feats but the analogous skill-point budget selector may be missing or uniformly 4 per level.

**Candidate surfaces:**

- `packages/rules-engine/src/skills/skill-point-budget.ts` — new selector or verify existing
- `apps/planner/src/features/skills/skills-board.tsx` — consume selector
- `compiled-classes.ts.skillPointsPerLevel` — verify extractor emits per class

### P4 — Feat toggle bug: can pick, cannot un-pick

**User quote:** *"las dotes puedes elegir las que quieras en cada nivel y luego no puedes volver a dejarla (errores internos y visuales)"*

**Contract:** Feat rows must be toggleable — user picks, sees it fill slot, clicks again to release slot. Current behavior (per quote): pick works, un-pick broken + produces console errors + visual regressions.

**Candidate surfaces:**

- `apps/planner/src/features/feats/feat-picker-row.tsx` — onClick toggle
- `apps/planner/src/stores/feat-store.ts` — `toggleFeat` vs `selectFeat` dispatch
- `apps/planner/src/features/feats/selectors.ts::selectFeatBoardView` — `rowState` may hard-lock chosen rows as `blocked-already-taken` without allowing un-select on own active-level pick

**Likely culprit:** 12.4-07 added `findAlreadyTakenAtLevel` that excludes activeLevel to keep user's own pick toggleable — regression may be that the re-click path dispatches `selectFeat` (append) instead of `removeFeat` (un-select).

### P5 — Usability of level table / progression is bad

**User quote:** *"en general la usabilidad de la tabla de niveles y progresión es un desastre"*

**Contract:** Open-ended — requires `/gsd-discuss-phase` to converge. Likely includes:

- Compact per-level row showing class + feats + skills assigned inline
- Active-level edit-in-place vs modal
- Visual diff between legal/incomplete/invalid levels
- Better scan pattern for 20 levels on a single screen

**Route:** Cannot spec without discuss. Separate plan from P1..P4 which have concrete contracts.

### P6 — Level range L16 → L20

**User quote:** *"debemos añadir hasta el nivel 20 en progresión"*

**Confirmed:** User confirmed scope change 2026-04-20. Breaks CLAUDE.md Constraint "Initial Level Range: 1-16".

**Impact surface:**

- `packages/rules-engine/` — BAB / saves / XP tables extended to row 20
- `compiled-classes.ts` — per-class level-feature grants L17..L20 (extractor must emit; some prestige classes cap < 20 and stay fail-closed beyond cap)
- `apps/planner/src/features/level-progression/level-rail.tsx` — render 20 slots
- `apps/planner/src/features/level-progression/level-sheet.tsx` — L20 terminal short-circuit replaces L16 null (12.4-09 contract)
- `packages/rules-engine/src/share-url/buildDocumentSchema` — per-level array cap
- share-URL payload budget — verify fflate+base64url still fits under hard length budget at L20
- `apps/planner/src/stores/*` — any hardcoded `level < 16` / `level === 16` predicates
- All E2E fixtures with `advance-to-level-{N+1}` — extend to L20
- `ROADMAP.md` Core Value statement + CLAUDE.md Constraint line
- `PROJECT.md` Requirements section

**Open questions (block spec):**

- OQ-P6-1: Class-feature table rows for L17..L20 — does extractor already emit them from `classes.2da` / per-class `.2da`, or do we cap existing tables at current row count? (If capped: need extractor pass.)
- OQ-P6-2: Share-URL budget — current budget assumes 16 per-level entries; does 20 push over the URL-length ceiling? If so, fallback to JSON export earlier.
- OQ-P6-3: XP / BAB / save progression for characters above L16 on PDB server — does Puerta match base NWN1 extrapolation (L20 BAB = full/20, 3/4/20, 1/2/20) or apply a server-specific curve?

---

## Routing

**Step 1 (immediate):** `/gsd-debug` for P1 — already diagnosed (mount restore `<ClassPicker>` in `level-sheet.tsx`), single-file fix, blocks milestone v1.0 audit.

**Step 2:** `/gsd-insert-phase 12.5` — "construccion-gating-cost-range" — covers G1, G2, A1, A2, P2, P3, P4, P5, P6.

**Step 3:** `/gsd-spec-phase 12.5` → lock falsifiable requirements + resolve OQ-P6-1..3 + OQ-A1 + OQ-P5 (discuss scope).

**Step 4:** `/gsd-discuss-phase 12.5` → gray areas (P5 redesign scope, A1 source data, P6 share-URL budget).

**Step 5:** `/gsd-plan-phase 12.5` → wave breakdown (likely: Wave 1 gating+cleanup G1+G2+A2; Wave 2 cost curve A1 + P3 skill budget; Wave 3 P2+P4 feat/class dispatch; Wave 4 L20 expansion P6; Wave 5 P5 redesign).

**Step 6:** `/gsd-execute-phase 12.5`.

---

## Not in scope this sweep

- Hygiene fold `font-weight: 700` at `app.css:113` (DEF-12.4-02) — remains deferred until milestone close.
- Human UAT re-sweep of 2026-04-19 F1..F8 + X1 — run AFTER 12.5 lands.
- Full `/gsd-verify-work 12.4` programmatic sweep — run AFTER P1 debug lands (will otherwise flag R1 anchor assertion).
