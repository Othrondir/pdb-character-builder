// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
// Reuse phase-08 setup for fake-indexeddb polyfill + sampleBuildDocument helper.
import '../phase-08/setup';
import { sampleBuildDocument } from '../phase-08/setup';
import { saveSlot } from '@planner/features/persistence/slot-api';
import { __resetPlannerDbForTests } from '@planner/features/persistence/dexie-db';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { LoadSlotDialog } from '@planner/features/summary/save-slot-dialog';

// jsdom's HTMLDialogElement doesn't implement showModal/close — stub them so the
// LoadSlotDialog and VersionMismatchDialog actually render their <dialog> contents.
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

// SHAR-02 + SHAR-05 (Phase 10 integration fix): the Cargar (load-slot) path must
// honor the same D-07 fail-closed gate as the /share decode and JSON-import paths.
// Plan 10-02 extends diffRuleset() to LoadSlotDialog.onPick so a slot saved under
// an older ruleset or a different datasetId renders VersionMismatchDialog instead
// of silently hydrating the planner stores.
describe('SHAR-02 + SHAR-05 LoadSlotDialog diffRuleset gate (Phase 10)', () => {
  beforeEach(async () => {
    document.body.innerHTML = '';
    // Reset the Dexie singleton + wipe the fake-indexeddb DB between tests so
    // saveSlot/listSlots state does not leak across cases.
    __resetPlannerDbForTests();
    const fakeIDB = (globalThis as unknown as { indexedDB: IDBFactory })
      .indexedDB;
    await new Promise<void>((resolve) => {
      const req = fakeIDB.deleteDatabase('pdb-character-builder');
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    });
    useCharacterFoundationStore.getState().resetFoundation();
  });

  afterEach(() => {
    cleanup();
  });

  it('hydrates when the slot matches the current ruleset+dataset', async () => {
    // Arrange: saved slot uses the current RULESET_VERSION + CURRENT_DATASET_ID
    // (sampleBuildDocument defaults to both).
    const doc = sampleBuildDocument();
    await saveSlot('slot-match', doc);

    const onClose = vi.fn();
    render(createElement(LoadSlotDialog, { open: true, onClose }));

    // Wait for listSlots() to resolve + the slot row button to render.
    const slotButton = await screen.findByRole('button', {
      name: /slot-match/,
    });
    fireEvent.click(slotButton);

    // Match branch: hydrateBuildDocument is called -> foundation.raceId populated.
    await waitFor(() => {
      expect(useCharacterFoundationStore.getState().raceId).toBe('race:human');
    });
    expect(onClose).toHaveBeenCalled();

    // No mismatch dialog appeared.
    expect(
      screen.queryByText(/Versión incompatible/i),
    ).not.toBeInTheDocument();
  });

  it('does NOT hydrate and renders VersionMismatchDialog on mismatch', async () => {
    // Arrange: slot saved with a mismatching rulesetVersion. diffRuleset(doc) will
    // return a non-null diff, so LoadSlotDialog must route to the mismatch branch.
    const doc = { ...sampleBuildDocument(), rulesetVersion: '9.9.9' };
    await saveSlot('slot-mismatch', doc);

    const onClose = vi.fn();
    render(createElement(LoadSlotDialog, { open: true, onClose }));

    const slotButton = await screen.findByRole('button', {
      name: /slot-mismatch/,
    });
    fireEvent.click(slotButton);

    // Mismatch branch: dialog appears, store is NOT mutated.
    await screen.findByText(/Versión incompatible/i);
    expect(useCharacterFoundationStore.getState().raceId).toBeNull();

    // Cancelar on the mismatch dialog closes it without hydrating. The Cancelar
    // inside the VersionMismatchDialog is rendered after the LoadSlotDialog's
    // own Cancelar, so pick the last match in DOM order.
    const cancelButtons = screen.getAllByRole('button', { name: /^Cancelar$/ });
    fireEvent.click(cancelButtons[cancelButtons.length - 1]);

    await waitFor(() => {
      expect(
        screen.queryByText(/Versión incompatible/i),
      ).not.toBeInTheDocument();
    });
    expect(useCharacterFoundationStore.getState().raceId).toBeNull();
  });
});
