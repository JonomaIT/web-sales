import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { Providers } from "../app/providers";
import { createQueryClient } from "../app/queryClient";
import { routes } from "../app/router";

/** The whole app at `path`, with the real router and providers, against the mocked API. */
export function renderApp(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const user = userEvent.setup();
  const view = render(
    <Providers queryClient={createQueryClient({ retry: false })}>
      <RouterProvider router={router} />
    </Providers>,
  );
  return { ...view, user, router };
}
