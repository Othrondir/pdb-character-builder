---
date: 2026-04-20
phase_origin: 12.6 (UAT post-execution)
status: pending-triage
severity_summary:
  blocker: 1
  major: 4
  minor: 2
---

# UAT Findings — Post Phase 12.6 (2026-04-20)

User-driven UAT against master after Phase 12.6 closure surfaced 7 cross-cutting findings spanning Progresión scan-row clarity, Habilidades over-allocation + scroll defect + redundant per-row labels + missing carryover, INT-modifier point-buy formula uncertainty, and Dotes UX confusion (no advance affordance — explicit blocker on user progression to L2).

Evidence captured via MCP Chrome on tab `761726495` (`http://localhost:5173/`) during Phase 12.6 UAT session, fixture: Humano → Elfo + Neutral puro + baseline 8/8/8/8/8/8 + L1 Clérigo (race switch caused class state to drift to Clérigo display).

---

## F1. Progresión scan-row labels jam together (PROG-LABEL) — minor

**Symptom**: Row header text concatenates without separators.

**Evidence**:
```
[data-level-row][data-level="1"] button.textContent = "1Clérigo0/1 dotes5/4 pts⚠"
[data-level-row][data-level="2"] button.textContent = "2Sin clase0/0 dotes0/0 pts⚠"
```

**Impact**: Less scannable than legacy LevelRail. User explicitly: "ahora la progresión de nivel queda menos clara que antes, debería poner en progresión - nivel o algo así".

**Suggested fix**: Insert "Nivel " prefix + ` · ` separators in `level-progression-row.tsx` (Plan 12.6-03 spec). Probable owner: `apps/planner/src/features/level-progression/level-progression-row.tsx` pill render path; visual separator may be CSS (`gap` on header flex container) or text template.

---

## F2. Habilidades opens scrolled mid-list (SKILL-SCROLL) — major

**Symptom**: Entering Habilidades sub-step lands the inner scroll container partway through the skill list instead of at top.

**Evidence**: User report verbatim "siempre que entras la primera vez sale scrolleado a mitad del listado". Current MCP probe shows `selection-screen__content` `scrollTop:0` at first inspection, but `scrollHeight:2069` `clientHeight:748` — heavy scrollable surface; cause likely `element.focus()` or `scrollIntoView` on first `+` button when sub-step mounts.

**Impact**: User loses orientation; first skill is offscreen.

**Suggested fix**: Audit Habilidades sub-step mount effect for auto-focus / scrollIntoView. Force `scrollTop = 0` on the `selection-screen__content` scroller after mount, OR remove the auto-focus.

---

## F3. Per-row "Clase" / "Transclase" / "Solo entrenada" labels redundant (SKILL-DUP-EXPLANATION) — minor

**Symptom**: Each skill row prints its category ("Clase" or "Transclase") + sometimes "Solo entrenada", but the section already segments rows under `HABILIDADES DE CLASE · coste 1 pt/rango` and `HABILIDADES TRANSCLASE · coste 2 pts/rango` headers.

**Evidence**:
```
HABILIDADES DE CLASE · coste 1 pt/rango
Artesanía · Clase · - Artesanía + 4 · Tope: 4
Concentración · Clase · - Concentración + 1 · Tope: 4
Conocimiento de conjuros · Clase · Solo entrenada · - Conocimiento de conjuros + 0 · Tope: 4
```

**Impact**: Visual noise + redundancy.

**Suggested fix**: Drop per-row "Clase"/"Transclase" labels; keep "Solo entrenada" since that's per-row metadata not implied by the section. User: "como ya tenemos dividido por habilidades de clase y transclases la explicación al lado de cada habilidad sobra".

---

## F4. Skill +/- allows over-allocation past per-level budget (SKILL-OVER-ALLOC) — major

**Symptom**: User can spend beyond `Puntos disponibles`; the UI surfaces an error message but the buttons don't gate.

**Evidence**:
```
Nivel 1 · Clérigo
Puntos disponibles: 4
Puntos gastados: 5
Puntos restantes: -1
"El reparto de este nivel supera los límites permitidos."
```

**Impact**: User can reach an invalid state; error post-hoc not gate. Mirrors prior 12.3-01 ATTR-01 fix pattern (button.disabled mid-allocation).

**Suggested fix**: Add `canIncrementSkill(skillId, level, snapshot)` predicate at the `+` button `disabled` prop site, mirroring `canIncrementAttribute` pattern from Phase 12.3-01.

---

## F5. No skill-point carryover (≤4 pts) to next level (SKILL-CARRYOVER) — minor

**Symptom**: Unspent skill points at L_N do not carry forward.

**User intent**: "deberías poder guardar 4 puntos de un nivel como maximo para poder usarlos en el nivel siguiente."

**Impact**: Forces immediate spend at every level; departs from Puerta server rules (per user).

**Open question**: Confirm Puerta exact carryover rule (cap 4 + per-level, or accumulating, or only forward by 1 level). Need source verification before implementation. Likely `puerta-skill-rules.md` provenance pattern (mirror `puerta-point-buy.md`).

**Suggested fix**: Extend `computePerLevelBudget` skill-points field with carryover input from prior-level remainder; gate ≤4. Update `selectLevelCompletionState` so unspent ≤4 pts is treated as `complete` not `incomplete`.

---

## F6. L1 skill-point ×4 multiplier formula — VERIFY (SKILL-INT-MOD-FORMULA) — minor

**Symptom**: User asserts "cada clase dependiendo de su inteligencia tiene una mayor cantidad de puntos al nivel 1 y luego una fija cada nivel más baja".

**Evidence**:
- Guerrero (Humano INT 10, base 2 + INT 0 = 2 → ×4 = 8) → row pill `0/8 pts` ✓ matches D&D 3.5e L1 rule.
- Clérigo (Elfo INT 8, base 2 + INT -1 = 1 → ×4 = 4) → row pill `0/4 pts` ✓ matches.

**Status**: L1 ×4 formula appears correct. Likely no bug, but **L2..L20 budget needs spot-check** to confirm `class-base + INT-mod` (no ×4) per subsequent level.

**Suggested action**: Verify L2 budget rendering after advancing past L1 — defer confirmation until F7 advance path is restored.

---

## F7. Dotes UX confusing + no visible advance to Nivel 2 (FEAT-CONFUSING + ADVANCE-MISSING) — **BLOCKER**

**Symptom 1 (no advance)**: Habilidades and Dotes sub-steps do not mount the `LevelEditorActionBar`. The advance button only renders when the user is on the Progresión-Clase sub-step.

**Evidence**:
```
On Habilidades sub-step:  document.querySelector('[data-testid=level-editor-action-bar]') === null
On Dotes sub-step:        document.querySelector('[data-testid=level-editor-action-bar]') === null
On Progresión-Clase:      data-testid=level-editor-action-bar present, button disabled with text "Falta 1 dote que asignar en este nivel"
```

**Symptom 2 (Dotes confusion)**: User: "lo peor de todo sin duda son las dotes, no queda claro, cual pones, como avanzar al nivel 2 (No se como avanzar)".

**Impact**: User cannot complete L1 → cannot reach L2 → entire progression flow blocked. **This is the worst regression of Phase 12.6.**

**Root cause hypothesis**: Plan 12.4-09 + 12.6-04 mounted `LevelEditorActionBar` only inside the expanded Progresión-Clase row, not as a global sticky footer that survives sub-step navigation. When the user navigates Habilidades or Dotes via the stepper buttons, they leave the host that shows the action bar.

**Suggested fix path**:
1. Hoist `LevelEditorActionBar` to a stepper-global mount (e.g., bottom of `creation-stepper.tsx` content host) so it's visible across Clase / Habilidades / Dotes sub-steps.
2. Re-evaluate label copy on Dotes step — "Selecciona las dotes del nivel" + per-feat selectability (`selectable / blocked-prereq / blocked-already-taken / blocked-budget`) shipped in 12.4-07 should be visually clearer (probable issue: 230 family-grouped feats, 18455px scroll surface — discoverability of `Dotes generales` vs `Dote general` + family expanders confuses users).
3. Add explicit pointer text ("Selecciona N dote(s) general(es)") on each sub-step header.

---

## Fix-Phase Scoping Recommendation

Open as **Phase 12.7** — `UAT-2026-04-20-residuals-2`. Suggested plan grouping:

| Plan | Findings | Wave |
|------|----------|------|
| 12.7-01 | F7 (advance bar hoist) | 1 — unblock user |
| 12.7-02 | F4 (skill over-alloc gate) | 1 |
| 12.7-03 | F2 (skill scroll) + F3 (drop per-row labels) + F1 (row label clarity) | 2 — UX polish |
| 12.7-04 | F5 (skill carryover ≤4) — needs Puerta source first | 3 — data-blocked |
| 12.7-05 | F6 spot-check + closure | 3 — verification |

Skip F6 if L2..L20 budget verifies correct on L1 unblock.

---

## Cross-References

- Phase 12.6 UAT result: 10/10 passed at Phase-12.6 acceptance scope (`12.6-UAT.md`) — these findings are emergent UX issues NOT covered by the 12.6 success criteria.
- Phase 12.4-07 Dotes selectability + 12.4-09 LevelEditorActionBar implementation: `apps/planner/src/features/level-progression/level-editor-action-bar.tsx`.
- Phase 12.6-03 LevelProgressionRow pill rendering: `apps/planner/src/features/level-progression/level-progression-row.tsx`.
- Phase 12.3-01 attribute over-allocation gate (analogous fix pattern for F4): commits `e8181a5..9513fe6` hot-fix series.
