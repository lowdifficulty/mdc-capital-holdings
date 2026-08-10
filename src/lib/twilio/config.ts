import "server-only";

export interface TwilioConfig {
  accountSid: string;
  fromNumber: string;
  apiKeySid?: string;
  apiKeySecret?: string;
  authToken?: string;
}

export function listMissingTwilioEnv(): string[] {
  const missing: string[] = [];
  if (!process.env.TWILIO_ACCOUNT_SID?.trim()) {
    missing.push("TWILIO_ACCOUNT_SID (starts with AC… from Twilio Console)");
  }

  const from =
    process.env.TWILIO_PHONE_NUMBER?.trim() ?? process.env.TWILIO_MESSAGING_FROM?.trim();
  if (!from) {
    missing.push("TWILIO_PHONE_NUMBER");
  }

  const hasApiKey =
    Boolean(process.env.TWILIO_API_KEY_SID?.trim()) &&
    Boolean(process.env.TWILIO_API_KEY_SECRET?.trim());
  const hasAuthToken = Boolean(process.env.TWILIO_AUTH_TOKEN?.trim());

  if (!hasApiKey && !hasAuthToken) {
    missing.push("TWILIO_API_KEY_SID + TWILIO_API_KEY_SECRET (or TWILIO_AUTH_TOKEN)");
  }

  return missing;
}

export function getTwilioConfig(): TwilioConfig | null {
  if (listMissingTwilioEnv().length > 0) {
    return null;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID!.trim();
  const fromNumber = (
    process.env.TWILIO_PHONE_NUMBER?.trim() ??
    process.env.TWILIO_MESSAGING_FROM?.trim() ??
    ""
  ).trim();

  const apiKeySid = process.env.TWILIO_API_KEY_SID?.trim();
  const apiKeySecret = process.env.TWILIO_API_KEY_SECRET?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();

  return {
    accountSid,
    fromNumber,
    apiKeySid: apiKeySid || undefined,
    apiKeySecret: apiKeySecret || undefined,
    authToken: authToken || undefined,
  };
}

export function twilioConfigHint(): string {
  const missing = listMissingTwilioEnv();
  if (missing.length === 0) {
    return "Twilio environment variables look incomplete.";
  }
  return `Add to .env.local (then restart dev): ${missing.join("; ")}`;
}
