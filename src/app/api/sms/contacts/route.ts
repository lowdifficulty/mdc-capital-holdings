import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getTwilioConfig, listMissingTwilioEnv, twilioConfigHint } from "@/lib/twilio/config";
import { createContact, deleteContact, listContacts } from "@/lib/sms/store";

export async function GET(request: Request) {
  try {
    await requireUser();
    const { searchParams } = new URL(request.url);
    const kind = searchParams.get("kind");
    const contacts = await listContacts(
      kind === "lead" || kind === "client" ? kind : undefined,
    );
    const missing = listMissingTwilioEnv();
    const twilio = getTwilioConfig();
    return NextResponse.json({
      contacts,
      twilioConfigured: Boolean(twilio),
      missing,
      twilioHint: twilio ? null : twilioConfigHint(),
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    await requireUser();
    const body = (await request.json()) as {
      name?: string;
      phone?: string;
      kind?: string;
      notes?: string;
    };
    const name = body.name?.trim() ?? "";
    const phone = body.phone?.trim() ?? "";
    const kind = body.kind === "client" ? "client" : "lead";

    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }
    if (!phone || phone.replace(/\D/g, "").length < 10) {
      return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400 });
    }

    const contact = await createContact({ name, phone, kind, notes: body.notes });
    return NextResponse.json({ contact });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireUser();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    const ok = await deleteContact(id);
    if (!ok) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
