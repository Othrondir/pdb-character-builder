// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { RouterProvider } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { createPlannerRouter } from '@planner/router';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';

describe('phase 03 origin flow', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    useCharacterFoundationStore.getState().resetFoundation();
    usePlannerShellStore.setState({
      activeSection: 'build',
      datasetId: 'dataset:pendiente',
      mobileNavOpen: false,
      summaryPanelOpen: true,
      validationStatus: 'pending',
    });
  });

  it('renders the ordered origin steps and explicit deity option', async () => {
    const router = createPlannerRouter(['/']);
    await router.load();

    render(createElement(RouterProvider, { router }));

    const content = document.body.textContent ?? '';

    expect(content.indexOf('Raza')).toBeLessThan(content.indexOf('Subraza'));
    expect(content.indexOf('Subraza')).toBeLessThan(
      content.indexOf('Alineamiento'),
    );
    expect(content.indexOf('Alineamiento')).toBeLessThan(
      content.indexOf('Deidad'),
    );
    expect(screen.getByText('Sin deidad')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Confirmar origen' }),
    ).toBeInTheDocument();
  });

  it('keeps Atributos blocked until the origin is ready', async () => {
    const router = createPlannerRouter(['/abilities']);
    await router.load();

    render(createElement(RouterProvider, { router }));

    expect(
      screen.getByRole('heading', {
        name: 'El origen del personaje sigue incompleto',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Selecciona raza, subraza, alineamiento y deidad en Construcción para desbloquear Atributos.',
      ),
    ).toBeInTheDocument();
  });
});
