import { useSyncExternalStore } from "react";

// The sales this browser created. The API has no "list sales" (that would need a table Scan, which
// the data-access policy does not grant, ADR-011): the site remembers the IDs it created and asks
// for each one.

const KEY = "web-sales:tracked";
const MAX = 50;

type Listener = () => void;
const listeners = new Set<Listener>();

function read(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

let ids = read();

function write(next: string[]) {
  ids = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage blocked: kept for this page only
  }
  listeners.forEach((listener) => listener());
}

export const trackedSales = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  snapshot: () => ids,
  add: (id: string) => write([id, ...ids.filter((other) => other !== id)].slice(0, MAX)),
  remove: (gone: string[]) => write(ids.filter((id) => !gone.includes(id))),
  clear: () => write([]),
};

export function useTrackedSaleIds(): string[] {
  return useSyncExternalStore(trackedSales.subscribe, trackedSales.snapshot);
}
