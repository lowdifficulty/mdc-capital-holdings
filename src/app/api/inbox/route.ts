import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { listConversations, listMessages, migrateLegacySmsIfNeeded } from "@/lib/platform/store";
import type { MessageChannel } from "@/lib/platform/types";

export async function GET(request: Request) {
  try {
    await requireUser();
    await migrateLegacySmsIfNeeded();
    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get("contactId");
    const channel = searchParams.get("channel") as MessageChannel | null;

    if (contactId) {
      const messages = await listMessages({
        contactId,
        channel: channel ?? undefined,
        limit: 200,
      });
      return NextResponse.json({ messages });
    }

    const conversations = await listConversations();
    return NextResponse.json({ conversations });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
