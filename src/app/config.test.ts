import { afterEach, describe, expect, it, vi } from "vitest";
import { loadConfig } from "./config";

function serve(body: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify(body), { status: 200 })),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("loadConfig", () => {
  it("keeps the address the deploy wrote, without a trailing slash", async () => {
    serve({ environment: "production", apiUrl: "https://sales.joshuel.com.br/" });
    expect((await loadConfig()).apiUrl).toBe("https://sales.joshuel.com.br");
  });

  it("outside a deploy, {zone} becomes a local name (npm run dev)", async () => {
    serve({ environment: "production", apiUrl: "https://sales.{zone}" });
    expect((await loadConfig()).apiUrl).toBe("https://sales.localhost");
  });

  it("refuses a file without the required fields", async () => {
    serve({ environment: "production" });
    await expect(loadConfig()).rejects.toThrow("environment and apiUrl are required");
  });
});
