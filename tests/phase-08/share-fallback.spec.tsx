// @vitest-environment jsdom
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { createElement } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import './setup';
import { sampleBuildDocument } from './setup';
import { ResumenBoard } from '@planner/features/summary/resumen-board';
import * as persistence from '@planner/features/persistence';
import * as toast from '@planner/components/ui/toast';
import { shellCopyEs } from '@planner/lib/copy/es';

// jsdom's HTMLDialogElement doesn't implement showModal/close — stub them just in case
// VersionMismatchDialog ever mounts (shouldn't in these cases).
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

describe('Compartir — clipboard success + D-06 JSON fallback', () => {
  let encodeSpy: ReturnType<typeof vi.spyOn>;
  let budgetSpy: ReturnType<typeof vi.spyOn>;
  let downloadSpy: ReturnType<typeof vi.spyOn>;
  let projectSpy: ReturnType<typeof vi.spyOn>;
  let toastSpy: ReturnType<typeof vi.spyOn>;
  let clipboardWrite: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock projectBuildDocument so we don't need full zustand store wiring (raceId,
    // alignmentId, etc. are null by default and would fail Zod validation).
    projectSpy = vi
      .spyOn(persistence, 'projectBuildDocument')
      .mockImplementation(() => sampleBuildDocument());
    encodeSpy = vi.spyOn(persistence, 'encodeSharePayload');
    budgetSpy = vi.spyOn(persistence, 'exceedsBudget');
    downloadSpy = vi
      .spyOn(persistence, 'downloadBuildAsJson')
      .mockImplementation(() => undefined);
    // Spy on pushToast — the <Toast /> surface itself lives in PlannerShellFrame, not
    // ResumenBoard, so we assert the call rather than probing rendered text.
    toastSpy = vi
      .spyOn(toast, 'pushToast')
      .mockImplementation(() => undefined);
    clipboardWrite = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: clipboardWrite },
      configurable: true,
    });
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('copies share URL to clipboard when payload fits budget', async () => {
    encodeSpy.mockReturnValue('short-payload' as never);
    budgetSpy.mockReturnValue(false as never);

    render(createElement(ResumenBoard));
    fireEvent.click(screen.getByRole('button', { name: /Compartir/i }));

    await waitFor(() => {
      expect(clipboardWrite).toHaveBeenCalledTimes(1);
    });
    // The URL passed to clipboard ends with the encoded payload.
    const [url] = clipboardWrite.mock.calls[0];
    expect(url).toContain('#/share?b=short-payload');
    // No JSON fallback on the happy path.
    expect(downloadSpy).not.toHaveBeenCalled();
  });

  it('falls back to JSON download when payload exceeds budget', async () => {
    encodeSpy.mockReturnValue('x'.repeat(2000) as never);
    budgetSpy.mockReturnValue(true as never);

    render(createElement(ResumenBoard));
    fireEvent.click(screen.getByRole('button', { name: /Compartir/i }));

    await waitFor(() => {
      expect(downloadSpy).toHaveBeenCalledTimes(1);
    });
    expect(clipboardWrite).not.toHaveBeenCalled();
    // Fallback toast was pushed with the D-06 copy at warn tone.
    expect(toastSpy).toHaveBeenCalledWith(
      shellCopyEs.persistence.shareFallback,
      'warn',
    );
  });
});
