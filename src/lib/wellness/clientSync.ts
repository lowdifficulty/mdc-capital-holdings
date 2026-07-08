"use client";

import { mergeWellnessData } from "@/lib/wellness/merge";
import { registerWellnessSyncScheduler } from "@/lib/wellness/syncNotify";
import {
  emptyWellnessData,
  WELLNESS_LOCAL_KEYS,
  WELLNESS_META_KEY,
  type WellnessData,
  type WellnessSyncMeta,
} from "@/lib/wellness/types";

export const WELLNESS_SYNC_EVENT = "mdc-wellness-sync";

type SyncState = "idle" | "hydrating" | "pushing" | "error";

let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pushInFlight: Promise<void> | null = null;
let hydrateInFlight: Promise<boolean> | null = null;
let syncState: SyncState = "idle";
let syncError: string | null = null;
let schedulerRegistered = false;
let lifecycleRegistered = false;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function readMeta(): WellnessSyncMeta {
  return readJson<WellnessSyncMeta>(WELLNESS_META_KEY, {
    updatedAt: new Date(0).toISOString(),
    lastSyncedAt: null,
  });
}

function writeMeta(meta: WellnessSyncMeta): void {
  writeJson(WELLNESS_META_KEY, meta);
}

export function collectWellnessFromLocalStorage(): WellnessData {
  const meta = readMeta();
  return {
    peptideCheckoffs: readJson<string[]>(WELLNESS_LOCAL_KEYS.peptideCheckoffs, []),
    workoutCheckoffs: readJson<string[]>(WELLNESS_LOCAL_KEYS.workoutCheckoffs, []),
    cardioCheckoffs: readJson<string[]>(WELLNESS_LOCAL_KEYS.cardioCheckoffs, []),
    mealCheckoffs: readJson<string[]>(WELLNESS_LOCAL_KEYS.mealCheckoffs, []),
    custodyPickupCheckoffs: readJson<string[]>(WELLNESS_LOCAL_KEYS.custodyPickupCheckoffs, []),
    dayJournals: readJson(WELLNESS_LOCAL_KEYS.dayJournals, {}),
    daySectionOrder: readJson(WELLNESS_LOCAL_KEYS.daySectionOrder, emptyWellnessData().daySectionOrder),
    dayExerciseOrder: readJson(WELLNESS_LOCAL_KEYS.dayExerciseOrder, {}),
    workoutExerciseLogs: readJson(WELLNESS_LOCAL_KEYS.workoutExerciseLogs, {}),
    dailyBodyMetrics: readJson(WELLNESS_LOCAL_KEYS.dailyBodyMetrics, {}),
    updatedAt: meta.updatedAt,
  };
}

export function applyWellnessToLocalStorage(data: WellnessData): void {
  writeJson(WELLNESS_LOCAL_KEYS.peptideCheckoffs, data.peptideCheckoffs);
  writeJson(WELLNESS_LOCAL_KEYS.workoutCheckoffs, data.workoutCheckoffs);
  writeJson(WELLNESS_LOCAL_KEYS.cardioCheckoffs, data.cardioCheckoffs);
  writeJson(WELLNESS_LOCAL_KEYS.mealCheckoffs, data.mealCheckoffs);
  writeJson(WELLNESS_LOCAL_KEYS.custodyPickupCheckoffs, data.custodyPickupCheckoffs ?? []);
  writeJson(WELLNESS_LOCAL_KEYS.dayJournals, data.dayJournals);
  writeJson(WELLNESS_LOCAL_KEYS.daySectionOrder, data.daySectionOrder);
  writeJson(WELLNESS_LOCAL_KEYS.dayExerciseOrder, data.dayExerciseOrder);
  writeJson(WELLNESS_LOCAL_KEYS.workoutExerciseLogs, data.workoutExerciseLogs);
  writeJson(WELLNESS_LOCAL_KEYS.dailyBodyMetrics, data.dailyBodyMetrics);
  writeMeta({
    updatedAt: data.updatedAt,
    lastSyncedAt: readMeta().lastSyncedAt,
  });
}

function emitWellnessSync(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(WELLNESS_SYNC_EVENT));
}

function touchLocalUpdatedAt(): void {
  const meta = readMeta();
  const updatedAt = new Date().toISOString();
  writeMeta({ ...meta, updatedAt });
}

function buildPushPayload(): WellnessData {
  const local = collectWellnessFromLocalStorage();
  return {
    ...local,
    updatedAt: new Date().toISOString(),
  };
}

async function pushWellnessToServer(): Promise<void> {
  if (typeof window === "undefined") return;
  if (pushInFlight) return pushInFlight;

  pushInFlight = (async () => {
    syncState = "pushing";
    syncError = null;
    try {
      const payload = buildPushPayload();
      const res = await fetch("/api/wellness", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: payload }),
      });
      if (res.status === 401) return;
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to sync wellness data");
      }
      const body = (await res.json()) as { data: WellnessData };
      applyWellnessToLocalStorage(body.data);
      writeMeta({
        updatedAt: body.data.updatedAt,
        lastSyncedAt: new Date().toISOString(),
      });
      syncState = "idle";
      emitWellnessSync();
    } catch (err) {
      syncState = "error";
      syncError = err instanceof Error ? err.message : "Sync failed";
    } finally {
      pushInFlight = null;
    }
  })();

  return pushInFlight;
}

export function flushWellnessPush(): void {
  if (typeof window === "undefined") return;
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  void pushWellnessToServer();
}

export function scheduleWellnessPush(): void {
  if (typeof window === "undefined") return;
  touchLocalUpdatedAt();
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    void pushWellnessToServer();
  }, 500);
}

function pushWellnessKeepalive(): void {
  if (typeof window === "undefined") return;
  const payload = buildPushPayload();
  void fetch("/api/wellness", {
    method: "PUT",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
    keepalive: true,
  });
}

function registerWellnessLifecycleHandlers(): void {
  if (lifecycleRegistered || typeof window === "undefined") return;
  lifecycleRegistered = true;

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushWellnessPush();
      return;
    }
    if (document.visibilityState === "visible") {
      void hydrateWellnessFromServer();
    }
  });

  window.addEventListener("pagehide", () => {
    pushWellnessKeepalive();
  });
}

export async function hydrateWellnessFromServer(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (hydrateInFlight) return hydrateInFlight;

  hydrateInFlight = (async () => {
    syncState = "hydrating";
    syncError = null;
    try {
      const res = await fetch("/api/wellness", { credentials: "same-origin" });
      if (res.status === 401) return false;
      if (!res.ok) {
        throw new Error("Failed to load wellness data");
      }

      const body = (await res.json()) as { data: WellnessData };
      const server = body.data ?? emptyWellnessData(new Date(0).toISOString());
      const local = collectWellnessFromLocalStorage();
      const merged = mergeWellnessData(server, local);
      const mergedUpdatedAt = new Date().toISOString();
      const next: WellnessData = { ...merged, updatedAt: mergedUpdatedAt };

      applyWellnessToLocalStorage(next);
      writeMeta({
        updatedAt: mergedUpdatedAt,
        lastSyncedAt: new Date().toISOString(),
      });
      emitWellnessSync();

      const resPush = await fetch("/api/wellness", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: next }),
      });
      if (resPush.ok) {
        const pushed = (await resPush.json()) as { data: WellnessData };
        applyWellnessToLocalStorage(pushed.data);
        writeMeta({
          updatedAt: pushed.data.updatedAt,
          lastSyncedAt: new Date().toISOString(),
        });
        emitWellnessSync();
      }

      syncState = "idle";
      return true;
    } catch (err) {
      syncState = "error";
      syncError = err instanceof Error ? err.message : "Sync failed";
      return false;
    } finally {
      hydrateInFlight = null;
    }
  })();

  return hydrateInFlight;
}

export function initWellnessClientSync(): void {
  if (schedulerRegistered || typeof window === "undefined") return;
  registerWellnessSyncScheduler(scheduleWellnessPush, flushWellnessPush);
  registerWellnessLifecycleHandlers();
  schedulerRegistered = true;
}

export function getWellnessSyncState(): { state: SyncState; error: string | null } {
  return { state: syncState, error: syncError };
}

export function subscribeWellnessSync(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => listener();
  window.addEventListener(WELLNESS_SYNC_EVENT, handler);
  return () => window.removeEventListener(WELLNESS_SYNC_EVENT, handler);
}
