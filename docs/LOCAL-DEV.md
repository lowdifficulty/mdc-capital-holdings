# Local development (Windows + Cursor)

## Port

| Command | URL |
|---------|-----|
| `npm run dev` or `npm run dev:clean` | **http://localhost:3001** |
| `npm run local` (production build) | **http://localhost:3003** |

Do not use port 3000 unless you changed the script.

## “localhost:3001 doesn’t work”

### On your PC (Chrome, Edge, etc.)

`localhost` always means **your computer**. The dev server must be running **in a terminal on your machine**:

```powershell
cd "C:\Users\Admin\MDC Capital Holdings"
git pull origin master
npm install
npm run dev:clean
```

Leave that terminal open. Then open **http://localhost:3001**.

Or:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/restart-dev.ps1
```

If the tab says “connection refused” or spins forever, nothing is listening on 3001 — the command above did not stay running or failed (read the terminal for errors).

### Cursor integrated browser (Cloud Agent)

When an agent runs in the **cloud**, `npm run dev` starts on the **remote machine**, not on your PC. Your normal browser’s `localhost:3001` will **not** show that site.

Use Cursor’s **port preview / forwarded port** for the agent session (when available), or run `npm run dev:clean` locally as above.

This repo includes `.cursor/environment.json` so new cloud sessions can auto-start the dev server on port **3001**.

## After `npm run build`

Always restart dev with `npm run dev:clean` before checking localhost (see `.cursor/rules/dev-server.mdc`).
