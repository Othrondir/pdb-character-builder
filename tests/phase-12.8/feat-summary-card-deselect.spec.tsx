// @vitest-environment jsdom

/**
 * Phase 12.8-03 (D-05 + D-06, UAT-2026-04-23 F4) — per-chip × deselect.
 *
 * D-13 unit layer: pure component test with store-mock. Playwright spec
 * at tests/phase-12.8/feat-auto-scroll.e2e.spec.ts carries the layout-
 * dependent smoke path (same plan, Task 3).
 *
 * Uses `createElement` (not JSX) to match the established phase-12.x
 * test convention — Vitest's default esbuild does not auto-inject the
 * React runtime, so JSX would throw "React is not defined".
 */

import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { createElement } from 'react';
import {
  FeatSummaryCard,
  type FeatSummaryChosenEntry,
} from '@planner/features/feats/feat-summary-card';

const CHOSEN: FeatSummaryChosenEntry[] = [
  { featId: 'feat:carrera', label: 'Carrera', slotKind: 'class-bonus', slotIndex: 0 },
  { featId: 'feat:aguante', label: 'Aguante', slotKind: 'general', slotIndex: 0 },
];

describe('Phase 12.8-03 — FeatSummaryCard per-chip × deselect', () => {
  // Explicit cleanup so `screen.getByRole(...)` queries in each test see
  // only that test's render output — RTL does not auto-cleanup across
  // `it` blocks under Vitest's default globals.
  afterEach(() => {
    cleanup();
  });

  it('renders one × button per chosen chip with Spanish aria label', () => {
    render(
      createElement(FeatSummaryCard, {
        chosenFeats: CHOSEN,
        onModify: () => {},
        onDeselect: () => {},
      }),
    );
    expect(screen.getByLabelText('Quitar selección: Carrera')).toBeTruthy();
    expect(screen.getByLabelText('Quitar selección: Aguante')).toBeTruthy();
  });

  it('invokes onDeselect with the class-bonus entry when its × is clicked', () => {
    const onDeselect = vi.fn();
    render(
      createElement(FeatSummaryCard, {
        chosenFeats: CHOSEN,
        onModify: () => {},
        onDeselect,
      }),
    );
    fireEvent.click(screen.getByLabelText('Quitar selección: Carrera'));
    expect(onDeselect).toHaveBeenCalledTimes(1);
    expect(onDeselect).toHaveBeenCalledWith(CHOSEN[0]);
  });

  it('invokes onDeselect with the general entry when its × is clicked', () => {
    const onDeselect = vi.fn();
    render(
      createElement(FeatSummaryCard, {
        chosenFeats: CHOSEN,
        onModify: () => {},
        onDeselect,
      }),
    );
    fireEvent.click(screen.getByLabelText('Quitar selección: Aguante'));
    expect(onDeselect).toHaveBeenCalledTimes(1);
    expect(onDeselect).toHaveBeenCalledWith(CHOSEN[1]);
  });

  it('preserves the Modificar selección button alongside the × buttons', () => {
    const onModify = vi.fn();
    render(
      createElement(FeatSummaryCard, {
        chosenFeats: CHOSEN,
        onModify,
        onDeselect: () => {},
      }),
    );
    const modifyBtn = screen.getByRole('button', { name: /modificar selección/i });
    fireEvent.click(modifyBtn);
    expect(onModify).toHaveBeenCalledTimes(1);
  });

  it('exposes data-slot-kind + data-slot-index + data-testid for Playwright + DOM queries', () => {
    const { container } = render(
      createElement(FeatSummaryCard, {
        chosenFeats: CHOSEN,
        onModify: () => {},
        onDeselect: () => {},
      }),
    );
    const classBonusBtn = container.querySelector(
      '[data-testid="deselect-chip-class-bonus-0"]',
    );
    const generalBtn = container.querySelector(
      '[data-testid="deselect-chip-general-0"]',
    );
    expect(classBonusBtn).not.toBeNull();
    expect(generalBtn).not.toBeNull();
    const classBonusItem = container.querySelector(
      'li[data-slot-kind="class-bonus"][data-slot-index="0"]',
    );
    expect(classBonusItem).not.toBeNull();
  });
});
