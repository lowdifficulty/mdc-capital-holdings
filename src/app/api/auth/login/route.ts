import { NextResponse } from "next/server";
import { getSession, loginUser } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email?.trim() ?? "";
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const user = await loginUser(email, password);
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const session = await getSession();
    session.user = user;
    await session.save();

    return NextResponse.json({ success: true, user });
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
