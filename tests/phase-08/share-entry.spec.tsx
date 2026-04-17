// @vitest-environment jsdom
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { createElement } from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { RouterProvider } from '@tanstack/react-router';
import './setup';
import { sampleBuildDocument } from './setup';
import { encodeSharePayload } from '@planner/features/persistence';
import { createPlannerRouter } from '@planner/router';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';
import { usePlannerShellStore } from '@planner/state/planner-shell';

// jsdom's HTMLDialogElement doesn't implement showModal/close — stub them so
// VersionMismatchDialog renders its <dialog> contents.
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
 * Render the planner router with an initial memory-history entry so we can drive
 * /share?b=... variations without touching window.location.
 */
function renderRouter(initialEntry: string) {
  const router = createPlannerRouter([initialEntry]);
  return render(createElement(RouterProvider, { router }));
}

describe('ShareEntry (D-05 + D-07 + SHAR-04/05)', () => {
  beforeEach(() => {
    useCharacterFoundationStore.getState().resetFoundation();
    usePlannerShellStore.getState().setActiveView('creation');
  });
  afterEach(() => {
    cleanup();
  });

  it('clean match: hydrates stores, sets activeView to creation', async () => {
    const encoded = encodeSharePayload(sampleBuildDocument());
    renderRouter(`/share?b=${encoded}`);

    await waitFor(() => {
      expect(useCharacterFoundationStore.getState().raceId).toBe('race:human');
    });
    // No mismatch dialog, no error copy.
    expect(screen.queryByText(/Versión incompatible/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/URL no válida/i)).not.toBeInTheDocument();
  });

  it('rulesetVersion mismatch: dialog renders, stores NOT hydrated', async () => {
    const badDoc = { ...sampleBuildDocument(), rulesetVersion: '9.9.9' };
    const encoded = encodeSharePayload(badDoc);
    renderRouter(`/share?b=${encoded}`);

    await waitFor(() => {
      expect(screen.getByText(/Versión incompatible/i)).toBeInTheDocument();
    });
    // The diff side-by-side shows the incoming version.
    expect(screen.getByText('9.9.9')).toBeInTheDocument();
    // Stores untouched.
    expect(useCharacterFoundationStore.getState().raceId).toBeNull();
  });

  it('malformed base64url in `b`: renders error state with invalid-payload copy', async () => {
    renderRouter('/share?b=!!invalid!!');

    await waitFor(() => {
      expect(screen.getByText(/URL no válida/i)).toBeInTheDocument();
    });
    // Stores untouched.
    expect(useCharacterFoundationStore.getState().raceId).toBeNull();
  });

  it('empty `b` param: Zod default/catch path yields empty-payload error', async () => {
    renderRouter('/share?b=');

    await waitFor(() => {
      expect(screen.getByText(/URL no válida/i)).toBeInTheDocument();
    });
    expect(
      screen.getByText(/no contiene una build/i),
    ).toBeInTheDocument();
    expect(useCharacterFoundationStore.getState().raceId).toBeNull();
  });

  it('valid deflate + valid JSON but schema-violating shape: renders error state', async () => {
    // Encode a payload that decompresses to valid JSON but fails buildDocumentSchema.parse
    // (unknown key at root → .strict() rejects).
    const bogusPayload = { ...sampleBuildDocument(), extraneousKey: 'boom' };
    const encoded = encodeSharePayload(bogusPayload as never);
    renderRouter(`/share?b=${encoded}`);

    await waitFor(() => {
      expect(screen.getByText(/URL no válida/i)).toBeInTheDocument();
    });
    expect(useCharacterFoundationStore.getState().raceId).toBeNull();
  });
});
