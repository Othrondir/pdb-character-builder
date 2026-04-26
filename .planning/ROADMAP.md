# Roadmap: NWN 1 Character Builder

## Milestones

- ✅ **v1.0 MVP** — Phases 1-15 (shipped 2026-04-26) — see `.planning/milestones/v1.0-ROADMAP.md`
- 📋 **v1.1** — Phase 16 + carry-forward UAT residuals (planned)

## Phases

<details>
<summary>✅ v1.0 MVP — SHIPPED 2026-04-26 (27 phases / 99 plans)</summary>

- [x] Phase 1: Canonical Puerta Dataset (3/3) — 2026-03-30
- [x] Phase 2: Spanish-First Planner Shell (3/3) — 2026-03-30
- [x] Phase 3: Character Origin & Base Attributes (2/2) — 2026-03-30
- [x] Phase 4: Level Progression & Class Path (3/3) — 2026-03-30
- [x] Phase 5: Skills & Derived Statistics (4/4) — 2026-03-31
- [x] Phase 5.1: Data Extractor Pipeline (INSERTED) (5/5) — 2026-04-15
- [x] Phase 5.2: UX Overhaul (INSERTED) (8/8)
- [x] Phase 6: Feats & Proficiencies (2/2)
- [x] Phase 7: Magic & Full Legality Engine — Superseded by Phase 07.2
- [x] Phase 7.1: Shell Narrow Viewport Nav Fix (INSERTED) (1/1) — 2026-04-17
- [x] Phase 7.2: Magic UI Descope (INSERTED) (14/14) — 2026-04-17
- [x] Phase 8: Summary, Persistence & Shared Builds (6/6) — 2026-04-18
- [x] Phase 9: Verification + Traceability Closure (GAP) (6/6) — 2026-04-18
- [x] Phase 10: Integration Fixes (GAP) (3/3) — 2026-04-18
- [x] Phase 11: UAT + Open-Work Closure (GAP) (3/3) — 2026-04-18
- [x] Phase 12: Tech Debt Sweep (GAP) (2/2) — 2026-04-18
- [x] Phase 12.1: Roster Wiring & Overflow Fixes (INSERTED) (3/3) — 2026-04-18
- [x] Phase 12.2: Roster Detail & Race Ability Modifiers (INSERTED) (4/4) — 2026-04-18
- [x] Phase 12.3: UAT Correctness Closure (INSERTED) (6/6) — 2026-04-19
- [x] Phase 12.4: Construcción Correctness & Clarity (INSERTED) (9/9) — 2026-04-20
- [x] Phase 12.6: UAT-2026-04-20 Residuals (INSERTED) (10/10) — 2026-04-20
- [x] Phase 12.7: UAT-2026-04-20 Post-12.6 Residuals (INSERTED) (4/4) — 2026-04-20
- [x] Phase 12.8: UAT-2026-04-23 Residuals (INSERTED) (4/4) — 2026-04-24
- [x] Phase 12.9: Resumen (Hoja de personaje) UX Pass (INSERTED) (2/2) — 2026-04-24
- [x] Phase 13: Verification + Orphan Sweep (GAP) (7/7) — 2026-04-24
- [x] Phase 14: Persistence Robustness (GAP) (6/6) — 2026-04-25
- [x] Phase 15: A11y + Modal Polish (GAP) (3/3) — 2026-04-26

Full phase detail: `.planning/milestones/v1.0-ROADMAP.md`.

</details>

### 🚧 v1.1 Tech-Debt Closure — In Progress

- [x] Phase 16: Feat Engine Completion (GAP) — FEAT-05 bonus-feat schedules from `cls_bfeat_*.2da` extraction + FEAT-06 Humano L1 extra slot (store capacity 2→3). _Done 2026-04-26 — 3/3 plans (16-01 `1ad9a36`, 16-02 `f090ed2`, 16-03 `0830364`)._
- [ ] Phase 17: Per-Race Point-Buy (GAP) — ATTR-02 curvas de coste point-buy diferenciadas por raza desde extractor.
- [ ] Phase 18: Quick-Task Triage (GAP) — TASK-01/02/03 triage de q1m bruja dotes + qzv auto-dotes + r5j scroll progresión.
- [ ] Phase 19: Test Infra (GAP) — INFRA-01 `@playwright/test` install + Phase 12.4-09 R9 e2e migrada del fallback RTL.

## Phase Details

### Phase 16: Feat Engine Completion (GAP)
**Goal:** Cerrar TODOs de bonus feats en `feat-eligibility.ts` y resolver Humano L1 advance gate.
**Depends on:** v1.0 baseline.
**Requirements:** FEAT-05, FEAT-06
**Success Criteria:**
1. `feat-eligibility.ts:45` TODO cerrado: bonus feat schedules emergen del extractor (`cls_bfeat_*.2da`).
2. `feat-eligibility.ts:49` TODO cerrado: Humano L1 recibe el slot de bonus feat extra.
3. Humano L1 `<LevelEditorActionBar>` resuelve `status: 'legal'` con 3 slots llenos (store capacity 2→3).
4. Vitest cobertura para ambos paths + regression lock en Humano L1 advance.
**Plans:** 3 plans (3/3 complete) — **PHASE 16 COMPLETE**
- [x] 16-01-PLAN.md — Extractor surfaces `bonusFeatSchedule: number[] | null` from `cls_bfeat_*.2da` (FEAT-05). _Done 2026-04-26 — `1ad9a36`._
- [x] 16-02-PLAN.md — Race-aware `determineFeatSlots` + "Dote racial" UI section (FEAT-05 consumer + FEAT-06; D-06 covers Humano + Mediano Fortecor). _Done 2026-04-26 — `f090ed2`._
- [x] 16-03-PLAN.md — D-05 persistence round-trip regression spec (no `schemaVersion` bump). _Done 2026-04-26 — `0830364`._

### Phase 17: Per-Race Point-Buy (GAP)
**Goal:** Reemplazar curva uniforme `ability-budget.ts` por curvas por raza desde extractor.
**Depends on:** Phase 16 (feat engine baseline).
**Requirements:** ATTR-02
**Success Criteria:**
1. Extractor surface coste point-buy por raza (Puerta snapshot override o 2DA enrichment, fail-closed si raza no enriched).
2. `ability-budget.ts` consume catálogo enriquecido en lugar de curva uniforme.
3. Atributos board refleja coste correcto al subir/bajar atributo según raza activa.
4. Specs cubren al menos 3 razas con curvas distintas + regression sobre razas no-enriched (curva legacy preservada).
**Plans:** TBD via `/gsd-plan-phase 17`.

### Phase 18: Quick-Task Triage (GAP)
**Goal:** Cerrar 3 directorios quick task untracked de 2026-04-25.
**Depends on:** v1.0 baseline.
**Requirements:** TASK-01, TASK-02, TASK-03
**Success Criteria:**
1. `260425-q1m-revisar-dotes-de-brujo-y-corregir-select` revisado — hallazgos cerrados o promovidos a phase plan; directorio movido a `.planning/quick/closed/` o eliminado.
2. `260425-qzv-alinear-auto-dotes-por-clase-con-el-list` revisado — idem.
3. `260425-r5j-anadir-scroll-al-panel-de-progresion-1-2` revisado — idem.
4. STATE.md `Quick Tasks Completed` table actualizada con commits o status final.
**Plans:** TBD via `/gsd-plan-phase 18`.

### Phase 19: Test Infra (GAP)
**Goal:** Instalar `@playwright/test` y migrar Phase 12.4-09 R9 e2e del fallback RTL a Playwright.
**Depends on:** Phases 16-18 (cierre carry-forward antes de modernizar infra).
**Requirements:** INFRA-01
**Success Criteria:**
1. `@playwright/test` instalado en `package.json` devDependencies; `playwright.config.ts` configurado para `tests/**/*.e2e.spec.ts`.
2. Phase 12.4-09 R9 e2e migrada — antiguo RTL fallback eliminado o etiquetado como acompañante.
3. Harness reutilizable documentado para futuras phases (helper functions, fixtures, page objects compartidos).
4. CI pipeline ejecuta Playwright suite verde en máquina limpia (smoke validation).
**Plans:** TBD via `/gsd-plan-phase 19`.

## Progress

| Milestone | Phases | Plans | Status | Shipped |
|-----------|--------|-------|--------|---------|
| v1.0 MVP | 27 | 99/99 | ✅ Shipped | 2026-04-26 |
| v1.1 Tech-Debt Closure | 4 | 0 | 🚧 Planning | — |

**v1.1 Phase Order:** 16 → 17 → 18 → 19 (numbering continues from v1.0).
