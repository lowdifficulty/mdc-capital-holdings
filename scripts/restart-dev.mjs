/**
 * Kill stale Next on port 3001, wipe .next, start `npm run dev`.
 * Usage: npm run dev:clean
 */

import { spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { killPort } from "./local-server.mjs";

const PORT = 3001;
const isWin = process.platform === "win32";
const npm = isWin ? "npm.cmd" : "npm";

killPort(PORT);
killPort(3000);

if (existsSync(".next")) {
  console.log("Removing .next (fixes blank page / 500 after builds)...");
  rmSync(".next", { recursive: true, force: true });
}

console.log(`Starting http://localhost:${PORT} ...`);
const child = spawn(npm, ["run", "dev"], {
  stdio: "inherit",
  shell: isWin,
  env: process.env,
});

child.on("close", (code) => process.exit(code ?? 0));
