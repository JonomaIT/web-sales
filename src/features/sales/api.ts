import { request } from "../../api/client";
import type { ApiInfo, NewSale, Sale } from "./types";

export const salesApi = {
  create: (sale: NewSale) => request<Sale>("/sales", { method: "POST", body: sale }),
  get: (id: string) => request<Sale>(`/sales/${encodeURIComponent(id)}`),
  remove: (id: string) => request<void>(`/sales/${encodeURIComponent(id)}`, { method: "DELETE" }),
  info: () => request<ApiInfo>("/info"),
};
