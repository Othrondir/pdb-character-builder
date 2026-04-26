# Requirements: NWN 1 Character Builder — v1.1

**Defined:** 2026-04-26
**Milestone:** v1.1 Tech-Debt Closure
**Core Value:** A player can build a Puerta de Baldur character from level 1 to 20 with strict server-valid validation and share that exact build reliably. _(Carry-forward from v1.0; range 1-20 unchanged.)_

> v1.0 frozen requirements at `.planning/milestones/v1.0-REQUIREMENTS.md` (37/37 active satisfied + 5 descoped).

## v1.1 Requirements

### Dotes (feat engine completion)

- [x] **FEAT-05**: El catálogo extraído surface bonus-feat schedules per class (`cls_bfeat_*.2da`) y `feat-eligibility.ts` consume el contrato sin TODOs (cierra Phase 06 L45 TODO). _(Plan 16-01 done 2026-04-26 — `1ad9a36` — extractor field shipped. Plan 16-02 done 2026-04-26 — `7475bfb` — consumer wired with D-01 precedence; LEGACY_CLASS_BONUS_FEAT_SCHEDULES is fallback only. Plan 16-03 done 2026-04-26 — `0830364` — D-05 round-trip regression lock.)_
- [x] **FEAT-06**: Humano L1 ofrece la dote de bonus extra del servidor — store capacity 2→3 slots, advance ActionBar resuelve `legal` cuando los 3 slots están llenos (cierra Phase 06 L49 TODO + Phase 12.4 known limitation). _(Plan 16-02 done 2026-04-26 — `f090ed2` — race-bonus card + chip + onDeselect dispatch; Mediano Fortecor included per D-06. Plan 16-03 done 2026-04-26 — `0830364` — D-05 round-trip regression lock + share-URL invariant locked.)_

### Atributos (point-buy enrichment)

- [ ] **ATTR-02**: El planner consume curvas de coste point-buy diferenciadas por raza desde el extractor (Puerta snapshot override o 2DA enrichment) en lugar de la curva uniforme actual (cierra UAT-2026-04-20 A1).

### Quick-Task Triage

- [ ] **TASK-01**: Quick task `260425-q1m-revisar-dotes-de-brujo-y-corregir-select` triaged — directorio `.planning/quick/` revisado, hallazgos cerrados o promovidos a phase plans.
- [ ] **TASK-02**: Quick task `260425-qzv-alinear-auto-dotes-por-clase-con-el-list` triaged — directorio revisado, hallazgos cerrados o promovidos.
- [ ] **TASK-03**: Quick task `260425-r5j-anadir-scroll-al-panel-de-progresion-1-2` triaged — directorio revisado, hallazgos cerrados o promovidos.

### Test Infrastructure

- [ ] **INFRA-01**: `@playwright/test` instalado en `package.json`; Phase 12.4-09 SPEC R9 e2e migrada del fallback RTL a Playwright real con harness reutilizable para futuras phases.

## Future Requirements (deferred to v1.2 / v2)

- P5 level-table redesign (open UX, requires design discussion)
- Nyquist VALIDATION.md systemic coverage (process audit, separate sweep)
- DEF-12.4-02 design-token hygiene (font-weight:700 cleanup at app.css:113)

## Out of Scope (v1.1)

- Greenfield features — v1.1 is bug/tech-debt closure only
- ~~MAGI-01..04~~ domain/spell pickers — descoped to v2 (Phase 07.2 product pivot)
- ~~CHAR-03~~ deity picker — descoped to v2 (server manages via scripts)
- Backend integration, accounts, cloud persistence — out of v1 scope altogether

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| FEAT-05 | 16 | Done (16-01 extractor + 16-02 consumer + 16-03 regression lock) |
| FEAT-06 | 16 | Done (16-02 race-bonus surface + 16-03 D-05 round-trip lock) |
| ATTR-02 | 17 | Not started |
| TASK-01 | 18 | Not started |
| TASK-02 | 18 | Not started |
| TASK-03 | 18 | Not started |
| INFRA-01 | 19 | Not started |

**Coverage:** 7 active REQ-IDs / 4 phases / 100% mapped.
