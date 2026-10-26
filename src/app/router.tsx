import type { ComponentType } from "react";
import type { RouteObject } from "react-router";
import { shortId } from "../features/sales/format";
import App, { type RouteHandle } from "./App";
import RouteError from "./RouteError";

// Each page is its own chunk, loaded on first visit.
const page = (load: () => Promise<{ default: ComponentType }>) => async () => ({
  Component: (await load()).default,
});

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <App />,
    errorElement: <RouteError />,
    handle: { crumb: "Simulador de vendas" } satisfies RouteHandle,
    children: [
      { index: true, lazy: page(() => import("../pages/DashboardPage")) },
      {
        path: "vendas",
        handle: { crumb: "Vendas" } satisfies RouteHandle,
        children: [
          { index: true, lazy: page(() => import("../pages/SalesPage")) },
          {
            path: "nova",
            handle: { crumb: "Nova venda" } satisfies RouteHandle,
            lazy: page(() => import("../pages/CreateSalePage")),
          },
          {
            path: ":saleId",
            handle: { crumb: (params) => shortId(params.saleId ?? "") } satisfies RouteHandle,
            lazy: page(() => import("../pages/SaleDetailPage")),
          },
        ],
      },
      { path: "*", lazy: page(() => import("../pages/NotFoundPage")) },
    ],
  },
];
