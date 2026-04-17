// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { cleanup, render, screen } from '@testing-library/react';

import { MagicSheetTab } from '@planner/features/magic/magic-sheet-tab';
import {
  createInitialMagicState,
  useMagicStore,
} from '@planner/features/magic/store';

describe('MagicSheetTab smoke', () => {
  beforeEach(() => {
    useMagicStore.setState(createInitialMagicState());
  });

  afterEach(() => {
    cleanup();
  });

  it('renders a role tabpanel with id sheet-panel-spells', () => {
    render(createElement(MagicSheetTab));
    const panel = screen.getByRole('tabpanel');
    expect(panel).not.toBeNull();
    expect(panel.getAttribute('id')).toBe('sheet-panel-spells');
    expect(panel.getAttribute('aria-labelledby')).toBe('sheet-tab-spells');
  });

  it('shows empty-state copy when no magic selections exist', () => {
    render(createElement(MagicSheetTab));
    // Header renders '0 conjuros' when the build has no selections.
    expect(screen.queryByText(/0 conjuros/i)).not.toBeNull();
  });
});
