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

const devWebpackCache = existsSync(`${nextDir}/cache/webpack/client-development`);

if (productionArtifacts && !devWebpackCache) {
  console.log("Removing stale production .next output (fixes missing chunk / 1331.js errors)…");
  rmSync(nextDir, { recursive: true, force: true });
}
