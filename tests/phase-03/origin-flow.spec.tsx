// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import { PlannerShellFrame } from '@planner/components/shell/planner-shell-frame';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';

describe('phase 03 origin flow', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    useCharacterFoundationStore.getState().resetFoundation();
    usePlannerShellStore.setState({
      activeOriginStep: 'race',
      activeLevelSubStep: null,
      characterSheetTab: 'stats',
      expandedLevel: null,
      mobileNavOpen: false,
    });
  });

  it('renders the ordered origin steps without deity', () => {
    render(createElement(PlannerShellFrame));

    const content = document.body.textContent ?? '';

    expect(content.indexOf('Raza')).toBeLessThan(content.indexOf('Alineamiento'));
    expect(content.indexOf('Alineamiento')).toBeLessThan(
      content.indexOf('Atributos'),
    );
    expect(content).not.toContain('Deidad');
    expect(content).not.toContain('Sin deidad');
  });

  it('keeps Atributos step pending and disabled until the origin is ready', () => {
    render(createElement(PlannerShellFrame));

    const atributosButton = screen.getByRole('button', { name: /^Atributos$/ });
    expect(atributosButton).toHaveClass('is-pending');
    expect(atributosButton).toBeDisabled();
  });
});
