import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { appendMessage, normalizePhone } from "@/lib/sms/store";
import { sendSms } from "@/lib/twilio/send";
import { getTwilioConfig, twilioConfigHint } from "@/lib/twilio/config";
import { formatTwilioError, twilioErrorHint } from "@/lib/twilio/errors";
import { companyLegal } from "@/data/site";

function twilioCodeFromMessage(message: string): number | undefined {
  const match = /^Twilio (\d+):/.exec(message);
  return match ? parseInt(match[1], 10) : undefined;
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const config = getTwilioConfig();
    if (!config) {
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
    const fromDigits = config.fromNumber.replace(/\D/g, "");
    const toDigits = to.replace(/\D/g, "");
    if (fromDigits && toDigits && fromDigits === toDigits) {
      return NextResponse.json(
        {
          error: "Cannot send to your Twilio number.",
          hint: twilioErrorHint(21266),
        },
        { status: 400 },
      );
    }

    const brandedBody = message.includes(companyLegal.name)
      ? message
      : `${companyLegal.name}: ${message}`;

    try {
      const result = await sendSms(to, brandedBody);
      let record: Awaited<ReturnType<typeof appendMessage>> | null = null;
      try {
        record = await appendMessage({
          contactId: body.contactId ?? null,
          to,
          body: brandedBody,
          twilioSid: result.sid,
          status: result.status ?? "queued",
          error: null,
          sentAt: new Date().toISOString(),
          sentBy: user.email,
        });
      } catch (storeErr) {
        console.error("[sms/send] message log write failed:", storeErr);
      }
      return NextResponse.json({ success: true, result, record });
    } catch (err) {
      const errorMessage = formatTwilioError(err);
      const code = twilioCodeFromMessage(errorMessage);
      const hint = twilioErrorHint(code);
      try {
        await appendMessage({
          contactId: body.contactId ?? null,
          to,
          body: brandedBody,
          twilioSid: null,
          status: "failed",
          error: errorMessage,
          sentAt: new Date().toISOString(),
          sentBy: user.email,
        });
      } catch (storeErr) {
        console.error("[sms/send] failed log write failed:", storeErr);
      }
      return NextResponse.json({ error: errorMessage, hint }, { status: 502 });
    }
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[sms/send]", e);
    return NextResponse.json({ error: "Send failed" }, { status: 500 });
  }
}
