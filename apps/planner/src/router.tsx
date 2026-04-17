import {
  createHashHistory,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router';
import { z } from 'zod';
import { PlannerShellFrame } from '@planner/components/shell/planner-shell-frame';
import { ShareEntry } from '@planner/features/persistence/share-entry';

/**
 * D-05: hash-based routing for GitHub Pages compatibility.
 * Every URL is `#/...`. GitHub Pages serves `index.html` for any path without rewrites.
 *
 * RESEARCH.md deviation from CLAUDE.md: `@tanstack/zod-adapter` is NOT used.
 * Zod 4.3.5 works natively with TanStack Router via `.default(x).catch(x)`.
 * See github.com/TanStack/router/issues/4322 (Aug 2025).
 */

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: PlannerShellFrame,
});

const shareSearchSchema = z.object({
  // Zod 4 native: .default('').catch('') replaces the old `@tanstack/zod-adapter` fallback pattern.
  b: z.string().min(1).max(8192).default('').catch(''),
});

const shareRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/share',
  validateSearch: shareSearchSchema,
  component: ShareEntry,
});

const routeTree = rootRoute.addChildren([homeRoute, shareRoute]);

export function createPlannerRouter(initialEntries?: string[]) {
  return createRouter({
    history: initialEntries
      ? createMemoryHistory({ initialEntries })
      : createHashHistory(),
    routeTree,
  });
}

export const router = createPlannerRouter();

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
