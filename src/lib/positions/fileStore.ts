import { promises as fs } from "fs";
import path from "path";
import type { Position } from "./types";
import { toPositions } from "./portfolioSeed";

const POSITIONS_FILE = path.join(process.cwd(), "data", "positions.json");

interface PositionsFile {
  positions: Position[];
  updatedAt: string;
}

async function ensureDataDir() {
  await fs.mkdir(path.dirname(POSITIONS_FILE), { recursive: true });
}

export async function readPositionsFile(): Promise<Position[]> {
  try {
    const raw = await fs.readFile(POSITIONS_FILE, "utf-8");
    const data = JSON.parse(raw) as PositionsFile;
    return data.positions ?? [];
  } catch {
    return [];
  }
}

export async function writePositionsFile(positions: Position[]): Promise<void> {
  await ensureDataDir();
  const payload: PositionsFile = {
    positions,
    updatedAt: new Date().toISOString(),
  };
  await fs.writeFile(POSITIONS_FILE, JSON.stringify(payload, null, 2));
}

export async function seedPositionsFileIfMissing(): Promise<Position[]> {
  const existing = await readPositionsFile();
  if (existing.length > 0) return existing;

  const seeded = toPositions();
  await writePositionsFile(seeded);
  return seeded;
}
