import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { listMessages, migrateLegacySmsIfNeeded } from "@/lib/platform/store";

export async function GET() {
  try {
    await requireUser();
    await migrateLegacySmsIfNeeded();
    const messages = await listMessages({ channel: "sms", limit: 100 });
    return NextResponse.json({
      messages: messages.map((m) => ({
        id: m.id,
        to: m.to,
        body: m.body,
        status: m.status,
        error: m.error,
        sentAt: m.sentAt,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
