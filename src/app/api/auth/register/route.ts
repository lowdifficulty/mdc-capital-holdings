import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Registration is not available." },
    { status: 403 }
  );
}
