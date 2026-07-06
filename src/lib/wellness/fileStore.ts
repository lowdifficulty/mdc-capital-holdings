import "server-only";

import { promises as fs } from "fs";
import path from "path";
import { emptyWellnessData, type WellnessData } from "@/lib/wellness/types";

const WELLNESS_DIR = path.join(process.cwd(), "data", "wellness");

interface WellnessFile {
  data: WellnessData;
  updatedAt: string;
}

function userFilePath(userKey: string): string {
  return path.join(WELLNESS_DIR, `${userKey}.json`);
}

async function ensureDir(): Promise<void> {
  await fs.mkdir(WELLNESS_DIR, { recursive: true });
}

export function wellnessUserKey(email: string): string {
  return email.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "_");
}

export async function readWellnessFile(userKey: string): Promise<WellnessData | null> {
  try {
    const raw = await fs.readFile(userFilePath(userKey), "utf-8");
    const parsed = JSON.parse(raw) as WellnessFile;
    return parsed.data ?? null;
  } catch {
    return null;
  }
}

export async function writeWellnessFile(userKey: string, data: WellnessData): Promise<void> {
  await ensureDir();
  const payload: WellnessFile = {
    data,
    updatedAt: data.updatedAt,
  };
  await fs.writeFile(userFilePath(userKey), JSON.stringify(payload, null, 2));
}

export async function ensureWellnessFile(userKey: string): Promise<WellnessData> {
  const existing = await readWellnessFile(userKey);
  if (existing) return existing;
  const empty = emptyWellnessData(new Date().toISOString());
  await writeWellnessFile(userKey, empty);
  return empty;
}
