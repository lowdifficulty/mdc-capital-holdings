/**
 * `next dev` breaks if `.next` was produced by `next build` (missing chunk modules).
 * Remove stale production output before starting the dev server.
 */

import { existsSync, rmSync } from "node:fs";

const nextDir = ".next";
if (!existsSync(nextDir)) {
  process.exit(0);
}

const productionArtifacts =
  existsSync(`${nextDir}/app-path-routes-manifest.json`) ||
  existsSync(`${nextDir}/required-server-files.json`);

if (productionArtifacts) {
  console.log(
    "Removing .next with production build output (fixes missing chunk e.g. 4996.js / 1331.js)…",
  );
  rmSync(nextDir, { recursive: true, force: true });
}
