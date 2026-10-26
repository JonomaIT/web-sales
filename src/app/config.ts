// Runtime configuration, read from /config.json before the app renders. The same build runs in
// every environment (build once, deploy many): the deploy writes each environment's file, the
// bundle never carries an environment's address.

export interface AppConfig {
  environment: string;
  apiUrl: string;
}

let current: AppConfig | undefined;

function isConfig(value: unknown): value is AppConfig {
  const config = value as Partial<AppConfig> | null;
  return typeof config?.environment === "string" && typeof config.apiUrl === "string";
}

export async function loadConfig(url = "/config.json"): Promise<AppConfig> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const data: unknown = await res.json();
  if (!isConfig(data)) throw new Error(`${url}: environment and apiUrl are required`);
  current = { ...data, apiUrl: data.apiUrl.replace(/\/+$/, "") };
  return current;
}

export function setConfig(config: AppConfig): void {
  current = config;
}

export function getConfig(): AppConfig {
  if (!current) throw new Error("config not loaded: call loadConfig() first");
  return current;
}
