# Phase 7: Magic & Full Legality Engine - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-16
**Phase:** 07-magic-full-legality-engine
**Areas discussed:** Workflow, Castings coverage, Recomputation trigger, Legality enforcement, Rule presentation, Spell mutation

---

## Area 1 — Workflow dominios/conjuros per-clase

| Option | Description | Selected |
|--------|-------------|----------|
| A. Pantalla unificada "Magia" | Ruta central con secciones por tipo, toggles per-clase | |
| B. Sub-pasos granulares por nivel | Sub-pasos `dominios`/`grimorio`/`conocidos`/`spells` separados por clase | |
| C. Sub-paso unificado `magia` por nivel | Un sub-paso por nivel que renderiza sólo lo relevante para la clase del nivel | ✓ |

**User's choice:** C
**Notes:** Conserva el flujo wizard-style de Phase 05.2. Contexto per-nivel, menos clicks, encaja con la density/step existente.

---

## Area 2 — Alcance MVP castings

| Option | Description | Selected |
|--------|-------------|----------|
| A. Full roster | Todas las clases casting en v1 | ✓ |
| B. Core casters first | Cleric + wizard + sorcerer + druid; paladin/ranger en fase 7.5 | |
| C. Cleric + arcane only | Cleric + wizard + sorcerer; excluir druid/bard/paladin/ranger en v1 | |

**User's choice:** A
**Notes:** `spellGainTables` del catálogo compilado ya cubre toda la roster. Excluir clases sería reducción artificial de scope.

---

## Area 3 — Trigger de recomputación global

| Option | Description | Selected |
|--------|-------------|----------|
| A. Auto on store commit | Zustand commit → selector derivado recomputa todo | ✓ |
| B. Explícito "Recomputar" button | Usuario pulsa para forzar | |
| C. Hybrid | Auto en atómicos, explícito en multi-edit | |

**User's choice:** A + Cascade
**Notes:** Consistente con Phase 04/05/06. Cascade preserva trabajo del usuario — cambio en nivel N marca downstream como repair_needed en lugar de borrar.

---

## Area 4 — Bloqueo vs warning en builds ilegales

| Option | Description | Selected |
|--------|-------------|----------|
| A. Hard block | Cualquier ilegalidad = selección rechazada, no guardable | |
| B. Soft block | Guardable con marker rojo + razón inline | |
| C. Hybrid | Hard para prereqs duros, soft para runtime capacity, gate en share/export | ✓ |

**User's choice:** C
**Notes:** Hard block para class level requirements / alignment / race restrictions / ability prereqs / spell prereq chains. Soft block (repair_needed) para slot overflow / known-spell overflow / domain mismatch. VALI-01 satisfecho por gate en share/export, no por bloquear runtime capacity.

---

## Area 5 — Presentación reglas en español

| Option | Description | Selected |
|--------|-------------|----------|
| A. Tooltip on hover/focus | Compacto pero mal para textos largos y móvil | |
| B. Panel inline por fila expandible | Click despliega descripción bajo la fila | |
| C. Panel detail lateral | Click selecciona + detail en panel derecho (patrón Phase 03) | ✓ |
| D. Híbrido tooltip + detail | Short tooltip + detail on extended click | |

**User's choice:** C
**Notes:** Dominios tienen párrafos largos. Phase 03 origin ya usa patrón detail panel. Mobile-friendly. Rejection reasons cortos (VALI-02) van inline bajo fila; detail completo en panel.

---

## Area 6 — Spell list mutation per-level

| Option | Description | Selected |
|--------|-------------|----------|
| A. Append-only + cascade repair | Conjuros fijos por nivel, cambios upstream marcan repair | |
| B. Full mutable | Edición libre en cualquier nivel | |
| C. Per-level editable + swap engine | Spells del nivel activo editables + swap explícito para sorcerer/bard | ✓ |

**User's choice:** C
**Notes:** Fiel a NWN EE (swap es regla oficial). Integra con cascade (D-06). Wizard usa forget-and-replace en grimorio; prepared casters (paladín/ranger/cleric/druid) sin UI de selección. Complejidad media pero datos ya extraídos.

---

## Claude's Discretion

- Internal module layout within `packages/rules-engine/src/magic` and `apps/planner/src/features/magic`.
- Exact React component split (FeatBoard-style vs SkillBoard-style).
- Memoization strategy for derived magic legality selectors.
- Telemetry / debug logging surface (none required).

## Deferred Ideas

- Cross-dataset build validation UX — Phase 8 (SHAR-02).
- Per-day prepared spell configuration (runtime, not planner).
- Scribing cost / gold tracking for wizard spellbook.
- Metamagic feat deep-dive beyond catalog-declared slot modifiers.
- Spell VFX / iconography.
