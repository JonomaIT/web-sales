import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { setConfig } from "../app/config";
import { trackedSales } from "../features/sales/tracked";
import { mockApi } from "../mocks/handlers";
import { server, TEST_API_URL } from "../mocks/server";

// jsdom has no layout engine: what Cloudscape asks the browser for, answered with defaults.
window.matchMedia ??= (query: string) =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList;

// The first test of a run loads Cloudscape cold: give async queries more than the 1 s default.
configure({ asyncUtilTimeout: 3_000 });

setConfig({ environment: "test", apiUrl: TEST_API_URL });

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
  mockApi.reset();
  mockApi.latencyMs = 0;
  trackedSales.clear();
});
afterAll(() => server.close());
