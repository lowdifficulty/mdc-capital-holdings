import "server-only";

export interface TwilioConfig {
  accountSid: string;
  apiKeySid: string;
  apiKeySecret: string;
  fromNumber: string;
}

export function getTwilioConfig(): TwilioConfig | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const apiKeySid = process.env.TWILIO_API_KEY_SID?.trim();
  const apiKeySecret = process.env.TWILIO_API_KEY_SECRET?.trim();
  const fromNumber =
    process.env.TWILIO_PHONE_NUMBER?.trim() ??
    process.env.TWILIO_MESSAGING_FROM?.trim() ??
    "";

  if (!accountSid || !apiKeySid || !apiKeySecret || !fromNumber) {
    return null;
  }

  return { accountSid, apiKeySid, apiKeySecret, fromNumber };
}

export function twilioConfigHint(): string {
  return "Set TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, and TWILIO_PHONE_NUMBER in .env.local (local) or Vercel Environment Variables (production).";
}
