import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { appendMessage, normalizePhone } from "@/lib/sms/store";
import { sendSms } from "@/lib/twilio/send";
import { getTwilioConfig, twilioConfigHint } from "@/lib/twilio/config";
import { companyLegal } from "@/data/site";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!getTwilioConfig()) {
      return NextResponse.json(
        { error: "Twilio is not configured.", hint: twilioConfigHint() },
        { status: 503 },
      );
    }

    const body = (await request.json()) as {
      to?: string;
      message?: string;
      contactId?: string | null;
    };

    const rawTo = body.to?.trim() ?? "";
    const message = body.message?.trim() ?? "";

    if (!rawTo) {
      return NextResponse.json({ error: "Recipient phone is required." }, { status: 400 });
    }
    if (!message || message.length < 1) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }
    if (message.length > 1600) {
      return NextResponse.json({ error: "Message is too long." }, { status: 400 });
    }

    const to = normalizePhone(rawTo);

    const brandedBody = message.includes(companyLegal.name)
      ? message
      : `${companyLegal.name}: ${message}`;

    try {
      const result = await sendSms(to, brandedBody);
      const record = await appendMessage({
        contactId: body.contactId ?? null,
        to,
        body: brandedBody,
        twilioSid: result.sid,
        status: result.status ?? "queued",
        error: null,
        sentAt: new Date().toISOString(),
        sentBy: user.email,
      });
      return NextResponse.json({ success: true, result, record });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Send failed";
      const record = await appendMessage({
        contactId: body.contactId ?? null,
        to,
        body: brandedBody,
        twilioSid: null,
        status: "failed",
        error: errorMessage,
        sentAt: new Date().toISOString(),
        sentBy: user.email,
      });
      return NextResponse.json({ error: errorMessage, record }, { status: 502 });
    }
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Send failed" }, { status: 500 });
  }
}
