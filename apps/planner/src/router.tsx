import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from '@tanstack/react-router';
import { PlannerShellFrame } from '@planner/components/shell/planner-shell-frame';

const rootRoute = createRootRoute({
  component: PlannerShellFrame,
});

const routeTree = rootRoute;

export function createPlannerRouter(initialEntries?: string[]) {
  return createRouter({
    history: initialEntries
      ? createMemoryHistory({ initialEntries })
      : undefined,
    routeTree,
  });
}

export const router = createPlannerRouter();

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
