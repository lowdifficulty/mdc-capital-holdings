import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { appendMessage, getContact, normalizePhone } from "@/lib/platform/store";
import { sendSms } from "@/lib/twilio/send";
import { getTwilioConfig, twilioConfigHint } from "@/lib/twilio/config";
import { formatTwilioError, twilioErrorHint } from "@/lib/twilio/errors";
import { sendInstagramTextMessage, sendMetaTextMessage } from "@/lib/meta/client";
import { getMetaIntegration } from "@/lib/platform/store";
import { companyLegal } from "@/data/site";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = (await request.json()) as {
      contactId?: string;
      channel?: "sms" | "meta";
      to?: string;
      message?: string;
      metaChannel?: "messenger" | "instagram";
    };

    const channel = body.channel ?? "sms";
    const message = body.message?.trim() ?? "";
    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const contact = body.contactId ? await getContact(body.contactId) : null;
    const brandedBody = message.includes(companyLegal.name)
      ? message
      : `${companyLegal.name}: ${message}`;

    if (channel === "sms") {
      const config = getTwilioConfig();
      if (!config) {
        return NextResponse.json(
          { error: "Twilio is not configured.", hint: twilioConfigHint() },
          { status: 503 },
        );
      }
      const rawTo = body.to?.trim() || contact?.phone || "";
      if (!rawTo) {
        return NextResponse.json({ error: "Contact needs a phone number for SMS." }, { status: 400 });
      }
      const to = normalizePhone(rawTo);
      const fromDigits = config.fromNumber.replace(/\D/g, "");
      const toDigits = to.replace(/\D/g, "");
      if (fromDigits === toDigits) {
        return NextResponse.json(
          { error: "Cannot send to your Twilio number.", hint: twilioErrorHint(21266) },
          { status: 400 },
        );
      }
      try {
        const result = await sendSms(to, brandedBody);
        const record = await appendMessage({
          contactId: contact?.id ?? null,
          channel: "sms",
          direction: "out",
          to,
          from: config.fromNumber,
          body: brandedBody,
          twilioSid: result.sid,
          metaMid: null,
          status: result.status ?? "queued",
          error: null,
          sentAt: new Date().toISOString(),
          sentBy: user.email,
        });
        return NextResponse.json({ success: true, result, record });
      } catch (err) {
        const errorMessage = formatTwilioError(err);
        return NextResponse.json({ error: errorMessage }, { status: 502 });
      }
    }

    if (channel === "meta") {
      const meta = await getMetaIntegration();
      if (!meta.connected || !meta.pageAccessToken) {
        return NextResponse.json(
          { error: "Connect Meta in Integrations to send DMs." },
          { status: 503 },
        );
      }
      const psid = contact?.metaPsid;
      if (!psid) {
        return NextResponse.json(
          { error: "Contact has no Meta conversation yet. They must message your Page first." },
          { status: 400 },
        );
      }
      try {
        const metaChannel = body.metaChannel ?? "messenger";
        const result =
          metaChannel === "instagram" && meta.igUserId
            ? await sendInstagramTextMessage(meta.igUserId, meta.pageAccessToken, psid, brandedBody)
            : await sendMetaTextMessage(meta.pageAccessToken, psid, brandedBody);
        const record = await appendMessage({
          contactId: contact?.id ?? null,
          channel: "meta",
          direction: "out",
          to: psid,
          from: meta.pageId ?? "meta",
          body: brandedBody,
          twilioSid: null,
          metaMid: result.message_id ?? null,
          status: "sent",
          error: null,
          sentAt: new Date().toISOString(),
          sentBy: user.email,
        });
        return NextResponse.json({ success: true, record });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Meta send failed";
        return NextResponse.json({ error: errorMessage }, { status: 502 });
      }
    }

    return NextResponse.json({ error: "Unsupported channel." }, { status: 400 });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Send failed" }, { status: 500 });
  }
}
