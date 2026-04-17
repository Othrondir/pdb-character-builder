// @vitest-environment jsdom
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { createElement } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import './setup';
import { sampleBuildDocument } from './setup';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';

// jsdom's HTMLDialogElement doesn't implement showModal/close — stub them so the
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

import { ResumenBoard } from '@planner/features/summary/resumen-board';

function makeFile(doc: unknown, name = 'build.json'): File {
  return new File([JSON.stringify(doc)], name, { type: 'application/json' });
}

describe('D-07 / SHAR-05: JSON-import version-mismatch gate', () => {
  beforeEach(() => {
    useCharacterFoundationStore.getState().resetFoundation();
  });
  afterEach(() => {
    cleanup();
  });

  it('matching versions: file is hydrated normally, no dialog', async () => {
    render(createElement(ResumenBoard));
    const input = screen.getByLabelText(/Importar JSON/i) as HTMLInputElement;
    const file = makeFile(sampleBuildDocument());
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    fireEvent.change(input);

    await waitFor(() => {
      expect(useCharacterFoundationStore.getState().raceId).toBe('race:human');
    });
    expect(screen.queryByText(/Versión incompatible/i)).not.toBeInTheDocument();
  });

  it('mismatched rulesetVersion: dialog renders, stores NOT hydrated', async () => {
    const badDoc = { ...sampleBuildDocument(), rulesetVersion: '9.9.9' };
    render(createElement(ResumenBoard));
    const input = screen.getByLabelText(/Importar JSON/i) as HTMLInputElement;
    Object.defineProperty(input, 'files', {
      value: [makeFile(badDoc)],
      configurable: true,
    });
    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText(/Versión incompatible/i)).toBeInTheDocument();
    });
    expect(useCharacterFoundationStore.getState().raceId).toBeNull();
  });

  it('mismatched datasetId: dialog renders, stores NOT hydrated', async () => {
    const badDoc = {
      ...sampleBuildDocument(),
      datasetId: 'puerta-ee-2099-01-01+deadbeef',
    };
    render(createElement(ResumenBoard));
    const input = screen.getByLabelText(/Importar JSON/i) as HTMLInputElement;
    Object.defineProperty(input, 'files', {
      value: [makeFile(badDoc)],
      configurable: true,
    });
    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText(/Versión incompatible/i)).toBeInTheDocument();
    });
    expect(useCharacterFoundationStore.getState().raceId).toBeNull();
  });

  it('Cancelar closes the dialog; no hydration, no further download', async () => {
    const badDoc = { ...sampleBuildDocument(), rulesetVersion: '9.9.9' };
    render(createElement(ResumenBoard));
    const input = screen.getByLabelText(/Importar JSON/i) as HTMLInputElement;
    Object.defineProperty(input, 'files', {
      value: [makeFile(badDoc)],
      configurable: true,
    });
    fireEvent.change(input);

    await waitFor(() =>
      expect(screen.getByText(/Versión incompatible/i)).toBeInTheDocument(),
    );
    // The version-mismatch dialog has its own Cancelar button; save/load dialogs
    // are closed here so this is the only Cancelar in the DOM.
    fireEvent.click(screen.getByRole('button', { name: /^Cancelar$/i }));
    await waitFor(() => {
      expect(screen.queryByText(/Versión incompatible/i)).not.toBeInTheDocument();
    });
    expect(useCharacterFoundationStore.getState().raceId).toBeNull();
  });

  it('Descargar JSON re-emits the pending doc; stores NOT hydrated', async () => {
    const badDoc = { ...sampleBuildDocument(), rulesetVersion: '9.9.9' };

    const persistence = await import('@planner/features/persistence');
    const downloadSpy = vi
      .spyOn(persistence, 'downloadBuildAsJson')
      .mockImplementation(() => undefined);

    render(createElement(ResumenBoard));
    const input = screen.getByLabelText(/Importar JSON/i) as HTMLInputElement;
    Object.defineProperty(input, 'files', {
      value: [makeFile(badDoc)],
      configurable: true,
    });
    fireEvent.change(input);

    await waitFor(() =>
      expect(screen.getByText(/Versión incompatible/i)).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('button', { name: /Descargar JSON/i }));

    await waitFor(() => expect(downloadSpy).toHaveBeenCalledTimes(1));
    expect(useCharacterFoundationStore.getState().raceId).toBeNull();

    downloadSpy.mockRestore();
  });
});
