import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import {
  buildMetaOAuthUrl,
  getMetaAppConfig,
  isMetaConfigured,
} from "@/lib/meta/client";
import { getMetaIntegration } from "@/lib/platform/store";

export async function GET() {
  try {
    await requireUser();
    const meta = await getMetaIntegration();
    const { appId } = getMetaAppConfig();
    return NextResponse.json({
      configured: isMetaConfigured(),
      connected: meta.connected,
      pageId: meta.pageId,
      pageName: meta.pageName,
      igUserId: meta.igUserId,
      connectedAt: meta.connectedAt,
      appId: appId ?? null,
      webhookPath: "/api/meta/webhook",
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    await requireUser();
    const origin = new URL(request.url).origin;
    const url = buildMetaOAuthUrl(origin);
    if (!url) {
      return NextResponse.json(
        { error: "Set META_APP_ID and META_APP_SECRET on the server." },
        { status: 503 },
      );
    }
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
