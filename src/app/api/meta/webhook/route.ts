import { NextResponse } from "next/server";
import { getMetaAppConfig } from "@/lib/meta/client";
import {
  appendMessage,
  createContact,
  findContactByMetaPsid,
  getMetaIntegration,
} from "@/lib/platform/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  const { verifyToken } = getMetaAppConfig();

  if (mode === "subscribe" && token && verifyToken && token === verifyToken) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      object?: string;
      entry?: {
        id?: string;
        messaging?: {
          sender?: { id?: string };
          recipient?: { id?: string };
          message?: { mid?: string; text?: string };
        }[];
      }[];
    };

    if (body.object !== "page" && body.object !== "instagram") {
      return NextResponse.json({ ok: true });
    }

    const meta = await getMetaIntegration();
    const pageId = meta.pageId;

    for (const entry of body.entry ?? []) {
      for (const event of entry.messaging ?? []) {
        const psid = event.sender?.id;
        const text = event.message?.text?.trim();
        if (!psid || !text) continue;

        let contact = await findContactByMetaPsid(psid);
        if (!contact) {
          contact = await createContact({
            name: `Meta lead ${psid.slice(-6)}`,
            kind: "lead",
            stage: "new",
            notes: "Inbound Meta message",
            metaPsid: psid,
          });
        }

        await appendMessage({
          contactId: contact.id,
          channel: "meta",
          direction: "in",
          to: pageId ?? "page",
          from: psid,
          body: text,
          twilioSid: null,
          metaMid: event.message?.mid ?? null,
          status: "received",
          error: null,
          sentAt: new Date().toISOString(),
          sentBy: "meta",
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[meta/webhook]", err);
    return NextResponse.json({ ok: true });
  }
}
