/**
 * Merge Twilio + admin vars into .env.local for local dev.
 * Usage: npm run env:local
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";

const ENV_PATH = ".env.local";
const EXAMPLE_PATH = ".env.example";

function parseEnv(text) {
  const map = new Map();
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    map.set(key, val);
  }
  return map;
}

function serializeEnv(map) {
  const keys = [
    "SESSION_SECRET",
    "ADMIN_EMAIL",
    "ADMIN_PASSWORD",
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_API_KEY_SID",
    "TWILIO_API_KEY_SECRET",
    "TWILIO_PHONE_NUMBER",
  ];
  const lines = ["# Local dev — do not commit", ""];
  for (const key of keys) {
    if (map.has(key)) {
      lines.push(`${key}=${map.get(key)}`);
    }
  }
  lines.push("");
  return lines.join("\n");
}

const existing = existsSync(ENV_PATH) ? parseEnv(readFileSync(ENV_PATH, "utf8")) : new Map();
const example = existsSync(EXAMPLE_PATH) ? parseEnv(readFileSync(EXAMPLE_PATH, "utf8")) : new Map();

for (const [k, v] of example) {
  if (k.startsWith("TWILIO_") || k === "ADMIN_EMAIL" || k === "ADMIN_PASSWORD") {
    if (!existing.get(k)) existing.set(k, v);
  }
}

if (!existing.get("SESSION_SECRET")) {
  existing.set("SESSION_SECRET", "mdc-local-dev-change-this-session-secret");
}

writeFileSync(ENV_PATH, serializeEnv(existing), "utf8");

console.log("Updated .env.local with Twilio/admin keys from .env.example where missing.");
console.log("Required: set TWILIO_ACCOUNT_SID (AC…) from https://console.twilio.com");
console.log("Then run: npm run dev:clean");
