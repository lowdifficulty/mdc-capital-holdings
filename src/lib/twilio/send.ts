import "server-only";
import twilio from "twilio";
import { getTwilioConfig } from "@/lib/twilio/config";

export function getTwilioClient() {
  const config = getTwilioConfig();
  if (!config) {
    throw new Error("Twilio is not configured.");
  }

  return twilio(config.apiKeySid, config.apiKeySecret, {
    accountSid: config.accountSid,
  });
}

export async function sendSms(to: string, body: string) {
  const config = getTwilioConfig();
  if (!config) {
    throw new Error("Twilio is not configured.");
  }

  const client = getTwilioClient();
  const message = await client.messages.create({
    to,
    from: config.fromNumber,
    body,
  });

  return {
    sid: message.sid,
    status: message.status,
    to: message.to,
    from: message.from,
  };
}
