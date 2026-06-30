/** Client-side Quiver sync — survives tab switches and dashboard navigation. */

const STORAGE_KEY = "mdc-quiver-sync";

type SyncListener = (syncing: boolean) => void;
type CompleteListener = () => void;

let syncing = false;
let lastError: string | null = null;
let inFlight: Promise<void> | null = null;
const syncListeners = new Set<SyncListener>();
const completeListeners = new Set<CompleteListener>();

function notifySync() {
  for (const fn of syncListeners) fn(syncing);
}

function notifyComplete() {
  for (const fn of completeListeners) fn();
}

export function isQuiverSyncing(): boolean {
  return syncing;
}

export function getQuiverSyncError(): string | null {
  return lastError;
}

export function subscribeQuiverSync(listener: SyncListener): () => void {
  syncListeners.add(listener);
  listener(syncing);
  return () => syncListeners.delete(listener);
}

export function subscribeQuiverSyncComplete(listener: CompleteListener): () => void {
  completeListeners.add(listener);
  return () => completeListeners.delete(listener);
}

async function fetchRunStatus(): Promise<{ lastRun?: { status: string } } | null> {
  try {
    const res = await fetch("/api/analysis/run-status", { credentials: "same-origin" });
    if (!res.ok) return null;
    return (await res.json()) as { lastRun?: { status: string } };
  } catch {
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function pollUntilServerIdle(): Promise<void> {
  for (let i = 0; i < 120; i++) {
    const status = await fetchRunStatus();
    if (status?.lastRun?.status !== "running") return;
    await sleep(2500);
  }
}

function markSyncing(active: boolean) {
  syncing = active;
  if (active) {
    sessionStorage.setItem(STORAGE_KEY, String(Date.now()));
  } else {
    sessionStorage.removeItem(STORAGE_KEY);
  }
  notifySync();
}

async function runSyncRequest(): Promise<void> {
  const res = await fetch("/api/analysis/run", {
    method: "POST",
    credentials: "same-origin",
  });
  const data = (await res.json()) as { error?: string };
  if (!res.ok) throw new Error(data.error ?? "Sync failed");
}

/** Start sync or return the in-flight promise if one is already running. */
export function startQuiverSync(): Promise<void> {
  if (inFlight) return inFlight;

  lastError = null;
  markSyncing(true);

  inFlight = (async () => {
    try {
      await runSyncRequest();
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Sync failed";
      throw err;
    } finally {
      markSyncing(false);
      inFlight = null;
      notifyComplete();
    }
  })();

  return inFlight;
}

/** Re-attach after navigation if a server run is still active. */
export async function resumeQuiverSyncIfNeeded(): Promise<void> {
  if (inFlight) return inFlight;

  const status = await fetchRunStatus();
  const serverRunning = status?.lastRun?.status === "running";
  const clientPending = sessionStorage.getItem(STORAGE_KEY) != null;

  if (!serverRunning && !clientPending) return;

  if (!serverRunning && clientPending) {
    sessionStorage.removeItem(STORAGE_KEY);
    notifyComplete();
    return;
  }

  markSyncing(true);
  inFlight = (async () => {
    try {
      await pollUntilServerIdle();
    } finally {
      markSyncing(false);
      inFlight = null;
      notifyComplete();
    }
  })();

  return inFlight;
}
