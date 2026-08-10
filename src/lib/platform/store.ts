import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import {
  isPlatformBlobEnabled,
  readPlatformBlob,
  writePlatformBlob,
} from "@/lib/platform/blobStore";
import type {
  CallLogEntry,
  ContactKind,
  MessageChannel,
  MetaIntegration,
  PipelineStage,
  PlatformContact,
  PlatformData,
  PlatformMessage,
} from "@/lib/platform/types";

const FILE = path.join(process.cwd(), "data", "platform", "data.json");

function emptyMeta(): MetaIntegration {
  return {
    connected: false,
    pageId: null,
    pageName: null,
    igUserId: null,
    connectedAt: null,
    userAccessToken: null,
    pageAccessToken: null,
  };
}

export function emptyPlatformData(): PlatformData {
  return {
    contacts: [],
    messages: [],
    calls: [],
    meta: emptyMeta(),
  };
}

async function readData(): Promise<PlatformData> {
  if (isPlatformBlobEnabled()) {
    const blob = await readPlatformBlob();
    if (blob) return normalizeData(blob);
    return emptyPlatformData();
  }
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return normalizeData(JSON.parse(raw) as PlatformData);
  } catch {
    return emptyPlatformData();
  }
}

async function writeData(data: PlatformData): Promise<void> {
  const normalized = normalizeData(data);
  if (isPlatformBlobEnabled()) {
    await writePlatformBlob(normalized);
    return;
  }
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(normalized, null, 2) + "\n", "utf8");
}

function normalizeData(input: PlatformData): PlatformData {
  return {
    contacts: input.contacts ?? [],
    messages: input.messages ?? [],
    calls: input.calls ?? [],
    meta: { ...emptyMeta(), ...(input.meta ?? {}) },
  };
}

export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (input.trim().startsWith("+")) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

export async function listContacts(filters?: {
  kind?: ContactKind;
  stage?: PipelineStage;
  q?: string;
}): Promise<PlatformContact[]> {
  const data = await readData();
  let list = [...data.contacts];
  if (filters?.kind) list = list.filter((c) => c.kind === filters.kind);
  if (filters?.stage) list = list.filter((c) => c.stage === filters.stage);
  if (filters?.q) {
    const q = filters.q.toLowerCase();
    list = list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.notes.toLowerCase().includes(q),
    );
  }
  return list.sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt));
}

export async function getContact(id: string): Promise<PlatformContact | null> {
  const data = await readData();
  return data.contacts.find((c) => c.id === id) ?? null;
}

export async function findContactByMetaPsid(psid: string): Promise<PlatformContact | null> {
  const data = await readData();
  return data.contacts.find((c) => c.metaPsid === psid) ?? null;
}

export async function findContactByPhone(phone: string): Promise<PlatformContact | null> {
  const normalized = normalizePhone(phone);
  const digits = normalized.replace(/\D/g, "");
  const data = await readData();
  return (
    data.contacts.find((c) => c.phone.replace(/\D/g, "") === digits) ?? null
  );
}

export async function createContact(input: {
  name: string;
  phone?: string;
  email?: string;
  kind?: ContactKind;
  stage?: PipelineStage;
  notes?: string;
  tags?: string[];
  metaPsid?: string | null;
}): Promise<PlatformContact> {
  const now = new Date().toISOString();
  const contact: PlatformContact = {
    id: randomUUID(),
    name: input.name.trim(),
    phone: input.phone ? normalizePhone(input.phone) : "",
    email: input.email?.trim() ?? "",
    kind: input.kind ?? "lead",
    stage: input.stage ?? "new",
    tags: input.tags ?? [],
    notes: input.notes?.trim() ?? "",
    metaPsid: input.metaPsid ?? null,
    createdAt: now,
    updatedAt: now,
    lastActivityAt: now,
  };
  const data = await readData();
  data.contacts.push(contact);
  await writeData(data);
  return contact;
}

export async function updateContact(
  id: string,
  patch: Partial<
    Pick<
      PlatformContact,
      "name" | "phone" | "email" | "kind" | "stage" | "notes" | "tags" | "metaPsid"
    >
  >,
): Promise<PlatformContact | null> {
  const data = await readData();
  const idx = data.contacts.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  const current = data.contacts[idx];
  data.contacts[idx] = {
    ...current,
    ...patch,
    phone: patch.phone !== undefined ? normalizePhone(patch.phone) : current.phone,
    updatedAt: now,
    lastActivityAt: now,
  };
  await writeData(data);
  return data.contacts[idx];
}

export async function deleteContact(id: string): Promise<boolean> {
  const data = await readData();
  const before = data.contacts.length;
  data.contacts = data.contacts.filter((c) => c.id !== id);
  if (data.contacts.length === before) return false;
  await writeData(data);
  return true;
}

export async function appendMessage(
  record: Omit<PlatformMessage, "id">,
): Promise<PlatformMessage> {
  const data = await readData();
  const entry: PlatformMessage = { id: randomUUID(), ...record };
  data.messages.unshift(entry);
  data.messages = data.messages.slice(0, 2000);
  if (record.contactId) {
    const idx = data.contacts.findIndex((c) => c.id === record.contactId);
    if (idx !== -1) {
      data.contacts[idx].lastActivityAt = record.sentAt;
      data.contacts[idx].updatedAt = record.sentAt;
    }
  }
  await writeData(data);
  return entry;
}

export async function listMessages(filters?: {
  contactId?: string;
  channel?: MessageChannel;
  limit?: number;
}): Promise<PlatformMessage[]> {
  const data = await readData();
  let list = data.messages;
  if (filters?.contactId) list = list.filter((m) => m.contactId === filters.contactId);
  if (filters?.channel) list = list.filter((m) => m.channel === filters.channel);
  const limit = filters?.limit ?? 100;
  return list.slice(0, limit);
}

export interface ConversationPreview {
  contactId: string;
  contactName: string;
  phone: string;
  metaPsid: string | null;
  lastMessageAt: string;
  preview: string;
  channels: MessageChannel[];
  unread: number;
}

export async function listConversations(): Promise<ConversationPreview[]> {
  const data = await readData();
  const byContact = new Map<string, ConversationPreview>();

  for (const msg of data.messages) {
    if (!msg.contactId) continue;
    const contact = data.contacts.find((c) => c.id === msg.contactId);
    if (!contact) continue;
    const existing = byContact.get(msg.contactId);
    const channels = existing?.channels ?? [];
    if (!channels.includes(msg.channel)) channels.push(msg.channel);
    if (!existing || msg.sentAt > existing.lastMessageAt) {
      byContact.set(msg.contactId, {
        contactId: msg.contactId,
        contactName: contact.name,
        phone: contact.phone,
        metaPsid: contact.metaPsid,
        lastMessageAt: msg.sentAt,
        preview: msg.body.slice(0, 120),
        channels,
        unread: 0,
      });
    } else if (existing) {
      existing.channels = channels;
    }
  }

  for (const c of data.contacts) {
    if (!byContact.has(c.id)) {
      byContact.set(c.id, {
        contactId: c.id,
        contactName: c.name,
        phone: c.phone,
        metaPsid: c.metaPsid,
        lastMessageAt: c.lastActivityAt,
        preview: c.notes || "No messages yet",
        channels: [],
        unread: 0,
      });
    }
  }

  return [...byContact.values()].sort((a, b) =>
    b.lastMessageAt.localeCompare(a.lastMessageAt),
  );
}

export async function appendCall(record: Omit<CallLogEntry, "id">): Promise<CallLogEntry> {
  const data = await readData();
  const entry: CallLogEntry = { id: randomUUID(), ...record };
  data.calls.unshift(entry);
  data.calls = data.calls.slice(0, 500);
  await writeData(data);
  return entry;
}

export async function listCalls(limit = 50): Promise<CallLogEntry[]> {
  const data = await readData();
  return data.calls.slice(0, limit);
}

export async function getMetaIntegration(): Promise<MetaIntegration> {
  const data = await readData();
  return data.meta;
}

export async function saveMetaIntegration(meta: MetaIntegration): Promise<void> {
  const data = await readData();
  data.meta = meta;
  await writeData(data);
}

/** One-time import from legacy SMS files/blob */
export async function migrateLegacySmsIfNeeded(): Promise<void> {
  const data = await readData();
  if (data.contacts.length > 0 || data.messages.length > 0) return;

  try {
    const { listContacts: legacyContacts, listRecentMessages: legacyRecentMessages } = await import(
      "@/lib/sms/store"
    );
    const legacy = await legacyContacts();
    const legacyMsgs = await legacyRecentMessages(500);
    if (legacy.length === 0 && legacyMsgs.length === 0) return;

    const idMap = new Map<string, string>();
    for (const c of legacy) {
      const id = randomUUID();
      idMap.set(c.id, id);
      data.contacts.push({
        id,
        name: c.name,
        phone: c.phone,
        email: "",
        kind: c.kind,
        stage: c.kind === "client" ? "client" : "new",
        tags: [],
        notes: c.notes,
        metaPsid: null,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        lastActivityAt: c.updatedAt,
      });
    }
    for (const m of legacyMsgs) {
      data.messages.push({
        id: randomUUID(),
        contactId: m.contactId ? idMap.get(m.contactId) ?? null : null,
        channel: "sms",
        direction: "out",
        to: m.to,
        from: "",
        body: m.body,
        twilioSid: m.twilioSid,
        metaMid: null,
        status: m.status,
        error: m.error,
        sentAt: m.sentAt,
        sentBy: m.sentBy,
      });
    }
    data.messages.sort((a, b) => b.sentAt.localeCompare(a.sentAt));
    await writeData(data);
  } catch {
    /* optional */
  }
}
