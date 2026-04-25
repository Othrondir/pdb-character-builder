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
  MIN_VISIBLE_MS,
  Toast,
  __resetToastForTests,
  dismissToast,
  pushToast,
  useToast,
} from '@planner/components/ui/toast';

describe('Phase 14-01 — toast clobber race + queue drain', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Deterministic module-state reset: clears queue + current +
    // visibleSince + drainTimer + notifies listeners.
    __resetToastForTests();
  });

  afterEach(() => {
    // Drain timers + restore real timers BEFORE cleanup so any pending
    // setTimeout from <Toast/>'s 5-second auto-dismiss does not leak.
    vi.useRealTimers();
    cleanup();
    __resetToastForTests();
  });

  it('exports MIN_VISIBLE_MS = 1500', () => {
    expect(MIN_VISIBLE_MS).toBe(1500);
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

  it('A4 — queue drain surfaces queued toast; subsequent 5s auto-dismiss applies to the new head', () => {
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

    // Stage 1: advance past the queue-drain boundary. drainTimer fires at
    // +1500ms relative to primero's visibleSince (i.e. +1450 from now) and
    // calls dismissToast → segundo surfaces. We isolate this in its own
    // `act` block so React's useEffect cleanup runs and clears primero's
    // pending 5s setTimeout BEFORE we advance further.
    act(() => {
      vi.advanceTimersByTime(MIN_VISIBLE_MS);
    });
    expect(screen.queryByText('primero')).toBeNull();
    expect(screen.queryByText('segundo')).not.toBeNull();

    // Stage 2: advance to segundo's own 5s auto-dismiss boundary. After
    // dismissToast() segundo's auto-dismiss should fire; queue is now
    // empty so current → null and the toast is removed from the DOM.
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.queryByText('segundo')).toBeNull();
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
