import { test, expect, type Page } from '@playwright/test';

// Phase 12.8-03 — Dotes multi-slot UX regression guard.
// F3 (D-04): auto-scroll to general section after class-bonus slot fills.
// F4 (D-05 + D-06): per-chip × deselect on FeatSummaryCard.
//
// Fixture helper mirrors tests/phase-12.8/skill-scroll-snap.e2e.spec.ts:
//   - Race + alignment emit `<button role="option">` via <OptionList>.
//   - Each origin step requires an explicit `Aceptar` commit click.
//   - Class picker rows expose a stable `data-class-id` attribute.
//   - Sub-step chips carry `data-substep="class|skills|feats"`.
//
// Elfo + Guerrero L1 is the canonical UAT fixture:
//   - budget.featSlots.total === 2 (class-bonus + general) so the
//     FeatSummaryCard collapses after both picks.
//   - no race-feat bonus slot (unlike Humano), so store capacity
//     matches budget exactly.

async function seedFixtureAndEnterDotes(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate(async () => {
    window.localStorage.clear();
    const dbs = ['planner-db', 'character-builder'];
    await Promise.all(
      dbs.map(
        (name) =>
          new Promise<void>((resolve) => {
            const req = indexedDB.deleteDatabase(name);
            req.onsuccess = () => resolve();
            req.onerror = () => resolve();
            req.onblocked = () => resolve();
          }),
      ),
    );
  });
  await page.reload();

  // Race → Elfo (OptionList → button role="option").
  await page.getByRole('option', { name: 'Elfo', exact: true }).click();
  await page.getByRole('button', { name: 'Aceptar', exact: true }).click();

  // Alignment → Neutral puro.
  await page.getByRole('option', { name: 'Neutral puro', exact: true }).click();
  await page.getByRole('button', { name: 'Aceptar', exact: true }).click();

  // Atributos → Aceptar (defaults) → lands on L1 class picker.
  await page.getByRole('button', { name: 'Aceptar', exact: true }).click();

  // Clase L1 → Guerrero (class:fighter).
  await page.locator('[data-class-id="class:fighter"]').click();

  // Switch to Dotes sub-step (data-substep="feats") for L1.
  await page.locator('[data-substep="feats"]').click();
  await page.waitForSelector('[data-slot-section="class-bonus"]');
}

test.describe('F3 — Auto-scroll to general section on class-slot completion', () => {
  test('first general-section row is in viewport after class-bonus click', async ({
    page,
  }) => {
    await seedFixtureAndEnterDotes(page);

    // Click the first selectable class-bonus row.
    const firstClassRow = page
      .locator(
        '[data-slot-section="class-bonus"] button.feat-picker__row:not([aria-disabled="true"]):not(.feat-picker__row--family)',
      )
      .first();
    await firstClassRow.click();

    // After auto-scroll (rAF + scrollIntoView smooth), the first
    // general-section row should have its bounding box inside the
    // viewport vertically.
    const firstGeneralRow = page
      .locator(
        '[data-slot-section="general"] button.feat-picker__row:not(.feat-picker__row--family)',
      )
      .first();
    await expect
      .poll(
        async () => {
          const box = await firstGeneralRow.boundingBox();
          if (!box) return false;
          const vh = await page.evaluate(() => window.innerHeight);
          return box.y >= 0 && box.y + box.height <= vh;
        },
        { timeout: 2000 },
      )
      .toBe(true);
  });

  test('clicking a general row after the class row fills both slots (counter 2/2, distinct chips)', async ({
    page,
  }) => {
    await seedFixtureAndEnterDotes(page);

    const firstClassRow = page
      .locator(
        '[data-slot-section="class-bonus"] button.feat-picker__row:not([aria-disabled="true"]):not(.feat-picker__row--family)',
      )
      .first();
    const classLabelText =
      (await firstClassRow.locator('.feat-picker__label').textContent())?.trim() ?? '';
    await firstClassRow.click();

    // Wait for auto-scroll smooth animation to settle.
    await page.waitForTimeout(500);

    const firstGeneralRow = page
      .locator(
        '[data-slot-section="general"] button.feat-picker__row:not([aria-disabled="true"]):not(.feat-picker__row--family)',
      )
      .first();
    const generalLabelText =
      (await firstGeneralRow.locator('.feat-picker__label').textContent())?.trim() ?? '';
    await firstGeneralRow.click();

    // Elfo + Guerrero L1 budget.featSlots.total === 2 → collapses to
    // <FeatSummaryCard> once both slots fill.
    const summaryCard = page.locator('.feat-summary-card');
    await expect(summaryCard).toBeVisible({ timeout: 2000 });

    const chipLabels = await summaryCard
      .locator('.feat-summary-card__label')
      .allTextContents();
    expect(chipLabels).toHaveLength(2);
    expect(chipLabels.some((l) => l.includes(classLabelText))).toBe(true);
    expect(chipLabels.some((l) => l.includes(generalLabelText))).toBe(true);
  });
});

test.describe('F4 — FeatSummaryCard per-chip × deselect', () => {
  test('class-bonus chip × empties the class slot and re-renders the sheet', async ({
    page,
  }) => {
    await seedFixtureAndEnterDotes(page);
    await page
      .locator(
        '[data-slot-section="class-bonus"] button.feat-picker__row:not([aria-disabled="true"]):not(.feat-picker__row--family)',
      )
      .first()
      .click();
    await page.waitForTimeout(500);
    await page
      .locator(
        '[data-slot-section="general"] button.feat-picker__row:not([aria-disabled="true"]):not(.feat-picker__row--family)',
      )
      .first()
      .click();
    await expect(page.locator('.feat-summary-card')).toBeVisible({ timeout: 2000 });

    // Click the × on the class-bonus chip.
    await page.locator('[data-testid="deselect-chip-class-bonus-0"]').click();

    // Card unmounts; the full sheet re-renders.
    await expect(page.locator('.feat-summary-card')).toBeHidden({ timeout: 2000 });
    await expect(page.locator('[data-slot-section="class-bonus"]')).toBeVisible();
  });

  test('general chip × empties the general slot without clearing the class slot', async ({
    page,
  }) => {
    await seedFixtureAndEnterDotes(page);
    await page
      .locator(
        '[data-slot-section="class-bonus"] button.feat-picker__row:not([aria-disabled="true"]):not(.feat-picker__row--family)',
      )
      .first()
      .click();
    await page.waitForTimeout(500);
    await page
      .locator(
        '[data-slot-section="general"] button.feat-picker__row:not([aria-disabled="true"]):not(.feat-picker__row--family)',
      )
      .first()
      .click();
    await expect(page.locator('.feat-summary-card')).toBeVisible({ timeout: 2000 });

    const classLabelBefore = (
      await page
        .locator(
          '.feat-summary-card__item[data-slot-kind="class-bonus"] .feat-summary-card__label',
        )
        .textContent()
    )?.trim();

    // Click the × on the general chip.
    await page.locator('[data-testid="deselect-chip-general-0"]').click();

    await expect(page.locator('.feat-summary-card')).toBeHidden({ timeout: 2000 });

    // After re-render, the class-bonus section shows the still-chosen
    // row carrying `.feat-picker__row--chosen`.
    const chosenClassRow = page
      .locator('[data-slot-section="class-bonus"] button.feat-picker__row--chosen')
      .first();
    const chosenClassLabel = (
      await chosenClassRow.locator('.feat-picker__label').textContent()
    )?.trim();
    expect(chosenClassLabel).toBe(classLabelBefore);
  });
});
