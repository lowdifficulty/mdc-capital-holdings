/**
 * Run FROM Jude demo with production env injected:
 *   cd Jude/apps/demo
 *   vercel env run --environment=production -- node path/to/copy-voice-env-jude-to-mdc.cjs
 */
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const MDC_ROOT = path.join(process.env.USERPROFILE, "MDC Capital Holdings");
const KEYS = [
  "OPENAI_API_KEY",
  "ELEVENLABS_API_KEY",
  "OPENAI_REALTIME_MODEL",
  "ELEVENLABS_VOICE_ID_ALFRED",
];

const envLines = [];
for (const key of KEYS) {
  const value = process.env[key]?.trim();
  if (!value) continue;
  for (const target of ["production", "preview", "development"]) {
    spawnSync(
      "vercel",
      ["env", "add", key, target, "--force", "--sensitive"],
      { cwd: MDC_ROOT, input: value, stdio: ["pipe", "inherit", "inherit"] }
    );
  }
  envLines.push(`${key}=${value}`);
}

if (!envLines.some((l) => l.startsWith("ELEVENLABS_VOICE_ID_ALFRED="))) {
  envLines.push("ELEVENLABS_VOICE_ID_ALFRED=lUTamkMw7gOzZbFIwmq4");
}

const localPath = path.join(MDC_ROOT, ".env.local");
const existing = fs.existsSync(localPath) ? fs.readFileSync(localPath, "utf8") : "";
const map = new Map();
for (const line of existing.split(/\r?\n/)) {
  const m = line.match(/^\s*([^#=]+)=(.*)$/);
  if (m) map.set(m[1].trim(), m[2]);
}
for (const line of envLines) {
  const m = line.match(/^\s*([^#=]+)=(.*)$/);
  if (m) map.set(m[1].trim(), m[2]);
}
const merged = [...map.entries()].map(([k, v]) => `${k}=${v}`).join("\n") + "\n";
fs.writeFileSync(localPath, merged, "utf8");

let ok = 0;
for (const key of ["OPENAI_API_KEY", "ELEVENLABS_API_KEY"]) {
  if ((process.env[key] || "").length > 8) ok++;
}
console.log(`Copied ${ok} voice keys to MDC (.env.local + Vercel). Restart npm run dev.`);
