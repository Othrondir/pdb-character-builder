// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { RouterProvider } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { createPlannerRouter } from '@planner/router';

describe('planner shell layout', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders desktop landmarks and mobile controls together', async () => {
    const router = createPlannerRouter(['/utilities']);
    await router.load();

    render(createElement(RouterProvider, { router }));

    expect(
      screen.getByRole('button', { name: 'Abrir navegación' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Mostrar u ocultar resumen' }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Resumen del personaje'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Utilidades' }),
    ).toBeInTheDocument();
  });
});
