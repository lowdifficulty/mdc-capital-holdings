import "server-only";

import { mergeWellnessData } from "@/lib/wellness/merge";
import { emptyWellnessData, type WellnessData } from "@/lib/wellness/types";
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

async function readStoredWellness(userKey: string): Promise<WellnessData | null> {
  if (isWellnessDatabaseEnabled()) {
    return readWellnessDb(userKey);
  }
  return readWellnessFile(userKey);
}

async function writeStoredWellness(userKey: string, data: WellnessData): Promise<void> {
  if (isWellnessDatabaseEnabled()) {
    await writeWellnessDb(userKey, data);
    return;
  }
  await writeWellnessFile(userKey, data);
}

async function ensureStoredWellness(userKey: string): Promise<WellnessData> {
  if (isWellnessDatabaseEnabled()) {
    const fromDb = await ensureWellnessDb(userKey);
    if (fromDb) return fromDb;
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

export function getWellnessStorageMode(): "database" | "file" {
  return isWellnessDatabaseEnabled() ? "database" : "file";
}
