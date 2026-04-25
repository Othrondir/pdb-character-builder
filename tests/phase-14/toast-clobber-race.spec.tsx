// @vitest-environment jsdom

/**
 * Phase 14-01 — Toast clobber race regression spec.
 *
 * Locks ROADMAP SC#1 (Phase 14): a new toast arriving within MIN_VISIBLE_MS
 * (1500 ms) of the prior toast must be queued FIFO, not visually replace
 * the prior message before the user can read it.
 *
 * RED state proof: with the pre-fix toast.tsx (`current = next` overwrite
 * on every pushToast), tests A1, A4, A5 fail because the second message
 * appears immediately and the first is clobbered. A3 happens to pass
 * because the slow-arrival contract (replace) is identical to the
 * pre-fix behaviour. A2 may pass coincidentally on the dismiss path.
 *
 * Vitest convention (locked Phase 12.8-03 D-13 lessons-learned): use
 * `createElement(Component, props)` NOT JSX — Vitest default esbuild
 * does not auto-inject the React runtime. Each `it` declaration needs
 * an explicit `cleanup()` afterEach since RTL does not auto-cleanup
 * between blocks under Vitest's default globals.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { createElement } from 'react';
import {
  Toast,
  dismissToast,
  pushToast,
  useToast,
} from '@planner/components/ui/toast';

// Spec-local oracle. After Task 2 (GREEN) the implementation exports
// MIN_VISIBLE_MS = 1500; a sentinel test asserts parity. The constant
// is duplicated here so the spec stays independent of import shape.
const MIN_VISIBLE_MS = 1500;

describe('Phase 14-01 — toast clobber race + queue drain', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Flush any leftover module state from prior tests. dismissToast()
    // is idempotent; after Task 2 it will also drain the queue head.
    dismissToast();
  });

  afterEach(() => {
    // Drain timers + restore real timers BEFORE cleanup so any pending
    // setTimeout from <Toast/>'s 5-second auto-dismiss does not leak.
    vi.useRealTimers();
    cleanup();
    // Final dismiss to reset module-scoped `current` for the next test.
    dismissToast();
  });

  it('A1 — second pushToast within 50 ms is queued, not visible immediately', () => {
    render(createElement(Toast));

    act(() => {
      pushToast('primero', 'info');
    });
    expect(screen.queryByText('primero')).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(50);
      pushToast('segundo', 'info');
    });

    // Second message MUST NOT clobber the first.
    expect(screen.queryByText('primero')).not.toBeNull();
    expect(screen.queryByText('segundo')).toBeNull();

    // After MIN_VISIBLE_MS elapses, the queue head surfaces.
    act(() => {
      vi.advanceTimersByTime(MIN_VISIBLE_MS);
    });
    expect(screen.queryByText('segundo')).not.toBeNull();
  });

  it('A2 — dismissToast flushes queue head if any, otherwise sets current=null', () => {
    // Mount a probe component to read useToast() output.
    let observed: ReturnType<typeof useToast> = null;
    function Probe() {
      observed = useToast();
      return null;
    }
    render(createElement(Probe));

    act(() => {
      pushToast('solo', 'info');
    });
    expect(observed?.body).toBe('solo');

    act(() => {
      dismissToast();
    });
    expect(observed).toBeNull();

    // Pushing again after a clean dismiss should land directly on `current`.
    act(() => {
      pushToast('siguiente', 'info');
    });
    expect(observed?.body).toBe('siguiente');
  });

  it('A3 — slow arrival (>= MIN_VISIBLE_MS apart) replaces immediately, no queue', () => {
    render(createElement(Toast));

    act(() => {
      pushToast('primero', 'info');
    });
    expect(screen.queryByText('primero')).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(MIN_VISIBLE_MS + 1);
      pushToast('segundo', 'info');
    });

    // Slow path: replace, no queueing.
    expect(screen.queryByText('primero')).toBeNull();
    expect(screen.queryByText('segundo')).not.toBeNull();
  });

  it('A4 — auto-dismiss after 5000 ms surfaces queued toast immediately', () => {
    render(createElement(Toast));

    act(() => {
      pushToast('primero', 'info');
    });
    act(() => {
      vi.advanceTimersByTime(50);
      pushToast('segundo', 'info');
    });

    // First still visible, second queued.
    expect(screen.queryByText('primero')).not.toBeNull();
    expect(screen.queryByText('segundo')).toBeNull();

    // Advance to the 5-second auto-dismiss boundary. With queue drain
    // wired through dismissToast, the queued message should surface.
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.queryByText('primero')).toBeNull();
    expect(screen.queryByText('segundo')).not.toBeNull();
  });

  it('A5 — tone is preserved per-message across queue drain (info stays mid-window, warn surfaces after)', () => {
    const { container } = render(createElement(Toast));

    act(() => {
      pushToast('primero', 'info');
    });
    expect(container.querySelector('.toast--info')).not.toBeNull();
    expect(container.querySelector('.toast--warn')).toBeNull();

    act(() => {
      vi.advanceTimersByTime(50);
      pushToast('segundo', 'warn');
    });

    // MID-WINDOW: queued warn must NOT have surfaced; info tone must hold.
    // (RED: pre-fix replace semantics flip the tone immediately, failing here.)
    expect(container.querySelector('.toast--info')).not.toBeNull();
    expect(container.querySelector('.toast--warn')).toBeNull();
    expect(screen.queryByText('primero')).not.toBeNull();
    expect(screen.queryByText('segundo')).toBeNull();

    // Drain to expose the queued warn message.
    act(() => {
      vi.advanceTimersByTime(MIN_VISIBLE_MS);
    });

    expect(container.querySelector('.toast--warn')).not.toBeNull();
    expect(screen.queryByText('segundo')).not.toBeNull();
  });
});
