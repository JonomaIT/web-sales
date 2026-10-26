import { delay, http, HttpResponse } from "msw";
import type { ApiInfo, Sale } from "../features/sales/types";

// svc-sales-api simulated, with the same contract: the site runs and is tested with no backend.
// A sale turns PROCESSED after `processAfterMs`, by the region that is answering at that moment.
// Handlers match only the API address (config apiUrl), never a wildcard: in `npm run dev` the app
// itself is served from paths like /src/features/sales/..., which a "*/sales/:id" would swallow.

export const mockApi = {
  region: "us-east-1",
  processAfterMs: 1_500,
  latencyMs: 150,
  sales: new Map<string, Sale>(),
  reset() {
    this.region = "us-east-1";
    this.processAfterMs = 1_500;
    this.latencyMs = 150;
    this.sales.clear();
  },
};

const headers = () => ({ "X-Region": mockApi.region });
const error = (status: number, message: string) =>
  HttpResponse.json({ error: message }, { status, headers: headers() });

function process(id: string) {
  const sale = mockApi.sales.get(id);
  if (!sale) return;
  mockApi.sales.set(id, {
    ...sale,
    status: "PROCESSED",
    processed_at: new Date().toISOString(),
    processed_region: mockApi.region,
    receipt_key: `sales/${sale.created_at.slice(0, 10).replace(/-/g, "/")}/${id}.json`,
  });
}

export const createHandlers = (apiUrl: string) => [
  http.get(`${apiUrl}/info`, async () => {
    await delay(mockApi.latencyMs);
    return HttpResponse.json<ApiInfo>(
      { service: "svc-sales-api", region: mockApi.region, region_state: "ACTIVE", task: "mock-task" },
      { headers: headers() },
    );
  }),

  http.post(`${apiUrl}/sales`, async ({ request }) => {
    await delay(mockApi.latencyMs);
    const body = (await request.json().catch(() => null)) as { product?: unknown; amount?: unknown } | null;
    const product = typeof body?.product === "string" ? body.product.trim() : "";
    if (!product || product.length > 100) return error(400, "product: text, 1 to 100 characters");
    const amount = body?.amount;
    if (typeof amount !== "number" || !(amount > 0 && amount <= 1_000_000))
      return error(400, "amount: number greater than 0 and at most 1000000");

    const sale: Sale = {
      id: crypto.randomUUID(),
      product,
      amount: amount.toFixed(2),
      status: "PENDING",
      created_at: new Date().toISOString(),
      created_region: mockApi.region,
    };
    mockApi.sales.set(sale.id, sale);
    setTimeout(() => process(sale.id), mockApi.processAfterMs);
    return HttpResponse.json(sale, { status: 201, headers: headers() });
  }),

  http.get(`${apiUrl}/sales/:id`, async ({ params }) => {
    await delay(mockApi.latencyMs);
    const sale = mockApi.sales.get(String(params.id));
    return sale ? HttpResponse.json(sale, { headers: headers() }) : error(404, "sale not found");
  }),

  http.delete(`${apiUrl}/sales/:id`, async ({ params }) => {
    await delay(mockApi.latencyMs);
    return mockApi.sales.delete(String(params.id))
      ? new HttpResponse(null, { status: 204, headers: headers() })
      : error(404, "sale not found");
  }),
];
