// @vitest-environment jsdom
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { createElement } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { shellCopyEs } from '@planner/lib/copy/es';

// Spy hooks for persistence calls.
const saveSlotMock = vi.fn(async () => undefined);
const slotExistsMock = vi.fn(async (_: string) => false);
const projectBuildDocumentMock = vi.fn(() => ({ stub: true }));
const listSlotsMock = vi.fn(async () => []);
const loadSlotMock = vi.fn(async (_: string) => null);
const hydrateBuildDocumentMock = vi.fn();
const pushToastMock = vi.fn();

vi.mock('@planner/features/persistence', () => ({
  saveSlot: (name: string, doc: unknown) => saveSlotMock(name as never, doc as never),
  slotExists: (name: string) => slotExistsMock(name),
  projectBuildDocument: (...args: unknown[]) => projectBuildDocumentMock(...args),
  listSlots: () => listSlotsMock(),
  loadSlot: (name: string) => loadSlotMock(name),
  hydrateBuildDocument: (doc: unknown) => hydrateBuildDocumentMock(doc as never),
}));
vi.mock('@planner/components/ui/toast', () => ({
  pushToast: (body: string, tone?: string) => pushToastMock(body, tone),
}));

// jsdom's HTMLDialogElement doesn't implement showModal/close — stub them.
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function () {
    (this as HTMLDialogElement & { open: boolean }).open = true;
  };
}
if (!HTMLDialogElement.prototype.close) {
  HTMLDialogElement.prototype.close = function () {
    (this as HTMLDialogElement & { open: boolean }).open = false;
  };
}

import {
  SaveSlotDialog,
  LoadSlotDialog,
} from '@planner/features/summary/save-slot-dialog';

describe('SaveSlotDialog', () => {
  beforeEach(() => {
    saveSlotMock.mockReset();
    slotExistsMock.mockReset().mockResolvedValue(false);
    projectBuildDocumentMock.mockReset().mockReturnValue({ stub: true });
    pushToastMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('saves directly when the slot name does not already exist', async () => {
    const onClose = vi.fn();
    render(createElement(SaveSlotDialog, { open: true, onClose }));
    const nameInput = screen.getByLabelText(
      shellCopyEs.persistence.saveDialog.nameLabel,
    ) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'my-paladin' } });
    fireEvent.click(
      screen.getByRole('button', {
        name: shellCopyEs.persistence.saveDialog.confirm,
      }),
    );

    // Yield to the microtask queue so the async save chain resolves.
    await Promise.resolve();
    await Promise.resolve();

    expect(slotExistsMock).toHaveBeenCalledWith('my-paladin');
    expect(projectBuildDocumentMock).toHaveBeenCalledWith('my-paladin');
    expect(saveSlotMock).toHaveBeenCalledWith('my-paladin', { stub: true });
    expect(pushToastMock).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('opens the overwrite ConfirmDialog when the slot name already exists', async () => {
    slotExistsMock.mockResolvedValue(true);
    render(createElement(SaveSlotDialog, { open: true, onClose: vi.fn() }));
    const nameInput = screen.getByLabelText(
      shellCopyEs.persistence.saveDialog.nameLabel,
    ) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'paladin' } });
    fireEvent.click(
      screen.getByRole('button', {
        name: shellCopyEs.persistence.saveDialog.confirm,
      }),
    );

    await Promise.resolve();
    await Promise.resolve();

    // The overwrite dialog's title should appear.
    expect(
      screen.getByText(shellCopyEs.persistence.overwriteDialog.title),
    ).toBeInTheDocument();
    // saveSlot NOT yet called — must wait for confirmation.
    expect(saveSlotMock).not.toHaveBeenCalled();
  });

  it('calls saveSlot when the user confirms the overwrite', async () => {
    slotExistsMock.mockResolvedValue(true);
    const onClose = vi.fn();
    render(createElement(SaveSlotDialog, { open: true, onClose }));
    const nameInput = screen.getByLabelText(
      shellCopyEs.persistence.saveDialog.nameLabel,
    ) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'paladin' } });
    fireEvent.click(
      screen.getByRole('button', {
        name: shellCopyEs.persistence.saveDialog.confirm,
      }),
    );

    // Wait for overwrite dialog to appear.
    const aceptarBtn = await waitFor(() =>
      screen.getByRole('button', { name: 'Aceptar' }),
    );

    // Click Aceptar on the ConfirmDialog variant.
    fireEvent.click(aceptarBtn);

    await waitFor(() => {
      expect(saveSlotMock).toHaveBeenCalledWith('paladin', { stub: true });
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('does NOT call saveSlot when the user cancels the overwrite', async () => {
    slotExistsMock.mockResolvedValue(true);
    render(createElement(SaveSlotDialog, { open: true, onClose: vi.fn() }));
    const nameInput = screen.getByLabelText(
      shellCopyEs.persistence.saveDialog.nameLabel,
    ) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'paladin' } });
    fireEvent.click(
      screen.getByRole('button', {
        name: shellCopyEs.persistence.saveDialog.confirm,
      }),
    );

    // Wait for overwrite dialog to render.
    const cancelarBtns = await waitFor(() =>
      screen.getAllByRole('button', { name: 'Cancelar' }),
    );
    // Click the Cancelar button inside the ConfirmDialog (last one rendered).
    fireEvent.click(cancelarBtns[cancelarBtns.length - 1]);

    // Nothing else to wait on, but give the microtask queue a beat.
    await Promise.resolve();
    expect(saveSlotMock).not.toHaveBeenCalled();
  });
});

describe('LoadSlotDialog', () => {
  beforeEach(() => {
    listSlotsMock.mockReset().mockResolvedValue([]);
    loadSlotMock.mockReset().mockResolvedValue(null);
    hydrateBuildDocumentMock.mockReset();
    pushToastMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('shows the empty-state message when there are no slots', async () => {
    render(createElement(LoadSlotDialog, { open: true, onClose: vi.fn() }));
    // Wait for listSlots to resolve + React to re-render.
    await waitFor(() => {
      expect(screen.getByText(shellCopyEs.resumen.noSlotsMessage)).toBeInTheDocument();
    });
  });
});
