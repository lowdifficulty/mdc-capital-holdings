# A2P registration checklist (Twilio & Grasshopper)

Grasshopper business SMS typically routes through the same **A2P 10DLC / TCR** requirements as Twilio. One compliant website on **mdccapitalholdings.com** is sufficient for both.

## Website URLs to submit

| Field | URL |
|-------|-----|
| Business website | https://mdccapitalholdings.com |
| Opt-in / message flow | https://mdccapitalholdings.com/sms-opt-in |
| Alternate opt-in | https://mdccapitalholdings.com/contact |
| Privacy Policy | https://mdccapitalholdings.com/privacy-policy |
| Terms | https://mdccapitalholdings.com/terms-and-conditions |

## Registered business (verify in Trust Hub)

- **Name:** MDC Capital Holdings
- **Legal entity:** MDC Capital Holdings, LLC
- **EIN:** 39-3343074
- **Address:** 1621 Central Ave, Cheyenne, WY 82001

## Message flow

Copy `smsMessageFlowDescription` from `src/data/a2p.ts`.

## Restoring marketing site

See `src/archive/marketing-site/README.md` and `/marketing-archive`.
