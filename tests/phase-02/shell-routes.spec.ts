// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { RouterProvider } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { createPlannerRouter } from '@planner/router';
import { plannerSections } from '@planner/lib/sections';

describe('planner shell routes', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('exposes all primary planner sections in the section registry', () => {
    expect(plannerSections.map((section) => section.id)).toEqual([
      'build',
      'skills',
      'spells',
      'abilities',
      'stats',
      'summary',
      'utilities',
    ]);

    expect(plannerSections.map((section) => section.path)).toEqual([
      '/',
      '/skills',
      '/spells',
      '/abilities',
      '/stats',
      '/summary',
      '/utilities',
    ]);
  });

  it('renders the shared shell frame and current route content', async () => {
    const router = createPlannerRouter(['/summary']);
    await router.load();

    render(createElement(RouterProvider, { router }));

    expect(
      screen.getByRole('navigation', {
        name: 'Navegación principal del planificador',
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Resumen del personaje'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Resumen' }),
    ).toBeInTheDocument();
  });
});
