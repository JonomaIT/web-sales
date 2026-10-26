// The svc-sales-api contract (JonomaIT/svc-sales-api). Money travels as text ("12.50"), never as
// a float.

export type SaleStatus = "PENDING" | "PROCESSED";

export interface Sale {
  id: string;
  product: string;
  amount: string;
  status: SaleStatus;
  created_at: string;
  created_region: string;
  processed_at?: string;
  processed_region?: string;
  receipt_key?: string;
}

export interface NewSale {
  product: string;
  amount: number;
}

export type RegionState = "ACTIVE" | "PASSIVE" | "UNKNOWN";

export interface ApiInfo {
  service: string;
  region: string;
  region_state: RegionState;
  task: string;
}
