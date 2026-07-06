import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getRealtimeSessionConfig, REALTIME_MODEL } from "@/lib/voice/realtime-session";

export const runtime = "nodejs";

function parseOpenAiError(body: string) {
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string } };
    return parsed.error?.message || body.slice(0, 300);
  } catch {
    return body.slice(0, 300) || "OpenAI Realtime connection failed";
  }
}

export async function POST(request: Request) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  const sdp = await request.text();
  if (!sdp.trim()) {
    return NextResponse.json({ error: "SDP offer is required." }, { status: 400 });
  }

  const sessionConfig = getRealtimeSessionConfig();
  const form = new FormData();
  form.set("sdp", sdp);
  form.set("session", JSON.stringify(sessionConfig));

  const response = await fetch(
    `https://api.openai.com/v1/realtime/calls?model=${encodeURIComponent(REALTIME_MODEL)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: form,
    }
  );

  const body = await response.text();

  if (!response.ok) {
    return NextResponse.json({ error: parseOpenAiError(body) }, { status: response.status });
  }

  return new NextResponse(body, {
    headers: { "Content-Type": "application/sdp" },
  });
}
