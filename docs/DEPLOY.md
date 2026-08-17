# Deploy https://mdccapitalholdings.com

Code on **`master`** is the source of truth. Production updates only after a **Vercel production deploy** (push alone is not enough unless auto-deploy is configured).

## Fastest: Deploy Hook (recommended for GitHub Actions)

1. [Vercel Dashboard](https://vercel.com/dashboard) → **mdc-capital-holdings** → **Settings → Git → Deploy Hooks**
2. Create hook: name `github-master`, branch **`master`**, copy the URL.
3. GitHub repo → **Settings → Secrets and variables → Actions** → **New repository secret**
   - Name: `VERCEL_DEPLOY_HOOK`
   - Value: the hook URL
4. **Actions** → **Deploy production (Vercel)** → **Run workflow** (or push to `master`).

## Alternative: Vercel token

Add GitHub secret **`VERCEL_TOKEN`** ([create token](https://vercel.com/account/tokens)). The workflow uses org `lowdifficultys-projects` and project `mdc-capital-holdings`.

## Deploy from your PC (Windows)

```powershell
cd "C:\Users\Admin\MDC Capital Holdings"
git pull origin master
npx vercel login
npx vercel deploy --prod
```

Or: `powershell -ExecutionPolicy Bypass -File scripts/deploy-prod.ps1`

## Confirm

Open https://mdccapitalholdings.com — homepage should be the **black/gold Wayne** marketing site (same as http://localhost:3002).

## Local dev

| Command | URL |
|---------|-----|
| `npm run dev:legacy:clean` | http://localhost:3002 — legacy homepage |
| `npm run dev:clean` | http://localhost:3001 — admin portal + full app |
