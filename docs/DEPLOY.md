# One-time setup so `git push` deploys https://mdccapitalholdings.com

GitHub Actions workflow: `.github/workflows/deploy-vercel.yml`

## 1. Get three values from Vercel

1. Open [Vercel Dashboard](https://vercel.com/dashboard) → your **mdc-capital-holdings** project.
2. **Settings → General** → copy **Project ID**.
3. **Settings → General** → copy **Team / Personal ID** (Org ID).
4. **Account Settings → Tokens** → create a token named `github-deploy` → copy it.

## 2. Add GitHub secrets

Repo: **lowdifficulty/mdc-capital-holdings** → **Settings → Secrets and variables → Actions → New repository secret**

| Secret name | Value |
|-------------|--------|
| `VERCEL_TOKEN` | token from step 1 |
| `VERCEL_ORG_ID` | org/team id |
| `VERCEL_PROJECT_ID` | project id |

## 3. Run deploy

**Actions** tab → **Deploy production (Vercel)** → **Run workflow** → branch `master`.

Or push any commit to `master` (future deploys are automatic).

## 4. Confirm

Open https://mdccapitalholdings.com — hero should say **Business information**, not “From Small Business”.

## Local preview (your PC only)

```powershell
cd "C:\Users\Admin\MDC Capital Holdings"
git pull origin master
npm install
npm run dev:clean
```

Open http://localhost:3001 and **leave the terminal open**.

If `dev:clean` errors, run `npm run dev` and paste the error text.
