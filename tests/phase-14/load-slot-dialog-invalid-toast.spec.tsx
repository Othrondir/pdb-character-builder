// @vitest-environment jsdom

/**
 * Phase 14-02 — LoadSlotDialog invalid-row toast regression spec.
 *
 * Locks the caller-side wiring of the new LoadSlotResult discriminated
 * union: the LoadSlotDialog.onPick switch must surface a Spanish
 * `loadInvalid` toast on `{kind: 'invalid'}` and MUST NOT hydrate the
 * planner stores. SHAR-02 + SHAR-05 fail-closed posture preserved.
 *
 * Vitest convention (Phase 12.8-03 D-13 lessons-learned): use
 * `createElement(Component, props)` NOT JSX — Vitest default esbuild does
 * not auto-inject the React runtime. Each `it` declaration needs an
 * explicit `cleanup()` afterEach since RTL does not auto-cleanup between
 * blocks under Vitest's default globals.
 *
 * Companion to tests/phase-14/load-slot-noop-result.spec.ts (the pure
 * union spec) and tests/phase-10/load-slot-version-mismatch.spec.tsx
 * (the diffRuleset gate that this plan must NOT regress).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
// Reuse phase-08 setup for fake-indexeddb polyfill + sampleBuildDocument.
import '../phase-08/setup';
import { sampleBuildDocument } from '../phase-08/setup';
import { saveSlot } from '@planner/features/persistence/slot-api';
import {
  __resetPlannerDbForTests,
  getPlannerDb,
} from '@planner/features/persistence/dexie-db';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { LoadSlotDialog } from '@planner/features/summary/save-slot-dialog';
import { Toast, __resetToastForTests } from '@planner/components/ui/toast';

// Mirror tests/phase-10/load-slot-version-mismatch.spec.tsx:21-30 — jsdom
// doesn't implement showModal/close on HTMLDialogElement; stub them so the
// LoadSlotDialog actually renders its <dialog> contents.
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

/**
 * Test harness — mounts the LoadSlotDialog beside the global Toast portal
 * so `pushToast(...)` rendered text is observable via RTL queries.
 * Mirrors the pattern from tests/phase-14/toast-clobber-race.spec.tsx but
 * narrowed to a single render() call per test.
 */
function Harness({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return createElement(
    'div',
    null,
    createElement(LoadSlotDialog, { open, onClose }),
    createElement(Toast),
  );
}

describe('LoadSlotDialog handles LoadSlotResult kinds (Phase 14-02)', () => {
  beforeEach(async () => {
    document.body.innerHTML = '';
    __resetPlannerDbForTests();
    __resetToastForTests();
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
    __resetToastForTests();
  });

  // C1: ok arm — round-trip identity preserved + onClose fires (B1 invariant
  // from the threat register: pre-fix happy path must not regress).
  it('hydrates and calls onClose when the slot is valid', async () => {
    const doc = sampleBuildDocument();
    await saveSlot('valid-slot', doc);

    const onClose = vi.fn();
    render(createElement(Harness, { open: true, onClose }));

    const slotButton = await screen.findByRole('button', {
      name: /valid-slot/,
    });
    fireEvent.click(slotButton);

    await waitFor(() => {
      expect(useCharacterFoundationStore.getState().raceId).toBe('race:human');
    });
    expect(onClose).toHaveBeenCalled();
  });

  // C2: invalid arm — tampered row produces Spanish loadInvalid toast,
  // does NOT hydrate, does NOT close the dialog.
  it('surfaces loadInvalid toast and does not hydrate on tampered row', async () => {
    const tampered = { ...sampleBuildDocument(), schemaVersion: 99 };
    await getPlannerDb().builds.put({
      name: 'tampered',
      payload: tampered as unknown as ReturnType<typeof sampleBuildDocument>,
      createdAt: 0,
      updatedAt: 0,
    });

    const onClose = vi.fn();
    render(createElement(Harness, { open: true, onClose }));

    const slotButton = await screen.findByRole('button', {
      name: /tampered/,
    });
    fireEvent.click(slotButton);

    // (a) Spanish loadInvalid toast surfaced — assert the curated copy
    //     prefix is present (raw Zod `reason` is NOT user-visible per
    //     T-14-02-02 accept disposition).
    await screen.findByText(/No se pudo cargar la build "tampered"/);

    // (b) raceId still null — no hydrate happened.
    expect(useCharacterFoundationStore.getState().raceId).toBeNull();

    // (c) onClose NOT called — dialog stays open so the user can pick
    //     a different slot.
    expect(onClose).not.toHaveBeenCalled();
  });
});
