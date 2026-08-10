/**
 * Kill stale Next on port 3001, wipe .next, start `npm run dev`.
 * Usage: npm run dev:clean
 */

import { spawn, execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { killPort } from "./local-server.mjs";

const PORT = 3001;
const isWin = process.platform === "win32";
const npm = isWin ? "npm.cmd" : "npm";

function killNextProcesses() {
  killPort(PORT);
  killPort(3000);
  if (isWin) {
    try {
      execSync(
        'powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match \'next\' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"',
        { stdio: "ignore" },
      );
    } catch {
      // ignore
    }
  } else {
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

console.log(`Starting http://localhost:${PORT} ...`);
const child = spawn(npm, ["run", "dev"], {
  stdio: "inherit",
  shell: isWin,
  env: process.env,
});

child.on("close", (code) => process.exit(code ?? 0));
