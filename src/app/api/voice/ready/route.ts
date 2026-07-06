import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ ready: false, error: "Sign in required." }, { status: 401 });
  }

  const openai = Boolean(process.env.OPENAI_API_KEY?.trim());
  const elevenlabs = Boolean(process.env.ELEVENLABS_API_KEY?.trim());

  const missing: string[] = [];
  if (!openai) missing.push("OPENAI_API_KEY");
  if (!elevenlabs) missing.push("ELEVENLABS_API_KEY");

  if (missing.length > 0) {
    return NextResponse.json(
      {
        ready: false,
        missing,
        error: `Voice is not configured. Add ${missing.join(" and ")} to .env.local (dev) or Vercel env (production). Run: powershell -File scripts/import-voice-env.ps1`,
      },
      { status: 503 }
    );
  }

  return NextResponse.json({ ready: true });
}
