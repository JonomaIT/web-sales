import type { Sale } from "./types";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" });
const time = new Intl.DateTimeFormat("pt-BR", { timeStyle: "medium" });

export const formatMoney = (amount: string) => money.format(Number(amount));

export const formatDateTime = (iso?: string) => (iso ? dateTime.format(new Date(iso)) : "—");

export const formatTime = (value: string | number) => time.format(new Date(value));

export const shortId = (id: string) => id.slice(0, 8);

/** Seconds from creation to processing (the API stamps both; whole seconds). */
export function processingSeconds(sale: Sale): number | undefined {
  if (!sale.processed_at) return undefined;
  return Math.max(0, (Date.parse(sale.processed_at) - Date.parse(sale.created_at)) / 1000);
}

export function formatDuration(seconds?: number): string {
  if (seconds === undefined) return "—";
  return `${seconds.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} s`;
}

export function average(values: number[]): number | undefined {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : undefined;
}
