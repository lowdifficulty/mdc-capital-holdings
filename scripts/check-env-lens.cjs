const fs = require("fs");
const file = process.argv[2];
const t = fs.readFileSync(file, "utf8");
for (const key of ["OPENAI_API_KEY", "ELEVENLABS_API_KEY"]) {
  const line = t.split(/\r?\n/).find((l) => l.startsWith(`${key}=`));
  if (!line) {
    console.log(key, "missing");
    continue;
  }
  let v = line.split("=").slice(1).join("=").trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  console.log(key, "len", v.length);
}
