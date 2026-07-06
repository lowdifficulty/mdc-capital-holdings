import "server-only";

import { emptyWellnessData, type WellnessData } from "@/lib/wellness/types";

type PgPool = import("pg").Pool;

let pool: PgPool | null = null;
let schemaReady: Promise<void> | null = null;

function databaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

async function getPool(): Promise<PgPool | null> {
  if (!databaseConfigured()) return null;
  if (!pool) {
    const { Pool } = await import("pg");
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes("localhost")
        ? undefined
        : { rejectUnauthorized: false },
    });
  }
  return pool;
}

async function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const db = await getPool();
      if (!db) return;
      await db.query(`
        CREATE TABLE IF NOT EXISTS wellness_data (
          user_key TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
    })();
  }
  await schemaReady;
}

export async function readWellnessDb(userKey: string): Promise<WellnessData | null> {
  const db = await getPool();
  if (!db) return null;
  await ensureSchema();
  const result = await db.query<{ data: WellnessData }>(
    "SELECT data FROM wellness_data WHERE user_key = $1 LIMIT 1",
    [userKey]
  );
  return result.rows[0]?.data ?? null;
}

export async function writeWellnessDb(userKey: string, data: WellnessData): Promise<void> {
  const db = await getPool();
  if (!db) throw new Error("Database pool unavailable");
  await ensureSchema();
  await db.query(
    `
      INSERT INTO wellness_data (user_key, data, updated_at)
      VALUES ($1, $2::jsonb, $3::timestamptz)
      ON CONFLICT (user_key)
      DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at
    `,
    [userKey, JSON.stringify(data), data.updatedAt]
  );
}

export async function ensureWellnessDb(userKey: string): Promise<WellnessData | null> {
  if (!databaseConfigured()) return null;
  const existing = await readWellnessDb(userKey);
  if (existing) return existing;
  const empty = emptyWellnessData(new Date().toISOString());
  await writeWellnessDb(userKey, empty);
  return empty;
}

export function isWellnessDatabaseEnabled(): boolean {
  return databaseConfigured();
}
