// @vitest-environment jsdom

/**
 * Phase 15-01 SC#3 — body-scroll-lock + stacking counter.
 *
 * Locks the contract:
 *   - Mount with active=true → document.body.style.overflow === 'hidden'.
 *   - Unmount → restored to prior value (default '').
 *   - Stacking: outer mount + inner mount → both 'hidden';
 *     inner unmount keeps lock; outer unmount releases.
 *
 * No JSX (Vitest default esbuild lacks React runtime auto-inject).
 */

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { createElement, type ReactElement } from 'react';
import { useBodyScrollLock } from '@planner/lib/a11y/use-body-scroll-lock';

function LockHarness({ active }: { active: boolean }): ReactElement {
  useBodyScrollLock(active);
  return createElement('div');
}

describe('Phase 15-01 — useBodyScrollLock', () => {
  afterEach(() => {
    cleanup();
    document.body.style.overflow = '';
  });

  it('locks body overflow while active=true', () => {
    render(createElement(LockHarness, { active: true }));
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body overflow on unmount', () => {
    const view = render(createElement(LockHarness, { active: true }));
    expect(document.body.style.overflow).toBe('hidden');
    view.unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('stacks: inner unmount keeps lock, outer unmount releases', () => {
    const outer = render(createElement(LockHarness, { active: true }));
    const inner = render(createElement(LockHarness, { active: true }));
    expect(document.body.style.overflow).toBe('hidden');
    inner.unmount();
    expect(document.body.style.overflow).toBe('hidden');
    outer.unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('is a no-op when active=false', () => {
    render(createElement(LockHarness, { active: false }));
    expect(document.body.style.overflow).toBe('');
  });
});
