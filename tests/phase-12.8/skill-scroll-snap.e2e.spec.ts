import { test, expect, type Page } from '@playwright/test';

// Phase 12.8-01 — Habilidades scroll-snap regression guard (D-03).
// jsdom has no layout engine; these assertions require a real browser.
//
// Fixture helper selector notes (Task 1 RED fixture-debug loop):
//   - Race + alignment boards render via <OptionList> which emits
//     `<button role="option">`, so `getByRole('option', ...)` is the
//     right ARIA role (NOT `role="button"`).
//   - Class picker rows expose a stable `data-class-id` attribute and
//     encode aria-label as `"{label} {status}"` (e.g. "Guerrero legal"),
//     so querying by class canonical id is the deterministic selector.
//   - Sub-step chips carry `data-substep="class|skills|feats"`.
//   - Each origin step requires an explicit "Aceptar" commit click to
//     advance (race → alignment → attributes → L1 class picker).

async function seedFixtureAndEnterHabilidades(page: Page): Promise<void> {
  // D-03: deterministic fixture entry — Elfo + Neutral puro + Atributos
  // default (8/10/6/8/8/8) + Guerrero L1, then navigate to Habilidades
  // sub-step for L1.
  await page.goto('/');
  // Reset persisted state for determinism.
  await page.evaluate(async () => {
    window.localStorage.clear();
    const dbs = ['planner-db', 'character-builder'];
    await Promise.all(dbs.map((name) => new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase(name);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    })));
  });
  await page.reload();

  // Race → Elfo (OptionList → button role="option").
  await page.getByRole('option', { name: 'Elfo', exact: true }).click();
  // Aceptar → advance to alignment step.
  await page.getByRole('button', { name: 'Aceptar', exact: true }).click();

  // Alignment → Neutral puro.
  await page.getByRole('option', { name: 'Neutral puro', exact: true }).click();
  // Aceptar → advance to attributes step.
  await page.getByRole('button', { name: 'Aceptar', exact: true }).click();

  // Atributos → Aceptar (defaults) → lands on L1 class picker.
  await page.getByRole('button', { name: 'Aceptar', exact: true }).click();

  // Clase L1 → Guerrero (class canonical id = class:fighter).
  await page.locator('[data-class-id="class:fighter"]').click();

  // Switch to Habilidades sub-step for L1 (data-substep="skills").
  await page.locator('[data-substep="skills"]').click();
  await page.waitForSelector('.skill-board .selection-screen__content');
}

test.describe('F1 — Habilidades scroll reset on entry', () => {
  test('first entry places .skill-board .selection-screen__content at scrollTop=0', async ({ page }) => {
    await seedFixtureAndEnterHabilidades(page);
    const scrollTop = await page
      .locator('.skill-board .selection-screen__content')
      .evaluate((el) => (el as HTMLElement).scrollTop);
    expect(scrollTop).toBe(0);
  });

  test('L1 → L2 re-entry keeps scrollTop=0', async ({ page }) => {
    await seedFixtureAndEnterHabilidades(page);
    // Spend the 4 L1 Guerrero skill points on the first class skill row
    // so the advance-button skill deficit clears.
    const plusBtns = page.locator('.skill-sheet__row button[aria-label^="Aumentar rango"]');
    for (let i = 0; i < 4; i++) {
      await plusBtns.first().click();
    }
    // Fill the 2 L1 dote slots (class-bonus + general) — Elfo Guerrero L1
    // budget.featSlots.total === 2. Switch to Dotes sub-step, then click
    // section-scoped rows so the second click lands in the general slot
    // (F3 regression: un-scoped second click overwrites the class pick).
    await page.locator('[data-substep="feats"]').click();
    await page
      .locator('[data-slot-section="class-bonus"] .feat-picker__row:not([aria-disabled="true"]):not(.feat-picker__row--family)')
      .first()
      .click();
    await page
      .locator('[data-slot-section="general"] .feat-picker__row:not([aria-disabled="true"]):not(.feat-picker__row--family)')
      .first()
      .click();
    // Advance to L2 via the hoisted action bar (Phase 12.7-01 contract:
    // [data-testid="advance-to-level-2"]).
    const advanceBtn = page.locator('[data-testid="advance-to-level-2"]');
    await advanceBtn.click();
    // After advance the stepper flips to the L2 class sub-step. Pick
    // Guerrero again at L2, then switch back to Habilidades.
    await page.locator('[data-class-id="class:fighter"]').click();
    await page.locator('[data-substep="skills"]').click();
    await page.waitForSelector('.skill-board .selection-screen__content');
    const scrollTop = await page
      .locator('.skill-board .selection-screen__content')
      .evaluate((el) => (el as HTMLElement).scrollTop);
    expect(scrollTop).toBe(0);
  });
});

test.describe('F2 — Habilidades no-jitter on +/- click', () => {
  test('+ then - preserves row rect + scroller scrollTop within 1px', async ({ page }) => {
    await seedFixtureAndEnterHabilidades(page);
    const scroller = page.locator('.skill-board .selection-screen__content');
    const firstRow = page.locator('.skill-board .skill-sheet__row').first();
    const rectBefore = await firstRow.boundingBox();
    const scrollBefore = await scroller.evaluate((el) => (el as HTMLElement).scrollTop);

    const plus = firstRow.locator('button[aria-label^="Aumentar rango"]');
    await plus.click();
    const minus = firstRow.locator('button[aria-label^="Reducir rango"]');
    await minus.click();

    const rectAfter = await firstRow.boundingBox();
    const scrollAfter = await scroller.evaluate((el) => (el as HTMLElement).scrollTop);

    expect(rectBefore).not.toBeNull();
    expect(rectAfter).not.toBeNull();
    expect(Math.abs((rectAfter!.y) - (rectBefore!.y))).toBeLessThanOrEqual(1);
    expect(Math.abs((rectAfter!.height) - (rectBefore!.height))).toBeLessThanOrEqual(1);
    expect(Math.abs(scrollAfter - scrollBefore)).toBeLessThanOrEqual(1);
  });
});

test.describe('F1+F2 — CSS snap rules removed (D-01 invariant)', () => {
  test('no element matching .skill-board .selection-screen__content reports scroll-snap-type: y', async ({ page }) => {
    await seedFixtureAndEnterHabilidades(page);
    const snapType = await page
      .locator('.skill-board .selection-screen__content')
      .evaluate((el) => getComputedStyle(el as HTMLElement).scrollSnapType);
    // getComputedStyle returns 'none' for unset or explicitly `none`.
    expect(snapType).toBe('none');
  });

  test('.skill-board .skill-sheet__row reports scroll-snap-align: none', async ({ page }) => {
    await seedFixtureAndEnterHabilidades(page);
    const snapAlign = await page
      .locator('.skill-board .skill-sheet__row')
      .first()
      .evaluate((el) => getComputedStyle(el as HTMLElement).scrollSnapAlign);
    expect(snapAlign).toBe('none');
  });
});
