---
captured: 2026-04-19
session: post-milestone-v1.0
tester: user (in-browser UAT, http://localhost:5173/)
scope: Construccion flow — progression picker, skills, feats, per-level gating
status: findings-only — awaiting phase scoping (proposed Phase 12.4)
---

# UAT Findings — 2026-04-19

Collected during in-browser sweep immediately after quick task `260419-68b` (atributos layout). User flagged five cross-cutting issues in the Construcción flow. Each finding includes evidence, user quote, and a candidate remediation — not a prescriptive plan. Real plan will emerge from `/gsd-spec-phase 12.4` or `/gsd-discuss-phase 12.4`.

## Scenario

- Raza: Humano · Alineamiento: Neutral puro · Atributos: custom (FUE 9, DES 18, CON 17, INT 8, SAB 8, CAR 8)
- Progression rail: 1..16 empty, clicked `1` to open L1 sub-steps
- Default class auto-seeded to **Explorador** before user confirmed — Clase sub-step already ✓ on entry.
- Habilidades + Dotes sub-steps also showed ✓ on entry without user interaction.

---

## F1 — Class picker intermingles base + prestige, no gating at L1

**User quote:** *"en la sección de progresión, las clases rebosan en el div, deberíamos ordenar clases básicas arriba del listado y las de prestigio (no seleccionable si no alcanzas objetivos) seguidamente en el mismo"*

**Evidence (screenshots ss_3901nhena, ss_14862mn9i):**

At L1 picker, the class list is alphabetic-ish but mixes eleven NWN base classes with every prestige class the extractor emitted, all as equally clickable rows:

```
Bárbaro, Bardo, Clérigo, Druida, Guerrero, Monje, Paladín, Explorador,
Pícaro, Hechicero, Mago,                                           ← base 11
Danzarín sombrío, Agente Custodio (Arcano), Arquero arcano, Asesino,
Campeón divino, Maestro de armas, Maestro de la lividez, Cambiante,
Enano defensor, Discípulo de dragón, Tirador de la espesura,
Bribón arcano, Ladrón Cofrade, Caballero arcano, Adepto Sombrio (Arcano),
Teúrgo Místico, Señor de guerra Muranni, Cavalier, Archimago,
Berseker Frenético, Brujo, Espadachin, Alma Predilecta, Caballero de Luz,
Paladin Oscuro, Paladin Vengador, Maestro de múltiples formas, Artífice…
                                                                   ← prestige
```

Each prestige row is plainly selectable at L1 despite NWN 1 rule that prestige classes are unreachable at L1 (they all require BAB/skill-rank/feat prereqs earned across prior levels).

**Candidate remediation:**
- Separate into two explicit groups (`Clases básicas` / `Clases de prestigio`) with group headers inside the same picker.
- Disable prestige rows that fail the prerequisite check for the currently-being-edited level. Keep them visible + display the unmet prereq inline ("Requiere BAB ≥ 5", "Requiere 8 rangos de Sigilo", etc.).
- At L1 specifically, every prestige row is disabled.

**Related:** Requires `F3` correctness so the gate reads accurate BAB/skill-rank/feat state per level.

---

## F2 — No "continue to next level" advance affordance

**User quote:** *"también creo que sería mejor que hubiera un botón que te informase sobre `Continuar al siguiente nivel` o `Faltan dotes que asignar en este nivel`"*

**Evidence (screenshots ss_7058xh7tn Habilidades view, ss_306303aoj Dotes view):**

After Atributos step, the per-level editor surfaces three sub-steps (Clase / Habilidades / Dotes) on the left rail but no contextual forward-advance button inside any of them. The user has to know to click the next numbered level in PROGRESION to move forward. There is nothing that tells them whether the current level's allocation is complete.

**Candidate remediation:**
- Add a contextual action button inside the level editor footer.
- Label toggles based on completion state:
  - `Continuar al nivel 2` when all slots (class, feat slots, skill points) satisfied for current level.
  - `Faltan {N} dotes que asignar en este nivel` disabled-state when feat slots unfilled.
  - `Faltan {N} puntos de habilidad por gastar` when skill-point budget not spent.
  - Plural-aware Spanish copy.
- Button mirrors ActionBar pattern already used in Atributos (`Aceptar` → set next step).

**Related:** Requires `F3` — feat slot + skill point math must be authoritative per level before the button label can reflect truth.

---

## F3 — Per-level feat slot + skill point math — correctness unclear

**User quote:** *"tenemos que calcular bien las dotes y puntos de habilidad en cada nivel porque si no, no podemos saber cuando podemos poner la clase de prestigio bien"*

**Evidence:**
- Habilidades view shows a long list of skills with per-row `- 0 +` steppers and `Tope: 2 / Tope: 4` caps. No running total visible (`X de Y puntos asignados`).
- Dotes view shows `Completa una progresion valida en Construccion para seleccionar dotes por nivel.` in the right-hand detail panel but no slot counter in the list (`0 de 1 dotes seleccionadas`).
- Whether the math correctly accounts for: Humano bonus feat at L1, bonus skill points at L1 (`4× (class+INT mod)` per NWN rule), class-specific bonus feats (Guerrero L1/L2, Mago L1+L5+L10+L15/L20), class-specific bonus skill points (Explorador, Pícaro INT-based), all across levels 1..16 — is not observable from the UI alone. Code audit required.

**Candidate remediation:**
- Code-level audit of `rules-engine/foundation/` + `rules-engine/level-progression/` helpers that compute feat slots and skill points per level.
- Expose computed slot counts + budgets in the UI (header strip: `Dotes: 0/1 elegidas · Puntos de habilidad: 0/24 asignados`).
- Add fixture-driven regression tests asserting L1..L16 slot/budget values for canonical builds (single-class Guerrero, Humano+Explorador, multiclass Guerrero-Pícaro-Explorador, etc.).
- Gate prestige class entry on the computed state so `F1`'s disabled-prestige predicate is evidence-based.

---

## F4 — Habilidades does not visually separate class vs cross-class skills

**User quote:** *"también veo que las habilidades deberían estar separadas en clase y doble coste, diferenciadas"*

**Evidence (screenshot ss_7058xh7tn):**

Skills render alphabetically in a single list. Each row shows a muted tag string inline:
- `Abrir cerraduras  Transclase Solo entrenada`  → cross-class, trained-only
- `Artesanía  Clase`  → class skill (cost 1 rank / 1 pt at L1)
- `Averiguar intenciones  Transclase`  → cross-class (cost 1 rank / 2 pts)
- etc.

Tags are 12px muted grey, effectively invisible against the dark panel. User cannot at-a-glance distinguish which skills are worth 1pt vs 2pt per rank.

**Candidate remediation:**
- Group skills under two explicit sections with headers: `Habilidades de clase` (cost 1) and `Habilidades transclase` (cost 2, x4 ranks allowed).
- Add a visual treatment (left gold accent bar, slightly different background, or ruleset-inspired icon) distinguishing the groups beyond the tiny tag text.
- Keep `Solo entrenada` as a per-row badge (trained-only skills are orthogonal to class/cross-class).
- Reflect cost in the `+` button tooltip or a per-row hint: `Coste por rango: 1 pt` / `Coste por rango: 2 pts`.

---

## F5 — Dotes list lacks selectability clarity + no "hide when complete" behavior

**User quote:** *"las dotes también tienen muchos errores de estilo y usabilidad, no queda claro que puedes escoger o no, debería ocultarse el listado cuando selecciones las dotes que necesitas en ese nivel"*

**Evidence (screenshots ss_306303aoj, ss_0526ytnfz):**

Dotes panel at L1:
- Left column: search input + `DOTES GENERALES` heading + flat alphabetic-ish list of every general feat (Alerta, Esquiva, Potenciar conjuro, Prolongar conjuro, Gran fortaleza, Impacto sin arma mejorado, Voluntad de hierro, Reflejos rápidos, Maximizar conjuro, Disparo a bocajarro, Competencia con escudo, Conjurar en silencio, Soltura con una habilidad, Soltura con una escuela de magia, Conjurar sin moverse, Dureza, …).
- Only `Esquiva` shows a prereq badge `|Destreza 13|` (correctly displayed — DES 18 qualifies). No other row shows whether it is pickable.
- No visible "0 de N dotes elegidas" counter.
- Hovering the `Esquiva` detail opens a right-panel description — working.
- After the user selects a feat, the list does NOT collapse or hide — stays at full length, no done-state indicator.

**Candidate remediation:**
- **Visibility policy (locked):** unavailable feats MUST remain visible with explicit unmet-requirement copy. Rationale — user needs forward-planning visibility (*"I want Disparo Preciso at L4, which BAB do I need?"*). Hiding unreachable feats destroys that affordance. User quote (2026-04-19): *"también deben aparecer dotes no disponibles, pero que dejen claro sus requisitos"*.
- Per-row selectability state:
  - `selectable` — normal clickable state
  - `blocked-prereq` — muted, inline reason (`Requiere BAB ≥ 1`, `Requiere 8 rangos de Sigilo`, `Requiere dote: Esquiva`). Row stays visible + non-clickable.
  - `blocked-already-taken` — muted, badge `Ya seleccionada`. Row stays visible.
  - `blocked-budget` — muted once all L-level slots filled. Row stays visible.
- Slot counter in panel header: `Dotes del nivel {N}: {chosen}/{slots}`.
- When `chosen === slots`, collapse list body and replace with a summary card:
  - `Has elegido todas las dotes de este nivel — {feat1}, {feat2}`.
  - `Continuar al nivel {N+1}` button (ties to `F2`).
  - Small "Modificar selección" link expands list again.
- Carry the search input inside the collapsed summary too so advanced users can hotswap without re-opening the full list.
- Category buckets inside the list (`Generales`, `Metamágicas`, `Creación de objetos`, `Combate`, `De clase`, `De raza`) — the current list clearly mixes metamágicas (Potenciar/Prolongar/Maximizar conjuro, Conjurar en silencio/sin moverse) with generals (Alerta, Esquiva).

---

## F6 — "Soltura" feat family expanded row-per-variant instead of grouped

**User quote:** *"las solturas deberen estas agrupadas en un modal o algo así por tipo, desplegarlas todas es muy poco inteligente"*

**Evidence (screenshots ss_306303aoj, ss_14862mn9i):**

Within `DOTES GENERALES`, "Soltura" variants render as one row per target:
- `Soltura con una habilidad (Trato con los animales)`
- `Soltura con una escuela de magia (Abjuración)`
- …and by NWN rules, the same pattern multiplies across every skill (39 rows), every spell school (8 rows), plus likely weapon variants — inflating the list enormously with near-identical labels.

Each row looks distinct in the flat list but they all share the same base feat with a target parameter. The user cannot scan the list efficiently; the interesting choice ("I want Soltura") is buried under the target disambiguation.

**Candidate remediation:**
- Collapse each Soltura family into one canonical row: `Soltura con una habilidad`, `Soltura con una escuela de magia`, etc.
- Clicking a family row opens a secondary picker (modal, inline expander, or sub-list) scoped to the valid targets, with the same prereq + selectability treatment from `F5`.
- Internally, the selected feat stored still includes the specific target (`feat:skill-focus:animal-empathy`) so rules-engine logic is unaffected — this is purely a UI folding pattern.
- Pattern generalises to any feat with a parameter slot (weapon focus / greater weapon focus / weapon specialization, damage reduction tiers, etc.) — define a general "parameterized feat family" UI contract rather than one-off per family.

---

## F7 — DELETED / deprecated feat rows should not render

**User quote:** *"las dotes DELETED se deben borrar"*

**Evidence (user-observed in Dotes list):**

The extractor-emitted feats catalog ships rows whose label or status indicates they are marked `DELETED` (or equivalent deprecated / unused flag) upstream in the NWN 2DA source. These rows currently render in the picker as selectable/listed entries, polluting the catalog and confusing the picker.

**Candidate remediation:**
- Extractor filter: during `assembleFeatCatalog`, drop 2DA rows whose `Label` or `Description` string equals `DELETED`, `***DELETED***`, `UNUSED`, or equivalent convention. Verify which sentinel the source actually uses (likely `****` padding rows + explicit `DELETED` strings).
- Belt-and-braces UI filter: the feat selector predicate additionally skips any canonical id whose display name hits those sentinels even if they leak through the extractor.
- Regression test asserts the feats catalog contains zero rows with sentinel labels after a fresh extraction, and the picker renders none.
- Check skill + class + race catalogs for the same sentinel pattern while we are there (same root cause — blind 2DA emission).

---

## F8 — Dotes scroll container attached to description panel instead of list column

**User quote:** *"el scroll de las dotes, debería estar en la columna de las dotes, no en la descripción de las dotes"*

**Evidence (screenshots ss_306303aoj, ss_14862mn9i):**

In the Dotes route, overflow-y scrolling attaches to the right-hand detail / description panel (the area that shows "Tipo de dote / Prerrequisito / Detalles / Uso" when a feat is hovered). The left-hand feat list, which is the longer scrollable surface, does not own its own scrollbar — instead the whole two-column area scrolls together, and the description column is what visually moves.

This is inverted: the list is the primary navigation surface and must scroll independently; the description panel should stay pinned (or scroll internally if its own content exceeds viewport).

**Candidate remediation:**
- Move `overflow-y: auto` off the shared container (or the DetailPanel) and onto the `.feat-picker__list` (left column) so the user scrolls feats while the description stays in view.
- Independent internal scroll on description panel ONLY when its own content exceeds panel height (secondary, rare case).
- Same pattern likely worth auditing on class picker + race picker + skills route if any share the same SelectionScreen container (regression surface check).

---

## Cross-cutting observations

### X1 — Sub-steps pre-check ✓ on entry
Opening L1 shows Clase ✓, Habilidades ✓, Dotes ✓ before the user has touched any of them. Class was auto-seeded to Explorador (not user-chosen). Skills/feats pre-checked despite `0` allocations. This is misleading — "done" ticks should be earned, not default.

Suggested: sub-step ✓ only after user affirms or allocates; before that, show neutral / empty state.

### X2 — Dataset banner
Footer shows `Ruleset v1.0.0 · Dataset 2026-04-17 (cf6f8aad)`. Useful — leave as-is.

### X3 — L1 rail entry label
PROGRESION tile shows `1 Explo…` truncated with ellipsis. Suggests class name is rendered inside the tile and truncated at fixed width. Acceptable for now; if class renames get longer, revisit.

---

## Proposed Phase 12.4 scope

This findings doc is *not* a plan. The natural next step is:

1. `/gsd-spec-phase 12.4` to lock WHAT the fix phase delivers (falsifiable requirements drawn from F1..F5 + X1).
2. `/gsd-discuss-phase 12.4` to surface gray areas (grouping UX, collapse-on-complete interaction, prestige prereq display, etc.).
3. `/gsd-plan-phase 12.4` to turn spec + decisions into executable plans.

Proposed phase goal draft (to be refined in spec-phase):

> Phase 12.4 — Construcción correctness + clarity: separate base from prestige in class picker with rule-evidence gating; render per-level feat-slot and skill-point budgets as authoritative UI truth; add dynamic "Continuar al nivel N" affordance; split Habilidades into class vs transclase sections with visible coste hint; restructure Dotes with selectability states, slot counter, and collapse-on-complete behavior.

---

## Appendix — Files touched by sweep

None. This is observation-only. No code changes until phase is scoped.
