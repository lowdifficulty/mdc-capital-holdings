# MDC Platform (admin)

GoHighLevel-style command center: **Inbox**, **CRM**, **Calls**, and **Meta** DMs on one stack.

## Login

- `/login` — default admin **1** / **1** (override with `ADMIN_EMAIL` / `ADMIN_PASSWORD`)

## Navigation

| Area | Path | Purpose |
|------|------|---------|
| Inbox | `/dashboard` | Unified threads: SMS, call activity, Meta DMs |
| CRM | `/dashboard/crm` | Pipeline board + contacts |
| Calls | `/dashboard/calls` | Click-to-call + call log |
| Integrations | `/dashboard/integrations` | Twilio status, Meta OAuth + webhook instructions |

Legacy routes redirect: `/dashboard/sms` → Inbox, `/dashboard/projects` → CRM.

## Data storage

Contacts, messages, calls, and Meta tokens persist in **Vercel Blob** when `BLOB_READ_WRITE_TOKEN` is set; locally under `data/platform/data.json`.

## Twilio

Same vars as SMS: `TWILIO_ACCOUNT_SID`, API key or auth token, `TWILIO_PHONE_NUMBER`.

Optional **`TWILIO_BRIDGE_PHONE`**: your cell number. Outbound calls ring you first, then dial the contact (bridged click-to-call).

## Meta

1. Create a [Meta Developer](https://developers.facebook.com/) app with Messenger + Instagram products.
2. Set env: `META_APP_ID`, `META_APP_SECRET`, `META_WEBHOOK_VERIFY_TOKEN` (and `NEXT_PUBLIC_META_APP_ID` for client display).
3. Deploy, open **Integrations → Connect Meta**.
4. Configure webhook URL: `https://mdccapitalholdings.com/api/meta/webhook` with your verify token.
5. Inbound DMs create CRM contacts automatically; reply from Inbox when **Meta DM** channel is available.

## A2P SMS

US marketing SMS still requires Twilio A2P 10DLC approval. Public compliance pages remain on the marketing site (`/sms-opt-in`, legal pages).
