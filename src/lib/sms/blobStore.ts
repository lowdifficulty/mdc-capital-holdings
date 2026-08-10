import "server-only";

import { put } from "@vercel/blob";

const CONTACTS_PATH = "sms/contacts.json";
const MESSAGES_PATH = "sms/messages.json";

export function isSmsBlobEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

async function readJsonBlob<T>(path: string): Promise<T | null> {
  if (!isSmsBlobEnabled()) return null;
  try {
    const { get } = await import("@vercel/blob");
    const result = await get(path, { access: "private" });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    const text = await new Response(result.stream).text();
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

async function writeJsonBlob(path: string, payload: unknown): Promise<void> {
  if (!isSmsBlobEnabled()) {
    throw new Error("Blob storage is not configured");
  }
  await put(path, JSON.stringify(payload), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

export async function readContactsBlob(): Promise<{ contacts: unknown[] } | null> {
  return readJsonBlob<{ contacts: unknown[] }>(CONTACTS_PATH);
}

export async function writeContactsBlob(payload: { contacts: unknown[] }): Promise<void> {
  await writeJsonBlob(CONTACTS_PATH, payload);
}

export async function readMessagesBlob(): Promise<{ messages: unknown[] } | null> {
  return readJsonBlob<{ messages: unknown[] }>(MESSAGES_PATH);
}

export async function writeMessagesBlob(payload: { messages: unknown[] }): Promise<void> {
  await writeJsonBlob(MESSAGES_PATH, payload);
}
