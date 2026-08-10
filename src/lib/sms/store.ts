import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

export type ContactKind = "lead" | "client";

export interface SmsContact {
  id: string;
  name: string;
  phone: string;
  kind: ContactKind;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface SmsMessageRecord {
  id: string;
  contactId: string | null;
  to: string;
  body: string;
  twilioSid: string | null;
  status: string;
  error: string | null;
  sentAt: string;
  sentBy: string;
}

const DIR = path.join(process.cwd(), "data", "sms");
const CONTACTS_FILE = path.join(DIR, "contacts.json");
const MESSAGES_FILE = path.join(DIR, "messages.json");

async function ensureDir() {
  await fs.mkdir(DIR, { recursive: true });
}

async function readContacts(): Promise<SmsContact[]> {
  try {
    const raw = await fs.readFile(CONTACTS_FILE, "utf8");
    const parsed = JSON.parse(raw) as { contacts?: SmsContact[] };
    return parsed.contacts ?? [];
  } catch {
    return [];
  }
}

async function writeContacts(contacts: SmsContact[]) {
  await ensureDir();
  await fs.writeFile(CONTACTS_FILE, JSON.stringify({ contacts }, null, 2) + "\n", "utf8");
}

async function readMessages(): Promise<SmsMessageRecord[]> {
  try {
    const raw = await fs.readFile(MESSAGES_FILE, "utf8");
    const parsed = JSON.parse(raw) as { messages?: SmsMessageRecord[] };
    return parsed.messages ?? [];
  } catch {
    return [];
  }
}

async function writeMessages(messages: SmsMessageRecord[]) {
  await ensureDir();
  await fs.writeFile(MESSAGES_FILE, JSON.stringify({ messages }, null, 2) + "\n", "utf8");
}

export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (input.trim().startsWith("+")) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }
  return `+${digits}`;
}

export async function listContacts(kind?: ContactKind): Promise<SmsContact[]> {
  const all = await readContacts();
  if (!kind) return all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return all.filter((c) => c.kind === kind).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function createContact(input: {
  name: string;
  phone: string;
  kind: ContactKind;
  notes?: string;
}): Promise<SmsContact> {
  const now = new Date().toISOString();
  const contact: SmsContact = {
    id: randomUUID(),
    name: input.name.trim(),
    phone: normalizePhone(input.phone),
    kind: input.kind,
    notes: input.notes?.trim() ?? "",
    createdAt: now,
    updatedAt: now,
  };
  const contacts = await readContacts();
  contacts.push(contact);
  await writeContacts(contacts);
  return contact;
}

export async function deleteContact(id: string): Promise<boolean> {
  const contacts = await readContacts();
  const next = contacts.filter((c) => c.id !== id);
  if (next.length === contacts.length) return false;
  await writeContacts(next);
  return true;
}

export async function appendMessage(record: Omit<SmsMessageRecord, "id">): Promise<SmsMessageRecord> {
  const messages = await readMessages();
  const entry: SmsMessageRecord = { id: randomUUID(), ...record };
  messages.unshift(entry);
  await writeMessages(messages.slice(0, 500));
  return entry;
}

export async function listRecentMessages(limit = 50): Promise<SmsMessageRecord[]> {
  const messages = await readMessages();
  return messages.slice(0, limit);
}
