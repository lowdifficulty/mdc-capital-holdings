import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getTwilioConfig, listMissingTwilioEnv, twilioConfigHint } from "@/lib/twilio/config";

export async function GET() {
  try {
    await requireUser();
    const config = getTwilioConfig();
    const missing = listMissingTwilioEnv();
    return NextResponse.json({
      configured: Boolean(config),
      fromNumber: config?.fromNumber ?? null,
      missing,
      hint: config ? null : twilioConfigHint(),
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
