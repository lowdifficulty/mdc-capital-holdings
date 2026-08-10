# Twilio SMS admin console

## Login

- URL: `/login`
- Default admin (override with env): username **`1`**, password **`1`**
- Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in production.

## SMS console

After login: **Command center → SMS** (`/dashboard/sms`)

- Add **leads** and **clients**
- Send SMS via Twilio
- View recent outbound log (stored in Vercel Blob when `BLOB_READ_WRITE_TOKEN` is set, otherwise `data/sms/` locally)

## Required environment variables

| Variable | Description |
|----------|-------------|
| `TWILIO_ACCOUNT_SID` | **Required.** Account SID (`AC…`) on [Twilio Console](https://console.twilio.com) home |
| `TWILIO_API_KEY_SID` | API Key SID (`SK…`) **or** use auth token below |
| `TWILIO_API_KEY_SECRET` | API Key secret (pair with `SK…`) |
| `TWILIO_AUTH_TOKEN` | **Alternative** to API key: main Auth Token from console |
| `TWILIO_PHONE_NUMBER` | Twilio SMS-enabled number in E.164 (e.g. `+19497558994`) |

### Local dev (Windows)

**Option A — interactive**

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-local-twilio.ps1
npm run dev:clean
```

**Option B — manual**

Create `.env.local` in the project root (copy from `.env.example`), fill values, then:

```powershell
npm run dev:clean
```

`vercel env pull` often writes `[SENSITIVE]` placeholders — **paste real values by hand** or use Option A.

Restart dev after any `.env.local` change.

## Security

- Rotate API keys if they were shared in chat or tickets.
- Use A2P-approved message templates after registration.
- Only message recipients who opted in via `/sms-opt-in` or documented consent.
