// @vitest-environment jsdom

/**
 * Phase 15-01 SC#2 — focus-return contract for 4 native dialogs + drawer.
 *
 * The jsdom polyfill (tests/phase-15/setup.ts) monkey-patches
 * HTMLDialogElement.prototype.showModal/close to record document.activeElement
 * at showModal() time and restore it on close(). This makes the spec assert
 * the BROWSER top-layer focus-return contract end-to-end — the test bodies
 * never call `opener.focus()` themselves (vacuous-assertion guard).
 *
 * No JSX (Vitest default esbuild lacks React runtime auto-inject).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, fireEvent, act } from '@testing-library/react';
import { createElement, useState, useRef, type ReactElement } from 'react';
import { ConfirmDialog } from '@planner/components/ui/confirm-dialog';
import { VersionMismatchDialog } from '@planner/components/ui/version-mismatch-dialog';
import {
  SaveSlotDialog,
  LoadSlotDialog,
} from '@planner/features/summary/save-slot-dialog';
import { MobileNavToggle } from '@planner/components/shell/mobile-nav-toggle';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import * as persistence from '@planner/features/persistence';

// Stub persistence module to keep dialogs from hitting IndexedDB during tests.
vi.spyOn(persistence, 'listSlots').mockResolvedValue([]);

interface OpenerHarnessProps {
  renderDialog: (open: boolean, close: () => void) => ReactElement;
}

function OpenerHarness({ renderDialog }: OpenerHarnessProps): ReactElement {
  const [open, setOpen] = useState(false);
  const openerRef = useRef<HTMLButtonElement>(null);
  return createElement(
    'div',
    null,
    createElement(
      'button',
      {
        ref: openerRef,
        'data-testid': 'opener',
        type: 'button',
        onClick: () => setOpen(true),
      },
      'open',
    ),
    renderDialog(open, () => setOpen(false)),
  );
}

describe('Phase 15-01 — focus-return on dialog close', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    usePlannerShellStore.setState({ mobileNavOpen: false });
  });

  afterEach(() => {
    cleanup();
    usePlannerShellStore.setState({ mobileNavOpen: false });
  });

  it('returns focus to opener when ConfirmDialog closes', () => {
    const { getByTestId, getByText } = render(
      createElement(OpenerHarness, {
        renderDialog: (open, close) =>
          createElement(ConfirmDialog, {
            open,
            title: 't',
            body: 'b',
            onCancel: close,
            onConfirm: close,
          }),
      }),
    );
    const opener = getByTestId('opener') as HTMLButtonElement;
    opener.focus();
    expect(document.activeElement).toBe(opener);
    fireEvent.click(opener);
    // Dialog now open via state transition; polyfill recorded opener.
    fireEvent.click(getByText('Cancelar'));
    expect(document.activeElement).toBe(opener);
  });

  it('returns focus to opener when VersionMismatchDialog closes', () => {
    const diff = {
      mismatchFields: ['rulesetVersion'] as Array<'rulesetVersion' | 'datasetId'>,
      incomingRulesetVersion: '1.0.0',
      currentRulesetVersion: '2.0.0',
      incomingDatasetId: 'a',
      currentDatasetId: 'b',
    };
    const { getByTestId, getAllByRole } = render(
      createElement(OpenerHarness, {
        renderDialog: (open, close) =>
          createElement(VersionMismatchDialog, {
            open,
            diff,
            onDownloadJson: () => {},
            onCancel: close,
          }),
      }),
    );
    const opener = getByTestId('opener') as HTMLButtonElement;
    opener.focus();
    fireEvent.click(opener);
    // Click the Cancelar button (first button labelled "Cancelar")
    const cancelBtn = getAllByRole('button').find(
      (b) => b.textContent === 'Cancelar',
    ) as HTMLButtonElement;
    fireEvent.click(cancelBtn);
    expect(document.activeElement).toBe(opener);
  });

  it('returns focus to opener when SaveSlotDialog closes', () => {
    const { getByTestId, getAllByRole } = render(
      createElement(OpenerHarness, {
        renderDialog: (open, close) =>
          createElement(SaveSlotDialog, { open, onClose: close }),
      }),
    );
    const opener = getByTestId('opener') as HTMLButtonElement;
    opener.focus();
    fireEvent.click(opener);
    const cancelBtn = getAllByRole('button').find(
      (b) => b.textContent === 'Cancelar',
    ) as HTMLButtonElement;
    fireEvent.click(cancelBtn);
    expect(document.activeElement).toBe(opener);
  });

  it('returns focus to opener when LoadSlotDialog closes', async () => {
    const { getByTestId, getAllByRole } = render(
      createElement(OpenerHarness, {
        renderDialog: (open, close) =>
          createElement(LoadSlotDialog, { open, onClose: close }),
      }),
    );
    const opener = getByTestId('opener') as HTMLButtonElement;
    opener.focus();
    await act(async () => {
      fireEvent.click(opener);
      // Allow listSlots() promise to settle.
      await Promise.resolve();
    });
    const cancelBtn = getAllByRole('button').find(
      (b) => b.textContent === 'Cancelar',
    ) as HTMLButtonElement;
    fireEvent.click(cancelBtn);
    expect(document.activeElement).toBe(opener);
  });

  it('returns focus to mobile-nav toggle when drawer closes', () => {
    usePlannerShellStore.setState({ mobileNavOpen: false });
    const { container } = render(createElement(MobileNavToggle));
    const toggle = container.querySelector<HTMLButtonElement>(
      'button.planner-shell__mobile-toggle',
    );
    expect(toggle).not.toBeNull();
    toggle!.focus();
    // Open drawer via toggle click.
    fireEvent.click(toggle!);
    // Close via the close button inside the drawer (drawer renders only when open).
    const closeBtn = container.querySelector<HTMLButtonElement>(
      'button.planner-shell__mobile-close',
    );
    expect(closeBtn).not.toBeNull();
    fireEvent.click(closeBtn!);
    expect(document.activeElement).toBe(toggle);
  });
});
