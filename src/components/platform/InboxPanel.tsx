"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import QuickContactActions from "@/components/platform/QuickContactActions";
import { openPortalDialer } from "@/lib/platform/portal-dialer";
import {
  portalBtnCall,
  portalBtnPrimary,
  portalBtnSms,
  portalCard,
  portalInput,
} from "@/components/platform/portal-ui";
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

  function openSmsComposer() {
    if (!selectedId || !contact) return;
    openPortalDialer({
      tab: "sms",
      contactId: selectedId,
      phone: contact.phone,
      name: contact.name,
    });
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

  const filterActive = "rounded-full bg-mdc-blue px-3 py-1 text-xs font-semibold text-white";
  const filterIdle =
    "rounded-full border border-navy/15 px-3 py-1 text-xs font-semibold text-slate hover:border-mdc-blue/40";

  return (
    <div className="grid min-h-[70vh] gap-4 lg:grid-cols-12">
      <aside className={`lg:col-span-4 xl:col-span-3 space-y-3 ${portalCard}`}>
        <input
          className={portalInput}
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
              className={filter === f ? filterActive : filterIdle}
            >
              {f === "all" ? "All" : CHANNEL_LABEL[f]}
            </button>
          ))}
        </div>
        <ul className="max-h-[60vh] space-y-2 overflow-y-auto">
          {filteredConversations.length === 0 && (
            <li className="text-sm text-slate px-2 py-4">No conversations yet. Add contacts in CRM.</li>
          )}
          {filteredConversations.map((c) => (
            <li key={c.contactId}>
              <div
                className={`rounded-xl border px-3 py-2 transition ${
                  selectedId === c.contactId
                    ? "border-mdc-blue/40 bg-soft-blue"
                    : "border-navy/10 hover:border-mdc-blue/25"
                }`}
              >
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedId(c.contactId)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-navy">{c.contactName}</span>
                      <span className="text-[10px] text-slate">
                        {new Date(c.lastMessageAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate">{c.preview}</p>
                  </button>
                  <QuickContactActions
                    size="sm"
                    contactId={c.contactId}
                    phone={c.phone}
                    name={c.contactName}
                    disabledCall={!twilioOk}
                    disabledSms={!twilioOk}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </aside>

      <section className={`lg:col-span-5 xl:col-span-6 flex flex-col ${portalCard} !p-0 overflow-hidden`}>
        {!selectedId ? (
          <div className="flex flex-1 items-center justify-center p-8 text-center text-slate">
            Select a conversation — or use{" "}
            <strong className="text-navy">Click to call</strong> / <strong className="text-navy">Text</strong>{" "}
            in the header.
          </div>
        ) : (
          <>
            <div className="border-b border-navy/10 px-4 py-3 flex flex-wrap items-center justify-between gap-2 bg-soft-blue/50">
              <div>
                <p className="font-serif text-lg text-navy">{contact?.name}</p>
                <p className="text-xs text-slate">{contact?.phone || "No phone"}</p>
              </div>
              <QuickContactActions
                contactId={selectedId}
                phone={contact?.phone}
                name={contact?.name}
                disabledCall={!twilioOk || !contact?.phone}
                disabledSms={!twilioOk}
              />
            </div>
            <ul className="flex-1 space-y-3 overflow-y-auto p-4 max-h-[45vh]">
              {messages.map((m) => (
                <li
                  key={m.id}
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                    m.direction === "out"
                      ? "ml-auto bg-mdc-blue/15 text-navy"
                      : "mr-auto bg-slate-100 text-dark-text"
                  }`}
                >
                  <p className="text-[10px] uppercase tracking-wide text-slate">
                    {CHANNEL_LABEL[m.channel]} · {m.status}
                  </p>
                  <p className="mt-1">{m.body}</p>
                  <p className="mt-1 text-[10px] text-slate">
                    {new Date(m.sentAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
            <form onSubmit={handleSend} className="border-t border-navy/10 p-4 space-y-2 bg-white">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setChannel("sms")}
                  className={channel === "sms" ? portalBtnSms : "rounded-full border border-navy/15 px-4 py-2 text-xs font-bold uppercase text-navy"}
                >
                  SMS
                </button>
                <button
                  type="button"
                  disabled={!metaOk || !contact?.metaPsid}
                  onClick={() => setChannel("meta")}
                  className={`rounded-full px-4 py-2 text-xs font-bold uppercase ${channel === "meta" ? "bg-navy text-white" : "border border-navy/15 text-navy"} disabled:opacity-40`}
                >
                  Meta DM
                </button>
                <button type="button" onClick={openSmsComposer} className={portalBtnCall}>
                  Pop-out text
                </button>
              </div>
              <textarea
                className={`${portalInput} min-h-[80px] resize-y`}
                value={compose}
                onChange={(e) => setCompose(e.target.value)}
                placeholder={
                  channel === "meta"
                    ? "Reply on Messenger / Instagram…"
                    : "Type SMS (business prefix added automatically)…"
                }
                required
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={sending || (channel === "sms" && !twilioOk)}
                className={`${portalBtnPrimary} w-full justify-center`}
              >
                {sending ? "Sending…" : "Send"}
              </button>
            </form>
          </>
        )}
      </section>

      <aside className={`lg:col-span-3 space-y-4 ${portalCard}`}>
        <p className="text-xs font-semibold uppercase tracking-wide text-mdc-blue">Contact</p>
        {contact ? (
          <>
            <p className="font-serif text-navy">{contact.name}</p>
            <p className="text-sm text-slate">{contact.email || "—"}</p>
            <label className="block text-xs text-slate">Pipeline stage</label>
            <select
              className={portalInput}
              value={contact.stage}
              onChange={(e) => void updateStage(e.target.value as PipelineStage)}
            >
              {PIPELINE_STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate whitespace-pre-wrap">{contact.notes || "No notes"}</p>
            <QuickContactActions
              contactId={contact.id}
              phone={contact.phone}
              name={contact.name}
              disabledCall={!twilioOk}
              disabledSms={!twilioOk}
            />
          </>
        ) : (
          <p className="text-sm text-slate">Select a conversation.</p>
        )}
        <div className="border-t border-navy/10 pt-3 text-xs text-slate space-y-1">
          <p>Twilio SMS/Calls: {twilioOk ? "Connected" : "Not configured"}</p>
          <p>Meta DMs: {metaOk ? "Connected" : "Connect in Integrations"}</p>
        </div>
      </aside>
    </div>
  );
}
