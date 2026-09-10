import type { ReactElement } from "react";
import { act, render } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";

export async function renderWithRouter(ui: ReactElement) {
  const root = createRootRoute();
  const index = createRoute({
    getParentRoute: () => root,
    path: "/",
    component: () => ui,
  });
  const detail = createRoute({
    getParentRoute: () => root,
    path: "/personas/$personaId",
    component: () => <div>Persona details</div>,
  });
  const router = createRouter({
    routeTree: root.addChildren([index, detail]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });

  await act(async () => {
    render(<RouterProvider router={router} />);
    await router.load();
  });
  return router;
}
