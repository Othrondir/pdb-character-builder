// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { cleanup, render, screen } from '@testing-library/react';

import { MagicBoard } from '@planner/features/magic/magic-board';
import {
  createInitialMagicState,
  useMagicStore,
} from '@planner/features/magic/store';

describe('MagicBoard smoke', () => {
  beforeEach(() => {
    useMagicStore.setState(createInitialMagicState());
  });

  afterEach(() => {
    cleanup();
  });

  it('renders without throwing when progression is empty (empty state)', () => {
    render(createElement(MagicBoard));
    // Either the empty-state detail panel renders (title + body both say
    // 'La magia sigue bloqueada'), or a paradigm-dispatched step title
    // renders. `queryAllByText` avoids the multi-match exception so either
    // acceptable shape passes.
    const emptyStateMatches = screen.queryAllByText(
      /La magia sigue bloqueada/i,
    );
    const stepTitleMatches = screen.queryAllByText(
      /Selecciona|Amplía|Magia preparada|Este nivel/i,
    );
    expect(emptyStateMatches.length + stepTitleMatches.length).toBeGreaterThan(
      0,
    );
  });

  it('renders Spanish copy, never English fallback strings', () => {
    render(createElement(MagicBoard));
    // Fail if any residual English placeholder leaked through.
    expect(screen.queryByText(/placeholder/i)).toBeNull();
    expect(screen.queryByText(/coming soon/i)).toBeNull();
  });
});
