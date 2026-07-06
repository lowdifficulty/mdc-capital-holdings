import "server-only";

import { put } from "@vercel/blob";
import { emptyWellnessData, type WellnessData } from "@/lib/wellness/types";

interface WellnessBlobFile {
  data: WellnessData;
  updatedAt: string;
}

function blobPath(userKey: string): string {
  return `wellness/${userKey}.json`;
}

export function isWellnessBlobEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

export async function readWellnessBlob(userKey: string): Promise<WellnessData | null> {
  if (!isWellnessBlobEnabled()) return null;
  try {
    const { get } = await import("@vercel/blob");
    const result = await get(blobPath(userKey), { access: "private" });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    const text = await new Response(result.stream).text();
    const parsed = JSON.parse(text) as WellnessBlobFile;
    return parsed.data ?? null;
  } catch {
    return null;
  }
}

export async function writeWellnessBlob(userKey: string, data: WellnessData): Promise<void> {
  if (!isWellnessBlobEnabled()) {
    throw new Error("Blob storage is not configured");
  }
  const payload: WellnessBlobFile = {
    data,
    updatedAt: data.updatedAt,
  };
  await put(blobPath(userKey), JSON.stringify(payload), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

export async function ensureWellnessBlob(userKey: string): Promise<WellnessData | null> {
  if (!isWellnessBlobEnabled()) return null;
  const existing = await readWellnessBlob(userKey);
  if (existing) return existing;
  const empty = emptyWellnessData(new Date().toISOString());
  await writeWellnessBlob(userKey, empty);
  return empty;
}
