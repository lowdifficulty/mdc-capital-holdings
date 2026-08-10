import "server-only";
import { getTwilioClient } from "@/lib/twilio/send";
import { getTwilioConfig } from "@/lib/twilio/config";

export async function placeOutboundCall(to: string): Promise<{ sid: string; status: string }> {
  const config = getTwilioConfig();
  if (!config) throw new Error("Twilio is not configured.");

  const client = getTwilioClient();
  const bridge = process.env.TWILIO_BRIDGE_PHONE?.trim();
  const from = config.fromNumber;

  if (bridge) {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Joanna">Connecting your outbound call.</Say><Dial callerId="${from}">${to}</Dial></Response>`;
    const call = await client.calls.create({
      to: bridge,
      from,
      twiml,
    });
    return { sid: call.sid, status: call.status ?? "queued" };
  }

  const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Joanna">Hello from MDC Capital Holdings.</Say></Response>`;
  const call = await client.calls.create({
    to,
    from,
    twiml,
  });

  return { sid: call.sid, status: call.status ?? "queued" };
}
