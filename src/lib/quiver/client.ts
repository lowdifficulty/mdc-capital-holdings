import "server-only";

import { createHash } from "crypto";
import type { QuiverDataset } from "./types";
import { getQuiverApiKey } from "./env";

export { getQuiverApiKey } from "./env";

const BASE = "https://api.quiverquant.com/beta";
const UA = "MDC-Capital-Analysis/1.0";

export interface DatasetEndpoint {
  dataset: QuiverDataset;
  path: string;
  bulk?: boolean;
  params?: Record<string, string>;
}

/** Live/bulk endpoints for ingestion (per Quiver Python SDK). */
export const DATASET_ENDPOINTS: DatasetEndpoint[] = [
  { dataset: "congress_trades", path: "/live/congresstrading", bulk: true },
  { dataset: "senate_trades", path: "/live/senatetrading" },
  { dataset: "house_trades", path: "/live/housetrading" },
  { dataset: "insider_trades", path: "/live/insiders" },
  { dataset: "hedge_fund_activity", path: "/live/sec13fchanges" },
  { dataset: "government_contracts", path: "/live/govcontractsall" },
  { dataset: "corporate_lobbying", path: "/live/lobbying" },
  { dataset: "corporate_donors", path: "/bulk/corporatedonors", bulk: true },
  { dataset: "patents", path: "/live/allpatents" },
  { dataset: "off_exchange_short_volume", path: "/live/offexchange" },
  { dataset: "newsfeed", path: "/live/quivernews", params: { page_size: "100" } },
  { dataset: "social", path: "/live/wallstreetbets", params: { count_all: "true" } },
];

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

let lastRequestAt = 0;
const MIN_INTERVAL_MS = 250;

async function throttle(): Promise<void> {
  const elapsed = Date.now() - lastRequestAt;
  if (elapsed < MIN_INTERVAL_MS) await sleep(MIN_INTERVAL_MS - elapsed);
  lastRequestAt = Date.now();
}

export function stableHash(parts: string[]): string {
  return createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 32);
}

export async function fetchQuiverDataset(
  endpoint: DatasetEndpoint,
  extraParams?: Record<string, string>
): Promise<unknown> {
  const key = getQuiverApiKey();
  if (!key) throw new Error("QUIVER_API_KEY not configured");

  const url = new URL(`${BASE}${endpoint.path}`);
  const params = { ...endpoint.params, ...extraParams };
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
  }

  const headers: HeadersInit = {
    accept: "application/json",
    Authorization: `Token ${key}`,
    "User-Agent": UA,
  };

  let attempt = 0;
  const maxAttempts = 4;

  while (attempt < maxAttempts) {
    attempt++;
    await throttle();
    try {
      const res = await fetch(url.toString(), { headers, next: { revalidate: 0 } });
      const text = await res.text();

      if (res.status === 429) {
        await sleep(1000 * 2 ** attempt);
        continue;
      }
      if (!res.ok) {
        if (text.includes("Upgrade your subscription")) {
          console.warn(`[quiver] tier blocked: ${endpoint.dataset}`);
          return null;
        }
        throw new Error(`Quiver ${endpoint.dataset} HTTP ${res.status}`);
      }
      if (text.includes("Upgrade your subscription")) return null;

      return JSON.parse(text) as unknown;
    } catch (err) {
      if (attempt >= maxAttempts) throw err;
      await sleep(500 * 2 ** attempt);
    }
  }
  return null;
}

export async function fetchQuiverTickerDataset(
  dataset: QuiverDataset,
  ticker: string
): Promise<unknown> {
  const key = getQuiverApiKey();
  if (!key) return null;

  const paths: Partial<Record<QuiverDataset, string>> = {
    congress_trades: `/historical/congresstrading/${ticker}`,
    senate_trades: `/historical/senatetrading/${ticker}`,
    house_trades: `/historical/housetrading/${ticker}`,
    insider_trades: "/live/insiders",
    hedge_fund_activity: "/live/sec13fchanges",
    government_contracts: `/historical/govcontractsall/${ticker}`,
    corporate_lobbying: `/historical/lobbying/${ticker}`,
    patents: `/historical/allpatents/${ticker}`,
    off_exchange_short_volume: `/historical/offexchange/${ticker}`,
    newsfeed: "/live/quivernews",
    social: `/historical/wallstreetbets/${ticker}`,
  };

  const path = paths[dataset];
  if (!path) return null;

  const endpoint: DatasetEndpoint = {
    dataset,
    path,
    params:
      dataset === "insider_trades" || dataset === "hedge_fund_activity"
        ? { ticker }
        : dataset === "newsfeed"
          ? { ticker, page_size: "50" }
          : undefined,
  };

  return fetchQuiverDataset(endpoint);
}

export function extractRows(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as Record<string, unknown>[];
    if (Array.isArray(obj.ownership)) return obj.ownership as Record<string, unknown>[];
  }
  return [];
}
