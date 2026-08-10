import "server-only";

/** Format Twilio REST errors for API responses and logs. */
export function formatTwilioError(err: unknown): string {
  if (err && typeof err === "object") {
    const o = err as Record<string, unknown>;
    const code = o.code ?? o.status;
    const message = typeof o.message === "string" ? o.message : null;
    if (code != null && message) {
      return `Twilio ${code}: ${message}`;
    }
    if (message) return message;
  }
  if (err instanceof Error) return err.message;
  return "Send failed";
}

/** User-facing hint for common Twilio error codes. */
export function twilioErrorHint(code: number | string | undefined): string | null {
  const n = typeof code === "string" ? parseInt(code, 10) : code;
  if (n === 21266) {
    return "Cannot text the same number as your Twilio line. Use a different mobile number.";
  }
  if (n === 21211) {
    return "That phone number is invalid. Use a real mobile number in E.164 format (e.g. +19495551234).";
  }
  if (n === 30034) {
    return "US carrier blocked delivery: complete A2P 10DLC brand and campaign registration in Twilio, then retry.";
  }
  if (n === 21610) {
    return "This number has opted out (STOP). Do not message until they opt in again.";
  }
  return null;
}
