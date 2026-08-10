import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { listRecentMessages } from "@/lib/sms/store";

export async function GET() {
  try {
    await requireUser();
    const messages = await listRecentMessages(100);
    return NextResponse.json({ messages });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
