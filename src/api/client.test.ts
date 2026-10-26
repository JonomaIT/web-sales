import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server, TEST_API_URL } from "../mocks/server";
import { ApiError, request } from "./client";

describe("request", () => {
  it("returns the data and the region that answered", async () => {
    const { data, region } = await request<{ region: string }>("/info");
    expect(data.region).toBe("us-east-1");
    expect(region).toBe("us-east-1");
  });

  it("turns an API error into ApiError with the API's message", async () => {
    await expect(request("/sales", { method: "POST", body: { product: "", amount: 1 } })).rejects.toEqual(
      new ApiError(400, "product: text, 1 to 100 characters"),
    );
  });

  it("reports a network failure without leaking the raw error", async () => {
    server.use(http.get(`${TEST_API_URL}/info`, () => HttpResponse.error()));
    await expect(request("/info")).rejects.toMatchObject({
      status: 0,
      message: "the API could not be reached",
    });
  });

  it("gives up after the timeout", async () => {
    server.use(http.get(`${TEST_API_URL}/info`, () => new Promise<never>(() => {})));
    await expect(request("/info", { timeoutMs: 20 })).rejects.toMatchObject({ status: 0 });
  });
});
