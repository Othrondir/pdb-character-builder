// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { RouterProvider } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { createPlannerRouter } from '@planner/router';

describe('planner shell copy', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('shows Spanish-first navigation labels and summary labels', async () => {
    const router = createPlannerRouter(['/skills']);
    await router.load();

    render(createElement(RouterProvider, { router }));

    for (const label of [
      'Construcción',
      'Habilidades',
      'Conjuros',
      'Atributos',
      'Estadísticas',
      'Resumen',
      'Utilidades',
      'Conjunto de datos',
      'Validación',
    ]) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
  });
});
