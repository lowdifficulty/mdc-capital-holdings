import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createUser } from "@/lib/auth/users";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      name?: string;
      password?: string;
    };

    const result = await createUser({
      email: body.email ?? "",
      name: body.name ?? "",
      password: body.password ?? "",
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const session = await getSession();
    session.user = { email: result.user.email, name: result.user.name };
    await session.save();

    return NextResponse.json({
      success: true,
      user: { email: result.user.email, name: result.user.name },
    });
  } catch (err) {
    console.error("Registration failed:", err);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
