"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { MessageChannel, PipelineStage } from "@/lib/platform/types";
import { PIPELINE_STAGES } from "@/lib/platform/types";

interface Conversation {
  contactId: string;
  contactName: string;
  phone: string;
  metaPsid: string | null;
  lastMessageAt: string;
  preview: string;
  channels: MessageChannel[];
}

interface ThreadMessage {
  id: string;
  channel: MessageChannel;
  direction: string;
  body: string;
  status: string;
  sentAt: string;
}

interface ContactDetail {
  id: string;
  name: string;
  phone: string;
  email: string;
  stage: PipelineStage;
  kind: string;
  notes: string;
  metaPsid: string | null;
}

const CHANNEL_LABEL: Record<MessageChannel, string> = {
  sms: "SMS",
  voice: "Call",
  meta: "Meta",
};

export default function InboxPanel() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [contact, setContact] = useState<ContactDetail | null>(null);
  const [filter, setFilter] = useState<"all" | MessageChannel>("all");
  const [compose, setCompose] = useState("");
  const [channel, setChannel] = useState<"sms" | "meta">("sms");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [twilioOk, setTwilioOk] = useState(true);
  const [metaOk, setMetaOk] = useState(false);
  const [search, setSearch] = useState("");

  const loadInbox = useCallback(async () => {
    const [inboxRes, statusRes, metaRes] = await Promise.all([
      fetch("/api/inbox"),
      fetch("/api/sms/status"),
      fetch("/api/meta/status"),
    ]);
    if (inboxRes.ok) {
      const data = await inboxRes.json();
      setConversations(data.conversations ?? []);
    }
    if (statusRes.ok) {
      const data = await statusRes.json();
      setTwilioOk(data.configured);
    }
    if (metaRes.ok) {
      const data = await metaRes.json();
      setMetaOk(Boolean(data.connected));
    }
  }, []);

  const loadThread = useCallback(async (contactId: string) => {
    const [msgRes, crmRes] = await Promise.all([
      fetch(`/api/inbox?contactId=${encodeURIComponent(contactId)}`),
      fetch("/api/crm/contacts"),
    ]);
    if (msgRes.ok) {
      const data = await msgRes.json();
      setMessages(data.messages ?? []);
    }
    if (crmRes.ok) {
      const data = await crmRes.json();
      const c = (data.contacts ?? []).find((x: ContactDetail) => x.id === contactId);
      setContact(c ?? null);
    }
  }, []);

  useEffect(() => {
    void loadInbox();
  }, [loadInbox]);

  useEffect(() => {
    if (selectedId) void loadThread(selectedId);
    else {
      setMessages([]);
      setContact(null);
    }
  }, [selectedId, loadThread]);

  const filteredConversations = useMemo(() => {
    let list = conversations;
    if (filter !== "all") {
      list = list.filter((c) => c.channels.includes(filter));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.contactName.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.preview.toLowerCase().includes(q),
      );
    }
    return list;
  }, [conversations, filter, search]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/inbox/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: selectedId,
          channel,
          message: compose,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Send failed");
        return;
      }
      setCompose("");
      await loadThread(selectedId);
      await loadInbox();
    } catch {
      setError("Network error");
    } finally {
      setSending(false);
    }
  }

  async function handleCall() {
    if (!selectedId || !contact?.phone) return;
    setError("");
    const res = await fetch("/api/calls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId: selectedId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Call failed");
      return;
    }
    await loadThread(selectedId);
    await loadInbox();
  }

  async function updateStage(stage: PipelineStage) {
    if (!selectedId) return;
    await fetch("/api/crm/contacts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selectedId, stage }),
    });
    await loadThread(selectedId);
  }

  const inputClass =
    "w-full rounded-sm border border-[#c9a227]/20 bg-black/30 px-3 py-2 text-sm text-[#eae6dc] outline-none focus:border-[#c9a227]";

  return (
    <div className="grid min-h-[70vh] gap-4 lg:grid-cols-12">
      <aside className="lg:col-span-4 xl:col-span-3 space-y-3 rounded-sm border border-[#c9a227]/15 bg-[#111]/80 p-3">
        <input
          className={inputClass}
          placeholder="Search conversations"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {(["all", "sms", "meta", "voice"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-sm px-2 py-1 text-xs font-semibold uppercase ${
                filter === f ? "bg-[#c9a227] text-[#050505]" : "border border-[#c9a227]/25 text-[#eae6dc]/60"
              }`}
            >
              {f === "all" ? "All" : CHANNEL_LABEL[f]}
            </button>
          ))}
        </div>
        <ul className="max-h-[60vh] space-y-1 overflow-y-auto">
          {filteredConversations.length === 0 && (
            <li className="text-sm text-[#eae6dc]/45 px-2 py-4">No conversations yet. Add contacts in CRM.</li>
          )}
          {filteredConversations.map((c) => (
            <li key={c.contactId}>
              <button
                type="button"
                onClick={() => setSelectedId(c.contactId)}
                className={`w-full rounded-sm border px-3 py-2 text-left transition ${
                  selectedId === c.contactId
                    ? "border-[#c9a227] bg-[#c9a227]/10"
                    : "border-transparent hover:border-[#c9a227]/20"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-[#f8f4ec]">{c.contactName}</span>
                  <span className="text-[10px] text-[#eae6dc]/40">
                    {new Date(c.lastMessageAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-[#eae6dc]/55">{c.preview}</p>
                <div className="mt-1 flex gap-1">
                  {c.channels.map((ch) => (
                    <span
                      key={ch}
                      className="rounded bg-[#c9a227]/15 px-1.5 py-0.5 text-[10px] uppercase text-[#c9a227]"
                    >
                      {CHANNEL_LABEL[ch]}
                    </span>
                  ))}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="lg:col-span-5 xl:col-span-6 flex flex-col rounded-sm border border-[#c9a227]/15 bg-[#111]/80">
        {!selectedId ? (
          <div className="flex flex-1 items-center justify-center p-8 text-center text-[#eae6dc]/50">
            Select a conversation to view SMS, calls, and Meta messages in one thread.
          </div>
        ) : (
          <>
            <div className="border-b border-[#c9a227]/10 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-serif text-lg text-[#f8f4ec]">{contact?.name}</p>
                <p className="text-xs text-[#eae6dc]/50">{contact?.phone || "No phone"}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!contact?.phone || !twilioOk}
                  onClick={() => void handleCall()}
                  className="rounded-sm border border-[#c9a227]/40 px-3 py-1.5 text-xs font-semibold uppercase text-[#c9a227] disabled:opacity-40"
                >
                  Call
                </button>
              </div>
            </div>
            <ul className="flex-1 space-y-3 overflow-y-auto p-4 max-h-[45vh]">
              {messages.map((m) => (
                <li
                  key={m.id}
                  className={`max-w-[85%] rounded-sm px-3 py-2 text-sm ${
                    m.direction === "out"
                      ? "ml-auto bg-[#c9a227]/20 text-[#f8f4ec]"
                      : "mr-auto bg-black/40 text-[#eae6dc]/90"
                  }`}
                >
                  <p className="text-[10px] uppercase tracking-wide text-[#eae6dc]/45">
                    {CHANNEL_LABEL[m.channel]} · {m.status}
                  </p>
                  <p className="mt-1">{m.body}</p>
                  <p className="mt-1 text-[10px] text-[#eae6dc]/40">
                    {new Date(m.sentAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
            <form onSubmit={handleSend} className="border-t border-[#c9a227]/10 p-4 space-y-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setChannel("sms")}
                  className={`rounded-sm px-3 py-1 text-xs font-semibold uppercase ${
                    channel === "sms" ? "bg-[#c9a227] text-[#050505]" : "border border-[#c9a227]/25"
                  }`}
                >
                  SMS
                </button>
                <button
                  type="button"
                  disabled={!metaOk || !contact?.metaPsid}
                  onClick={() => setChannel("meta")}
                  className={`rounded-sm px-3 py-1 text-xs font-semibold uppercase disabled:opacity-40 ${
                    channel === "meta" ? "bg-[#c9a227] text-[#050505]" : "border border-[#c9a227]/25"
                  }`}
                >
                  Meta DM
                </button>
              </div>
              <textarea
                className={`${inputClass} min-h-[80px] resize-y`}
                value={compose}
                onChange={(e) => setCompose(e.target.value)}
                placeholder={
                  channel === "meta"
                    ? "Reply on Messenger / Instagram…"
                    : "Type SMS (business prefix added automatically)…"
                }
                required
              />
              {error && <p className="text-sm text-red-300">{error}</p>}
              <button
                type="submit"
                disabled={sending || (channel === "sms" && !twilioOk)}
                className="w-full rounded-sm bg-[#c9a227] py-2.5 text-sm font-semibold uppercase text-[#050505] disabled:opacity-40"
              >
                {sending ? "Sending…" : "Send"}
              </button>
            </form>
          </>
        )}
      </section>

      <aside className="lg:col-span-3 space-y-4 rounded-sm border border-[#c9a227]/15 bg-[#111]/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#c9a227]/80">Contact</p>
        {contact ? (
          <>
            <p className="text-[#f8f4ec]">{contact.name}</p>
            <p className="text-sm text-[#eae6dc]/60">{contact.email || "—"}</p>
            <label className="block text-xs text-[#eae6dc]/45">Pipeline stage</label>
            <select
              className={inputClass}
              value={contact.stage}
              onChange={(e) => void updateStage(e.target.value as PipelineStage)}
            >
              {PIPELINE_STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-[#eae6dc]/45 whitespace-pre-wrap">{contact.notes || "No notes"}</p>
            {contact.metaPsid ? (
              <p className="text-xs text-emerald-300/80">Meta linked</p>
            ) : (
              <p className="text-xs text-[#eae6dc]/45">Meta: waiting for inbound DM</p>
            )}
          </>
        ) : (
          <p className="text-sm text-[#eae6dc]/45">Select a conversation.</p>
        )}
        <div className="border-t border-[#c9a227]/10 pt-3 text-xs text-[#eae6dc]/45 space-y-1">
          <p>Twilio SMS/Calls: {twilioOk ? "Connected" : "Not configured"}</p>
          <p>Meta DMs: {metaOk ? "Connected" : "Connect in Integrations"}</p>
        </div>
      </aside>
    </div>
  );
}
