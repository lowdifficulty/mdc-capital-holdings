import "server-only";
import { readFileSync } from "fs";
import path from "path";

const FALLBACK_KEY_FILE = path.join(process.cwd(), "data", "quiver", ".api-key");

/** Last-resort project token when env vars are unset (e.g. Vercel before env is configured). */
const BUILTIN_QUIVER_KEY = "fed0e52d58c3993726f0b4696db44032623b21c7";

function readFileKey(): string | null {
  try {
    const value = readFileSync(FALLBACK_KEY_FILE, "utf8").trim();
    return value || null;
  } catch {
    return null;
  }
}

export function getQuiverApiKey(): string | null {
  return (
    process.env.QUIVER_API_KEY?.trim() ||
    process.env.QUIVER_API_TOKEN?.trim() ||
    readFileKey() ||
    BUILTIN_QUIVER_KEY
  );
}
