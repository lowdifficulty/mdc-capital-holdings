import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { appendCall, getContact, listCalls, normalizePhone } from "@/lib/platform/store";
import { placeOutboundCall } from "@/lib/twilio/voice";
import { getTwilioConfig, twilioConfigHint } from "@/lib/twilio/config";
import { formatTwilioError } from "@/lib/twilio/errors";

export async function GET() {
  try {
    await requireUser();
    const calls = await listCalls(80);
    return NextResponse.json({ calls });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!getTwilioConfig()) {
      return NextResponse.json(
        { error: "Twilio is not configured.", hint: twilioConfigHint() },
        { status: 503 },
      );
    }

    const body = (await request.json()) as { contactId?: string; to?: string };
    const contact = body.contactId ? await getContact(body.contactId) : null;
    const rawTo = body.to?.trim() || contact?.phone || "";
    if (!rawTo || rawTo.replace(/\D/g, "").length < 10) {
      return NextResponse.json({ error: "Valid phone number required." }, { status: 400 });
    }
    const to = normalizePhone(rawTo);
    const config = getTwilioConfig()!;

    try {
      const result = await placeOutboundCall(to);
      const startedAt = new Date().toISOString();
      const callLog = await appendCall({
        contactId: contact?.id ?? null,
        to,
        from: config.fromNumber,
        twilioSid: result.sid,
        status: result.status,
        direction: "outbound",
        durationSec: null,
        startedAt,
        endedAt: null,
        error: null,
      });
      await appendMessageVoiceLog(contact?.id ?? null, to, config.fromNumber, user.email, result.sid);
      return NextResponse.json({ success: true, call: callLog, twilio: result });
    } catch (err) {
      const errorMessage = formatTwilioError(err);
      return NextResponse.json({ error: errorMessage }, { status: 502 });
    }
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Call failed" }, { status: 500 });
  }
}

async function appendMessageVoiceLog(
  contactId: string | null,
  to: string,
  from: string,
  sentBy: string,
  sid: string,
) {
  const { appendMessage } = await import("@/lib/platform/store");
  await appendMessage({
    contactId,
    channel: "voice",
    direction: "out",
    to,
    from,
    body: "Outbound call placed",
    twilioSid: sid,
    metaMid: null,
    status: "initiated",
    error: null,
    sentAt: new Date().toISOString(),
    sentBy,
  });
}
