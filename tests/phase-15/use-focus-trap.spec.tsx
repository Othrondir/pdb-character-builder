// @vitest-environment jsdom

/**
 * Phase 15-01 SC#1 — locks the useFocusTrap mechanism against a synthetic
 * container with 3 focusable buttons. Drawer-level wiring is locked by
 * focus-trap-drawer.spec.tsx; this file locks the TRAP semantics cleanly.
 *
 * No JSX (Vitest default esbuild lacks React runtime auto-inject).
 */

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, fireEvent } from '@testing-library/react';
import { createElement, useRef, type ReactElement } from 'react';
import { useFocusTrap } from '@planner/lib/a11y/use-focus-trap';

function TrapHarness({ enabled }: { enabled: boolean }): ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, enabled);
  return createElement(
    'div',
    { ref, 'data-testid': 'trap-container' },
    createElement('button', { 'data-testid': 'btn-a' }, 'A'),
    createElement('button', { 'data-testid': 'btn-b' }, 'B'),
    createElement('button', { 'data-testid': 'btn-c' }, 'C'),
  );
}

afterEach(cleanup);

describe('Phase 15-01 — useFocusTrap', () => {
  it('Tab from last focusable cycles to first when enabled', () => {
    const { getByTestId } = render(createElement(TrapHarness, { enabled: true }));
    const btnA = getByTestId('btn-a') as HTMLButtonElement;
    const btnC = getByTestId('btn-c') as HTMLButtonElement;
    btnC.focus();
    expect(document.activeElement).toBe(btnC);
    fireEvent.keyDown(getByTestId('trap-container'), { key: 'Tab' });
    expect(document.activeElement).toBe(btnA);
  });

  it('Shift-Tab from first focusable cycles to last when enabled', () => {
    const { getByTestId } = render(createElement(TrapHarness, { enabled: true }));
    const btnA = getByTestId('btn-a') as HTMLButtonElement;
    const btnC = getByTestId('btn-c') as HTMLButtonElement;
    btnA.focus();
    fireEvent.keyDown(getByTestId('trap-container'), { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(btnC);
  });

  it('does not trap when enabled=false (Tab from last leaves activeElement unchanged by trap)', () => {
    const { getByTestId } = render(createElement(TrapHarness, { enabled: false }));
    const btnC = getByTestId('btn-c') as HTMLButtonElement;
    btnC.focus();
    fireEvent.keyDown(getByTestId('trap-container'), { key: 'Tab' });
    // Trap is disabled so the listener was never attached;
    // activeElement remains btnC (jsdom does not advance focus on Tab natively).
    expect(document.activeElement).toBe(btnC);
  });
});
