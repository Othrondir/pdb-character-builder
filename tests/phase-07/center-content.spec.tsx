// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { cleanup, render, screen } from '@testing-library/react';

import { CenterContent } from '@planner/components/shell/center-content';
import { usePlannerShellStore } from '@planner/state/planner-shell';

describe('CenterContent routing smoke', () => {
  beforeEach(() => {
    usePlannerShellStore.setState({
      activeOriginStep: null,
      activeLevelSubStep: 'spells',
      characterSheetTab: 'stats',
      datasetId: 'test',
      expandedLevel: 1,
      mobileNavOpen: false,
      validationStatus: 'pending',
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('routes activeLevelSubStep spells to MagicBoard (no placeholder)', () => {
    render(createElement(CenterContent));
    // The old placeholder copy must NOT appear — it was removed by Plan 07-03.
    expect(screen.queryByText(/Los conjuros se habilitaran/i)).toBeNull();
    // MagicBoard renders some Spanish magic copy: an empty-state title, a
    // paradigm step title, or the literal sub-step fallback title. Multiple
    // elements may match (title and body both say 'La magia sigue bloqueada'),
    // so use queryAllByText to assert the page rendered SOMETHING magic-shaped.
    const found = screen.queryAllByText(
      /Magia|conjuros|dominios|grimorio/i,
    );
    expect(found.length).toBeGreaterThan(0);
  });
});
