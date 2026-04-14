// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { RouterProvider } from '@tanstack/react-router';
import { act, render, screen } from '@testing-library/react';
import { createPlannerRouter } from '@planner/router';
import { usePlannerShellStore } from '@planner/state/planner-shell';
import { useCharacterFoundationStore } from '@planner/features/character-foundation/store';

describe('phase 03 summary panel', () => {
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

  it('starts in a blocked foundation state', async () => {
    const router = createPlannerRouter(['/']);
    await router.load();

    render(createElement(RouterProvider, { router }));

    expect(screen.getByText('Bloqueada')).toBeInTheDocument();
    expect(screen.getByText('Sin configuración')).toBeInTheDocument();
    expect(
      screen.getByText('puerta-ee-2026-03-30+phase03'),
    ).toBeInTheDocument();
  });

  it('shows origin identity labels once the base choices are defined', async () => {
    const foundationStore = useCharacterFoundationStore.getState();

    foundationStore.setRace('race:elf');
    foundationStore.setSubrace('subrace:moon-elf');
    foundationStore.setAlignment('alignment:neutral-good');
    foundationStore.setDeity('deity:none');

    const router = createPlannerRouter(['/']);
    await router.load();

    render(createElement(RouterProvider, { router }));

    expect(screen.getByText('Válida')).toBeInTheDocument();
    expect(
      screen.getByText('Elfo · Elfo lunar · Neutral bueno · Sin deidad'),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Elfo lunar').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Neutral bueno').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Sin deidad').length).toBeGreaterThan(0);
  });

  it('switches the summary badge to Inválida when the attribute budget is illegal', async () => {
    const foundationStore = useCharacterFoundationStore.getState();

    foundationStore.setRace('race:human');
    foundationStore.setAlignment('alignment:neutral-good');
    foundationStore.setDeity('deity:none');

    const router = createPlannerRouter(['/abilities']);
    await router.load();

    render(createElement(RouterProvider, { router }));

    act(() => {
      foundationStore.setBaseAttribute('str', 18);
      foundationStore.setBaseAttribute('dex', 18);
      foundationStore.setBaseAttribute('con', 18);
      foundationStore.setBaseAttribute('int', 18);
      foundationStore.setBaseAttribute('wis', 18);
      foundationStore.setBaseAttribute('cha', 18);
    });

    expect(screen.getByText('Inválida')).toBeInTheDocument();
    expect(screen.getByText('Base en conflicto')).toBeInTheDocument();
  });
});
