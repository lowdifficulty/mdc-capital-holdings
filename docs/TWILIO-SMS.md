# Twilio SMS admin console

## Login

- URL: `/login`
- Default admin (override with env): username **`1`**, password **`1`**
- Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in production.

## SMS console

After login: **Command center → SMS** (`/dashboard/sms`)

- Add **leads** and **clients**
- Send SMS via Twilio
- View recent outbound log (stored in `data/sms/` on the server)

## Required environment variables

| Variable | Description |
|----------|-------------|
| `TWILIO_ACCOUNT_SID` | Account SID (`AC…`) from [Twilio Console](https://console.twilio.com) |
| `TWILIO_API_KEY_SID` | API Key SID (`SK…`) |
| `TWILIO_API_KEY_SECRET` | API Key secret |
| `TWILIO_PHONE_NUMBER` | Your Twilio SMS-enabled number in E.164 (e.g. `+19497558994`) |

Add the same variables in **Vercel → Project → Settings → Environment Variables** for Production (and Preview if needed).

Local: copy `.env.example` to `.env.local` and fill values. **Never commit `.env.local`.**

## Security

- Rotate API keys if they were shared in chat or tickets.
- Use A2P-approved message templates after registration.
- Only message recipients who opted in via `/sms-opt-in` or documented consent.
