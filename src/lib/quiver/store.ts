import "server-only";
import { promises as fs } from "fs";
import path from "path";
import type {
  AnalysisRun,
  QuiverRawEvent,
  QuiverStoreData,
  TickerDailyScore,
  TickerSignalScore,
} from "./types";

const STORE_FILE = path.join(process.cwd(), "data", "quiver", "store.json");

let memory: QuiverStoreData | null = null;
let writeChain: Promise<void> = Promise.resolve();

function emptyStore(): QuiverStoreData {
  return {
    version: 1,
    events: [],
    signalScores: [],
    dailyScores: {},
    runs: [],
  };
}

async function readStore(): Promise<QuiverStoreData> {
  if (memory) return memory;
  try {
    await fs.mkdir(path.dirname(STORE_FILE), { recursive: true });
    const raw = await fs.readFile(STORE_FILE, "utf-8");
    memory = JSON.parse(raw) as QuiverStoreData;
    return memory;
  } catch {
    memory = emptyStore();
    return memory;
  }
}

async function persist(store: QuiverStoreData): Promise<void> {
  memory = store;
  store.lastSyncAt = new Date().toISOString();
  writeChain = writeChain.then(async () => {
    await fs.mkdir(path.dirname(STORE_FILE), { recursive: true });
    await fs.writeFile(STORE_FILE, JSON.stringify(store));
  });
  await writeChain;
}

export async function upsertEvents(incoming: QuiverRawEvent[]): Promise<number> {
  const store = await readStore();
  const existing = new Set(store.events.map((e) => e.uniqueHash));
  let added = 0;
  for (const e of incoming) {
    if (existing.has(e.uniqueHash)) continue;
    store.events.push(e);
    existing.add(e.uniqueHash);
    added++;
  }
  if (added) await persist(store);
  return added;
}

export async function getEventsForTicker(ticker: string, limit = 200): Promise<QuiverRawEvent[]> {
  const store = await readStore();
  const sym = ticker.toUpperCase();
  return store.events
    .filter((e) => e.ticker === sym)
    .sort((a, b) => (b.filedDate ?? b.eventDate ?? "").localeCompare(a.filedDate ?? a.eventDate ?? ""))
    .slice(0, limit);
}

export async function getAllEvents(limit?: number): Promise<QuiverRawEvent[]> {
  const store = await readStore();
  if (limit == null || limit <= 0) return store.events;
  return store.events.slice(-limit);
}

/** All congress-related events from the full store (not tail-limited). */
export async function getAllCongressEvents(): Promise<QuiverRawEvent[]> {
  const store = await readStore();
  return store.events.filter(
    (e) =>
      e.sourceDataset === "congress_trades" ||
      e.sourceDataset === "senate_trades" ||
      e.sourceDataset === "house_trades"
  );
}

export async function getCongressEvents(windowDays: number): Promise<QuiverRawEvent[]> {
  const store = await readStore();
  const cutoff = Date.now() - windowDays * 86_400_000;
  return store.events.filter((e) => {
    const isCongress =
      e.sourceDataset === "congress_trades" ||
      e.sourceDataset === "senate_trades" ||
      e.sourceDataset === "house_trades";
    if (!isCongress) return false;
    const d = new Date(e.filedDate ?? e.eventDate ?? 0).getTime();
    return d >= cutoff;
  });
}

export async function saveDailyScore(score: TickerDailyScore): Promise<void> {
  const store = await readStore();
  store.dailyScores[score.ticker] = score;
  await persist(store);
}

export async function saveDailyScores(scores: TickerDailyScore[]): Promise<void> {
  const store = await readStore();
  for (const s of scores) store.dailyScores[s.ticker] = s;
  await persist(store);
}

export async function getDailyScore(ticker: string): Promise<TickerDailyScore | null> {
  const store = await readStore();
  return store.dailyScores[ticker.toUpperCase()] ?? null;
}

export async function getAllDailyScores(): Promise<TickerDailyScore[]> {
  const store = await readStore();
  return Object.values(store.dailyScores);
}

export async function saveSignalScores(scores: TickerSignalScore[]): Promise<void> {
  const store = await readStore();
  store.signalScores = scores;
  await persist(store);
}

export async function getSignalScoresForTicker(ticker: string): Promise<TickerSignalScore[]> {
  const store = await readStore();
  return store.signalScores.filter((s) => s.ticker === ticker.toUpperCase());
}

export async function startRun(notes?: string): Promise<AnalysisRun> {
  const store = await readStore();
  const run: AnalysisRun = {
    id: `run-${Date.now()}`,
    startedAt: new Date().toISOString(),
    status: "running",
    datasetsProcessed: [],
    tickersProcessed: [],
    errors: [],
    notes,
  };
  store.runs.unshift(run);
  await persist(store);
  return run;
}

export async function finishRun(
  runId: string,
  patch: Partial<AnalysisRun>
): Promise<AnalysisRun | null> {
  const store = await readStore();
  const run = store.runs.find((r) => r.id === runId);
  if (!run) return null;
  Object.assign(run, patch, { finishedAt: new Date().toISOString() });
  await persist(store);
  return run;
}

export async function getLastRun(): Promise<AnalysisRun | null> {
  const store = await readStore();
  return store.runs[0] ?? null;
}

export async function getUniqueTickers(): Promise<string[]> {
  const store = await readStore();
  return [...new Set(store.events.map((e) => e.ticker))].sort();
}

export async function getStoreMeta(): Promise<{ eventCount: number; tickerCount: number; lastSyncAt?: string }> {
  const store = await readStore();
  return {
    eventCount: store.events.length,
    tickerCount: new Set(store.events.map((e) => e.ticker)).size,
    lastSyncAt: store.lastSyncAt,
  };
}
