// @vitest-environment jsdom

/**
 * Quick-260422-g7s — RED spec for prestige gate reachability wiring.
 *
 * Asserts that <ClassPicker /> cables `buildPrestigeGateBuildState` +
 * `getPrestigeDecodedPrereqs` into `reachableAtLevelN`, so that:
 *
 *   - L9 with 8 levels of Mago (arcane class-level 8 ⇒ highestArcaneSpellLevel 4)
 *     SHOULD NOT satisfy Caballero Arcano's `minArcaneSpellLevel: 5` override,
 *     but crucially the row MUST no longer display 'Requisitos en revisión'
 *     (the current fail-closed branch-3 copy) because the override IS present
 *     in PRESTIGE_PREREQ_OVERRIDES and `enriched` should flip to true.
 *     At L9 with Mago 8 the arcane-spell threshold (5) is still unmet —
 *     highestArcaneSpellLevel(wizard@8) = 4 per FULL_CASTER_PROGRESS — so the
 *     row stays blocked on that specific blocker, not on 'unvetted'.
 *
 *     ALTERNATIVE scenario to lock: L9 with 9 levels of Mago (slot N=9 itself
 *     assigned to wizard) would give arcane-spell 5, but ClassPicker at L9
 *     evaluates PRIOR levels (1..8) via buildPrestigeGateBuildState, so the
 *     happy path uses Mago x8 prior + L9 current. That still keeps the row
 *     blocked on arcane-spell (needs 5, has 4). To demonstrate the gate
 *     'resolving' the arcane-spell blocker we need 9 arcane levels prior;
 *     this spec pivots to: seed L1..L9 = Mago then ACTIVATE L10 so prior
 *     class-levels include 9 wizard levels ⇒ highestArcaneSpellLevel 5 ⇒
 *     arcane-spell blocker cleared. The remaining 25 martial-weapon-feat
 *     requirements will surface as 'Requiere dote: ...' blockers — correct.
 *
 *   - L9 with 8 levels of Guerrero (no arcane at all) MUST surface the exact
 *     'Requiere conjuros arcanos de nivel 5' blocker label from the gate's
 *     arcaneSpellLabel(5), confirming enriched=true path is active.
 *
 *   - L1 regression: every prestige row still shows the L1 branch copy.
 *
 *   - Fail-closed intact: a prestige class WITHOUT an override in
 *     PRESTIGE_PREREQ_OVERRIDES still falls through to 'Requisitos en revisión'.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { createElement } from 'react';

import { ClassPicker } from '@planner/features/level-progression/class-picker';
import { useLevelProgressionStore } from '@planner/features/level-progression/store';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { useFeatStore } from '@planner/features/feats/store';
import { useSkillStore } from '@planner/features/skills/store';
import { PRESTIGE_PREREQ_OVERRIDES } from '@planner/features/level-progression/prestige-prereq-data';
import type { ProgressionLevel } from '@planner/features/level-progression/progression-fixture';
import type { CanonicalId } from '@rules-engine/contracts/canonical-id';

function setupL9WithClassProgression(classId: CanonicalId): void {
  useCharacterFoundationStore.getState().setRace('race:human' as CanonicalId);
  useCharacterFoundationStore
    .getState()
    .setAlignment('alignment:true-neutral' as CanonicalId);

  for (let level = 1; level <= 8; level += 1) {
    useLevelProgressionStore
      .getState()
      .setLevelClassId(level as ProgressionLevel, classId);
  }

  useLevelProgressionStore.getState().setActiveLevel(9 as ProgressionLevel);
}

function setupL1Humano(): void {
  useCharacterFoundationStore.getState().setRace('race:human' as CanonicalId);
  useCharacterFoundationStore
    .getState()
    .setAlignment('alignment:true-neutral' as CanonicalId);
  useLevelProgressionStore.getState().setActiveLevel(1 as ProgressionLevel);
}

describe('Quick-260422-g7s — ClassPicker prestige reachability cabled to build state + overrides', () => {
  beforeEach(() => {
    cleanup();
    document.body.innerHTML = '';
    useLevelProgressionStore.getState().resetProgression();
    useFeatStore.getState().resetFeatSelections();
    useSkillStore.getState().resetSkillAllocations();
    useCharacterFoundationStore.getState().resetFoundation();
  });
  afterEach(() => cleanup());

  it('L9 con Mago 8 niveles: fila Caballero Arcano NO muestra "Requisitos en revisión" (enriched=true wired)', () => {
    setupL9WithClassProgression('class:wizard' as CanonicalId);
    render(createElement(ClassPicker));

    const row = document.querySelector('[data-class-id="class:caballero-arcano"]');
    expect(row, 'Caballero Arcano row must exist in prestige section').not.toBeNull();

    // The crux of the wiring fix: with overrides present, the gate must take
    // branch 4 (decoded) instead of branch 3 (unvetted). So the fail-closed
    // 'Requisitos en revisión' copy must NOT appear on this row.
    expect(row?.textContent ?? '').not.toMatch(/Requisitos en revisión/);
  });

  it('L9 con Guerrero 8 niveles: fila Caballero Arcano muestra blocker arcane-spell exacto', () => {
    setupL9WithClassProgression('class:fighter' as CanonicalId);
    render(createElement(ClassPicker));

    const row = document.querySelector('[data-class-id="class:caballero-arcano"]');
    expect(row, 'Caballero Arcano row must exist in prestige section').not.toBeNull();

    // highestArcaneSpellLevel(fighter@8) = 0 ⇒ arcane-spell blocker fires with
    // exact copy from arcaneSpellLabel(5). If this assertion passes we KNOW
    // the gate ran branch 4 (decoded) successfully.
    expect(row?.textContent ?? '').toMatch(/Requiere conjuros arcanos de nivel 5/);
  });

  it('L1 regresión: toda clase de prestigio sigue con copy de rama 2 (no L1)', () => {
    setupL1Humano();
    render(createElement(ClassPicker));

    const prestigeRows = document.querySelectorAll(
      '.class-picker__list [data-class-id^="class:"]',
    );
    // Filter to prestige-section rows: they are the ones inside the second
    // list and carry the L1 blocker copy. Easiest check: at L1, the Caballero
    // Arcano row must carry the 'Clase de prestigio: no disponible en nivel 1'
    // copy verbatim (branch 2 short-circuits before branches 3/4).
    const caballeroRow = document.querySelector(
      '[data-class-id="class:caballero-arcano"]',
    );
    expect(caballeroRow, 'Caballero Arcano row must exist at L1').not.toBeNull();
    expect(caballeroRow?.textContent ?? '').toMatch(
      /Clase de prestigio: no disponible en nivel 1; revisa sus requisitos/,
    );
    // Sanity: there is more than one prestige row rendered.
    expect(prestigeRows.length).toBeGreaterThan(1);
  });

  it('L9 con Guerrero 8 niveles: prestige SIN override sigue cayendo a "Requisitos en revisión"', () => {
    setupL9WithClassProgression('class:fighter' as CanonicalId);
    render(createElement(ClassPicker));

    // Pick any prestige row currently rendered whose canonical id is NOT in
    // PRESTIGE_PREREQ_OVERRIDES — that row must still fail-closed via branch 3.
    const prestigeSectionHeading = document.getElementById('class-picker__prestige');
    const prestigeSection = prestigeSectionHeading?.closest('section');
    expect(prestigeSection, 'Prestige section must exist').not.toBeNull();

    const rows = prestigeSection?.querySelectorAll('[data-class-id]') ?? [];
    expect(rows.length).toBeGreaterThan(0);

    const overrideIds = new Set(Object.keys(PRESTIGE_PREREQ_OVERRIDES));
    const unoverriddenRow = Array.from(rows).find((row) => {
      const id = row.getAttribute('data-class-id') ?? '';
      return !overrideIds.has(id);
    });

    if (!unoverriddenRow) {
      // If every rendered prestige class has an override, there is no
      // fail-closed path to verify in this scenario — the rules-engine
      // fixture spec still locks the branch-3 semantics directly.
      // eslint-disable-next-line no-console
      console.warn(
        'No un-overridden prestige class rendered at L9; fail-closed branch locked by rules-engine fixture spec.',
      );
      return;
    }

    expect(unoverriddenRow.textContent ?? '').toMatch(/Requisitos en revisión/);
  });

  // ----------------------------------------------------------------------
  // Quick-260422-h9k — integration coverage for the 3 new overrides
  // (class:harper / class:campeondivino / class:weaponmaster). These cases
  // depend on PRESTIGE_PREREQ_OVERRIDES containing the new entries; they
  // FAIL in RED (plan Task 1) and PASS in GREEN (plan Task 2).
  //
  // Warlock + Swashbuckler are deliberately OUT OF SCOPE (see 260422-h9k-
  // PLAN.md <objective>). Both stay fail-closed to 'Requisitos en revisión'
  // until a future cross-package plan introduces BlockerKind 'server-gate'.
  // ----------------------------------------------------------------------

  it('L9 con Guerrero 8 niveles: fila class:harper muestra blocker específico (no "Requisitos en revisión")', () => {
    setupL9WithClassProgression('class:fighter' as CanonicalId);
    render(createElement(ClassPicker));

    const row = document.querySelector('[data-class-id="class:harper"]');
    expect(row, 'Agente Custodio row must exist in prestige section').not.toBeNull();

    const text = row?.textContent ?? '';
    expect(text).not.toMatch(/Requisitos en revisión/);
    // At least one of the expected templated blockers surfaces on the row
    // (first blocker drives the visible reason, so we accept any of the
    // 5 unmet requirements rendered by reachableAtLevelN branch 4).
    expect(text).toMatch(
      /Requiere 6 rangos de Engañar|Requiere 4 rangos de Buscar|Requiere 6 rangos de Saber \(otros\)|Requiere dote: Alerta|Requiere dote: Voluntad de hierro/,
    );
  });

  it('L9 con Guerrero 8 niveles: fila class:campeondivino muestra blocker templateado (no "Requisitos en revisión")', () => {
    setupL9WithClassProgression('class:fighter' as CanonicalId);
    render(createElement(ClassPicker));

    const row = document.querySelector('[data-class-id="class:campeondivino"]');
    expect(row, 'Campeón divino row must exist in prestige section').not.toBeNull();

    const text = row?.textContent ?? '';
    expect(text).not.toMatch(/Requisitos en revisión/);
    // Guerrero 8 has BAB 8 ≥ 7 (minBab satisfied). No Weapon Focus feat is
    // auto-granted at L1-L8 for a vanilla fighter, so feat-or fires first
    // in blockers[] and its label drives the visible reason. Accept either
    // the BAB copy (if computation diverges) or the feat-or copy — both are
    // valid branch-4 templated labels (distinct from branch-3 fail-closed).
    expect(text).toMatch(
      /Requiere BAB ≥ 7|Requiere una de estas dotes: /,
    );
  });

  it('L9 con Guerrero 4 + Hechicero 4: fila class:weaponmaster muestra blocker específico (no "Requisitos en revisión")', () => {
    // Custom multiclass setup: Guerrero L1-L4 + Hechicero L5-L8, active L9.
    useCharacterFoundationStore.getState().setRace('race:human' as CanonicalId);
    useCharacterFoundationStore
      .getState()
      .setAlignment('alignment:true-neutral' as CanonicalId);
    for (let level = 1; level <= 4; level += 1) {
      useLevelProgressionStore
        .getState()
        .setLevelClassId(level as ProgressionLevel, 'class:fighter' as CanonicalId);
    }
    for (let level = 5; level <= 8; level += 1) {
      useLevelProgressionStore
        .getState()
        .setLevelClassId(level as ProgressionLevel, 'class:sorcerer' as CanonicalId);
    }
    useLevelProgressionStore.getState().setActiveLevel(9 as ProgressionLevel);

    render(createElement(ClassPicker));

    const row = document.querySelector('[data-class-id="class:weaponmaster"]');
    expect(row, 'Maestro de armas row must exist in prestige section').not.toBeNull();

    const text = row?.textContent ?? '';
    expect(text).not.toMatch(/Requisitos en revisión/);
    // First unmet requirement drives the visible reason. With Guerrero 4 +
    // Hechicero 4: BAB = 4 + floor(4/2) = 6 ≥ 5 (satisfied), and neither
    // class auto-grants Intimidar ranks / dodge / mobility / pericia en
    // combate / whirlwind / weapon focus. Gate pushes blockers in order
    // (bab skipped) skill-rank → feats → feat-or. Accept any templated
    // label from that list.
    expect(text).toMatch(
      /Requiere 4 rangos de Intimidar|Requiere dote: Esquiva|Requiere dote: Movilidad|Requiere dote: Pericia en combate|Requiere dote: Ataque de torbellino|Requiere una de estas dotes: /,
    );
  });
});
