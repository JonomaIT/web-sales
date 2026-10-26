import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "../../api/client";
import { salesApi } from "./api";
import { trackedSales, useTrackedSaleIds } from "./tracked";
import type { NewSale, Sale } from "./types";

// Server state lives in TanStack Query: cache, polling, retries and loading states come from it,
// not from hand-written useEffect code.

/** A sale still PENDING after this is shown as stuck: nobody is processing (ADR-012 game day). */
export const STUCK_AFTER_MS = 90_000;
const INFO_EVERY_MS = 15_000;

export const saleKey = (id: string) => ["sales", id] as const;
export const infoKey = ["info"] as const;

export function isStuck(sale: Sale, now = Date.now()): boolean {
  return sale.status === "PENDING" && now - Date.parse(sale.created_at) > STUCK_AFTER_MS;
}

/** Poll every second while PENDING, slower once it looks stuck, never after it is processed. */
export function pollInterval(sale: Sale | undefined): number | false {
  if (sale?.status !== "PENDING") return false;
  return isStuck(sale) ? 5_000 : 1_000;
}

async function fetchSale(id: string): Promise<Sale> {
  try {
    return (await salesApi.get(id)).data;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) trackedSales.remove([id]); // deleted elsewhere
    throw err;
  }
}

export function useSale(id: string) {
  return useQuery({
    queryKey: saleKey(id),
    queryFn: () => fetchSale(id),
    refetchInterval: (query) => pollInterval(query.state.data),
  });
}

export function useTrackedSales() {
  const ids = useTrackedSaleIds();
  return useQueries({
    queries: ids.map((id) => ({
      queryKey: saleKey(id),
      queryFn: () => fetchSale(id),
      refetchInterval: (query: { state: { data?: Sale } }) => pollInterval(query.state.data),
    })),
    combine: (results) => ({
      sales: results.flatMap((result) => (result.data ? [result.data] : [])),
      loading: results.some((result) => result.isPending),
      failed: results.filter((result) => result.isError).length,
    }),
  });
}

export function useApiInfo() {
  return useQuery({
    queryKey: infoKey,
    queryFn: async () => {
      const { data } = await salesApi.info();
      return { ...data, checkedAt: Date.now() };
    },
    refetchInterval: INFO_EVERY_MS,
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sale: NewSale) => salesApi.create(sale),
    onSuccess: ({ data }) => {
      queryClient.setQueryData(saleKey(data.id), data);
      trackedSales.add(data.id);
    },
  });
}

export function useDeleteSales() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.allSettled(ids.map((id) => salesApi.remove(id)));
      const failed = results.filter(
        (result) =>
          result.status === "rejected" &&
          !(result.reason instanceof ApiError && result.reason.status === 404),
      );
      if (failed.length) throw new ApiError(0, `${failed.length} de ${ids.length} vendas não foram apagadas`);
      return ids;
    },
    onSettled: (_, __, ids) => {
      trackedSales.remove(ids);
      ids.forEach((id) => queryClient.removeQueries({ queryKey: saleKey(id) }));
    },
  });
}
