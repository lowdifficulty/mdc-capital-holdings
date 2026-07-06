import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { executeOperationsTool } from "@/lib/voice/operations-tools";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    arguments?: string | Record<string, unknown>;
  };

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  let args: Record<string, unknown> = {};
  if (typeof body.arguments === "string") {
    try {
      args = JSON.parse(body.arguments) as Record<string, unknown>;
    } catch {
      args = {};
    }
  } else if (body.arguments && typeof body.arguments === "object") {
    args = body.arguments;
  }

  try {
    const result = await executeOperationsTool(user.email, name, args);
    return NextResponse.json(result);
  } catch (err) {
    console.error("voice tool failed", name, err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Tool execution failed" },
      { status: 500 }
    );
  }
}
