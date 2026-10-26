import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "../api/client";

export function createQueryClient({ retry = true } = {}) {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5_000,
        // A 4xx will not change by asking again; network errors and 5xx get two more tries.
        retry: (failures, err) =>
          retry && failures < 2 && !(err instanceof ApiError && err.status >= 400 && err.status < 500),
      },
      mutations: { retry: false },
    },
  });
}
