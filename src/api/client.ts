import { getConfig } from "../app/config";

// The one way the app talks to its API: JSON in and out, a timeout, errors as ApiError with the
// API's own message, and the region that answered (X-Region, ADR-012) next to the data.

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export interface ApiResponse<T> {
  data: T;
  region: string | null;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  timeoutMs?: number;
}

function errorMessage(payload: unknown): string | undefined {
  const error = (payload as { error?: unknown } | undefined)?.error;
  return typeof error === "string" ? error : undefined;
}

function parse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function request<T>(
  path: string,
  { method = "GET", body, timeoutMs = 10_000 }: RequestOptions = {},
): Promise<ApiResponse<T>> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new ApiError(0, "the API did not answer in time")), timeoutMs);
  });

  const call = fetch(`${getConfig().apiUrl}${path}`, {
    method,
    headers:
      body === undefined
        ? { Accept: "application/json" }
        : { Accept: "application/json", "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  try {
    const res = await Promise.race([call, timeout]);
    const text = res.status === 204 ? "" : await res.text();
    const payload = text ? parse(text) : undefined;
    if (!res.ok) throw new ApiError(res.status, errorMessage(payload) ?? `HTTP ${res.status}`);
    return { data: payload as T, region: res.headers.get("X-Region") };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(0, "the API could not be reached");
  } finally {
    clearTimeout(timer);
  }
}
