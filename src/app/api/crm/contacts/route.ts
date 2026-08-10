import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import {
  createContact,
  deleteContact,
  listContacts,
  migrateLegacySmsIfNeeded,
  updateContact,
} from "@/lib/platform/store";
import type { ContactKind, PipelineStage } from "@/lib/platform/types";

export async function GET(request: Request) {
  try {
    await requireUser();
    await migrateLegacySmsIfNeeded();
    const { searchParams } = new URL(request.url);
    const kind = searchParams.get("kind");
    const stage = searchParams.get("stage");
    const q = searchParams.get("q") ?? undefined;
    const contacts = await listContacts({
      kind: kind === "lead" || kind === "client" ? kind : undefined,
      stage: (stage as PipelineStage) || undefined,
      q,
    });
    return NextResponse.json({ contacts });
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
      email?: string;
      kind?: string;
      stage?: string;
      notes?: string;
      tags?: string[];
    };
    const name = body.name?.trim() ?? "";
    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }
    const phone = body.phone?.trim() ?? "";
    if (phone && phone.replace(/\D/g, "").length < 10) {
      return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400 });
    }
    const contact = await createContact({
      name,
      phone: phone || undefined,
      email: body.email,
      kind: body.kind === "client" ? "client" : "lead",
      stage: (body.stage as PipelineStage) || undefined,
      notes: body.notes,
      tags: body.tags,
    });
    return NextResponse.json({ contact });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireUser();
    const body = (await request.json()) as {
      id?: string;
      name?: string;
      phone?: string;
      email?: string;
      kind?: ContactKind;
      stage?: PipelineStage;
      notes?: string;
      tags?: string[];
    };
    if (!body.id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    const contact = await updateContact(body.id, {
      name: body.name,
      phone: body.phone,
      email: body.email,
      kind: body.kind,
      stage: body.stage,
      notes: body.notes,
      tags: body.tags,
    });
    if (!contact) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
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
