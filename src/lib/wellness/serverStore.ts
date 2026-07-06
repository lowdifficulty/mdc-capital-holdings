import "server-only";

import { mergeWellnessData } from "@/lib/wellness/merge";
import { emptyWellnessData, type WellnessData } from "@/lib/wellness/types";
import {
  ensureWellnessBlob,
  isWellnessBlobEnabled,
  readWellnessBlob,
  writeWellnessBlob,
} from "@/lib/wellness/blobStore";
import {
  ensureWellnessDb,
  isWellnessDatabaseEnabled,
  readWellnessDb,
  writeWellnessDb,
} from "@/lib/wellness/dbStore";
import {
  ensureWellnessFile,
  readWellnessFile,
  wellnessUserKey,
  writeWellnessFile,
} from "@/lib/wellness/fileStore";

export type WellnessStorageMode = "database" | "blob" | "file";

function pickNewest(...candidates: (WellnessData | null)[]): WellnessData | null {
  const present = candidates.filter((c): c is WellnessData => c !== null);
  if (present.length === 0) return null;
  return present.reduce((best, curr) =>
    curr.updatedAt >= best.updatedAt ? curr : best
  );
}

async function readStoredWellness(userKey: string): Promise<WellnessData | null> {
  const [fromDb, fromBlob, fromFile] = await Promise.all([
    isWellnessDatabaseEnabled() ? readWellnessDb(userKey) : Promise.resolve(null),
    isWellnessBlobEnabled() ? readWellnessBlob(userKey) : Promise.resolve(null),
    readWellnessFile(userKey),
  ]);
  return pickNewest(fromDb, fromBlob, fromFile);
}

function hasDurableWellnessStorage(): boolean {
  return isWellnessDatabaseEnabled() || isWellnessBlobEnabled();
}

async function writeStoredWellness(userKey: string, data: WellnessData): Promise<void> {
  if (isWellnessDatabaseEnabled()) {
    await writeWellnessDb(userKey, data);
    return;
  }
  if (isWellnessBlobEnabled()) {
    await writeWellnessBlob(userKey, data);
    return;
  }
  if (process.env.VERCEL) {
    throw new Error(
      "Wellness storage is not configured. Add DATABASE_URL or create a Vercel Blob store for this project."
    );
  }
  await writeWellnessFile(userKey, data);
}

async function ensureStoredWellness(userKey: string): Promise<WellnessData> {
  if (isWellnessDatabaseEnabled()) {
    const fromDb = await ensureWellnessDb(userKey);
    if (fromDb) return fromDb;
  }
  if (isWellnessBlobEnabled()) {
    const fromBlob = await ensureWellnessBlob(userKey);
    if (fromBlob) return fromBlob;
  }
  return ensureWellnessFile(userKey);
}

export async function getWellnessForUser(email: string): Promise<WellnessData> {
  const userKey = wellnessUserKey(email);
  const stored = await readStoredWellness(userKey);
  return stored ?? emptyWellnessData(new Date(0).toISOString());
}

export async function saveWellnessForUser(
  email: string,
  incoming: WellnessData
): Promise<WellnessData> {
  const userKey = wellnessUserKey(email);
  const current = (await readStoredWellness(userKey)) ?? emptyWellnessData(new Date(0).toISOString());
  const merged =
    incoming.updatedAt >= current.updatedAt
      ? mergeWellnessData(incoming, current)
      : mergeWellnessData(current, incoming);
  const next: WellnessData = {
    ...merged,
    updatedAt: new Date().toISOString(),
  };
  await writeStoredWellness(userKey, next);
  return next;
}

export async function bootstrapWellnessForUser(email: string): Promise<WellnessData> {
  const userKey = wellnessUserKey(email);
  return ensureStoredWellness(userKey);
}

export function getWellnessStorageMode(): WellnessStorageMode {
  if (isWellnessDatabaseEnabled()) return "database";
  if (isWellnessBlobEnabled()) return "blob";
  return "file";
}

export function isWellnessStorageDurable(): boolean {
  return hasDurableWellnessStorage() || !process.env.VERCEL;
}
