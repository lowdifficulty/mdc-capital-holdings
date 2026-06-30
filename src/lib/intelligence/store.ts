import { promises as fs } from "fs";
import path from "path";
import type { IntelligenceSettings, Recommendation } from "./types";
import { DEFAULT_SETTINGS } from "./types";

const DATA_DIR = path.join(process.cwd(), "data", "intelligence");

interface StoreData {
  watchlist: string[];
  recommendationHistory: Array<{ symbol: string; analyzedAt: string; signal: string; confidence: number }>;
  settings: IntelligenceSettings;
}

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readStore(): Promise<StoreData> {
  await ensureDir();
  const file = path.join(DATA_DIR, "store.json");
  try {
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw) as StoreData;
  } catch {
    return { watchlist: [], recommendationHistory: [], settings: DEFAULT_SETTINGS };
  }
}

async function writeStore(data: StoreData) {
  await ensureDir();
  await fs.writeFile(path.join(DATA_DIR, "store.json"), JSON.stringify(data, null, 2));
}

export async function getWatchlist(): Promise<string[]> {
  const store = await readStore();
  return store.watchlist;
}

export async function addToWatchlist(symbol: string): Promise<string[]> {
  const store = await readStore();
  const sym = symbol.toUpperCase();
  if (!store.watchlist.includes(sym)) store.watchlist.push(sym);
  await writeStore(store);
  return store.watchlist;
}

export async function removeFromWatchlist(symbol: string): Promise<string[]> {
  const store = await readStore();
  store.watchlist = store.watchlist.filter((s) => s !== symbol.toUpperCase());
  await writeStore(store);
  return store.watchlist;
}

export async function getSettings(): Promise<IntelligenceSettings> {
  const store = await readStore();
  return store.settings;
}

export async function saveSettings(settings: IntelligenceSettings): Promise<IntelligenceSettings> {
  const store = await readStore();
  store.settings = settings;
  await writeStore(store);
  return settings;
}

export async function recordRecommendation(rec: Recommendation) {
  const store = await readStore();
  store.recommendationHistory.unshift({
    symbol: rec.symbol,
    analyzedAt: rec.analyzedAt,
    signal: rec.signal,
    confidence: rec.confidence,
  });
  store.recommendationHistory = store.recommendationHistory.slice(0, 500);
  await writeStore(store);
}

export async function getRecommendationHistory(symbol?: string) {
  const store = await readStore();
  if (!symbol) return store.recommendationHistory;
  return store.recommendationHistory.filter((r) => r.symbol === symbol.toUpperCase());
}
