import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { PlannerShellFrame } from '@planner/components/shell/planner-shell-frame';
import { AbilitiesRouteView } from '@planner/routes/abilities';
import { BuildRouteView } from '@planner/routes/root';
import { SkillsRouteView } from '@planner/routes/skills';
import { SpellsRouteView } from '@planner/routes/spells';
import { StatsRouteView } from '@planner/routes/stats';
import { SummaryRouteView } from '@planner/routes/summary';
import { UtilitiesRouteView } from '@planner/routes/utilities';

const rootRoute = createRootRoute({
  component: PlannerShellFrame,
});

const buildRoute = createRoute({
  component: BuildRouteView,
  getParentRoute: () => rootRoute,
  path: '/',
});

const skillsRoute = createRoute({
  component: SkillsRouteView,
  getParentRoute: () => rootRoute,
  path: 'skills',
});

const spellsRoute = createRoute({
  component: SpellsRouteView,
  getParentRoute: () => rootRoute,
  path: 'spells',
});

const abilitiesRoute = createRoute({
  component: AbilitiesRouteView,
  getParentRoute: () => rootRoute,
  path: 'abilities',
});

const statsRoute = createRoute({
  component: StatsRouteView,
  getParentRoute: () => rootRoute,
  path: 'stats',
});

const summaryRoute = createRoute({
  component: SummaryRouteView,
  getParentRoute: () => rootRoute,
  path: 'summary',
});

const utilitiesRoute = createRoute({
  component: UtilitiesRouteView,
  getParentRoute: () => rootRoute,
  path: 'utilities',
});

const routeTree = rootRoute.addChildren([
  buildRoute,
  skillsRoute,
  spellsRoute,
  abilitiesRoute,
  statsRoute,
  summaryRoute,
  utilitiesRoute,
]);

export function createPlannerRouter(initialEntries?: string[]) {
  return createRouter({
    defaultPreload: 'intent',
    history: initialEntries
      ? createMemoryHistory({ initialEntries })
      : undefined,
    routeTree,
    scrollRestoration: true,
  });
}

export const router = createPlannerRouter();

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
