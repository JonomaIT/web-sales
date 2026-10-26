import { setupWorker } from "msw/browser";
import { createHandlers, mockApi } from "./handlers";

/** `npm run dev`: answers the API at `apiUrl` from the browser itself (Mock Service Worker). */
export async function startMockApi(apiUrl: string) {
  await setupWorker(...createHandlers(apiUrl)).start({ onUnhandledFrame: "bypass", quiet: true });
  // For demos: `mockFailover()` in the browser console moves the API to the other region, and the
  // site shows the failover notice on its next check.
  Object.assign(window, {
    mockFailover: () => (mockApi.region = mockApi.region === "us-east-1" ? "sa-east-1" : "us-east-1"),
  });
}
