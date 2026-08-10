import "server-only";

import { put } from "@vercel/blob";
import type { PlatformData } from "@/lib/platform/types";

const PLATFORM_PATH = "platform/data.json";

export function isPlatformBlobEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

export async function readPlatformBlob(): Promise<PlatformData | null> {
  if (!isPlatformBlobEnabled()) return null;
  try {
    const { get } = await import("@vercel/blob");
    const result = await get(PLATFORM_PATH, { access: "private" });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    const text = await new Response(result.stream).text();
    return JSON.parse(text) as PlatformData;
  } catch {
    return null;
  }
}

export async function writePlatformBlob(data: PlatformData): Promise<void> {
  if (!isPlatformBlobEnabled()) {
    throw new Error("Blob storage is not configured");
  }
  await put(PLATFORM_PATH, JSON.stringify(data), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}
