/**
 * Kill stale Next on port 3002, wipe .next, start legacy Wayne homepage dev server.
 * Usage: npm run dev:legacy:clean
 */

import { spawn, execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { killPort } from "./local-server.mjs";

const PORT = 3002;
const isWin = process.platform === "win32";
const npm = isWin ? "npm.cmd" : "npm";

function killNextProcesses() {
  killPort(PORT);
  killPort(3001);
  killPort(3000);
  if (!isWin) {
    for (const pattern of ["next-server", "next dev"]) {
      try {
        execSync(`pkill -f "${pattern}" 2>/dev/null || true`, { shell: true, stdio: "ignore" });
      } catch {
        // ignore
      }
    }
  }
}

killNextProcesses();

if (existsSync(".next")) {
  console.log("Removing .next (fixes blank page / 500 after builds)...");
  rmSync(".next", { recursive: true, force: true });
}

console.log(`Starting legacy MDC homepage at http://localhost:${PORT} ...`);
const child = spawn(npm, ["run", "dev:legacy"], {
  stdio: "inherit",
  shell: isWin,
  env: process.env,
});

child.on("close", (code) => process.exit(code ?? 0));
