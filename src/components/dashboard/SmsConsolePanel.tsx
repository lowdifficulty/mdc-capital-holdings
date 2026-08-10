"use client";

import { useCallback, useEffect, useState } from "react";

type ContactKind = "lead" | "client";

interface SmsContact {
  id: string;
  name: string;
  phone: string;
  kind: ContactKind;
  notes: string;
}

interface SmsMessageRecord {
  id: string;
  to: string;
  body: string;
  status: string;
  error: string | null;
  sentAt: string;
}

export default function SmsConsolePanel() {
  const [contacts, setContacts] = useState<SmsContact[]>([]);
  const [messages, setMessages] = useState<SmsMessageRecord[]>([]);
  const [filter, setFilter] = useState<"all" | ContactKind>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toPhone, setToPhone] = useState("");
  const [message, setMessage] = useState("");
  const [twilioOk, setTwilioOk] = useState<boolean | null>(null);
  const [fromNumber, setFromNumber] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sending, setSending] = useState(false);

  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newKind, setNewKind] = useState<ContactKind>("lead");
  const [newNotes, setNewNotes] = useState("");

  const load = useCallback(async () => {
    const kindQuery = filter === "all" ? "" : `?kind=${filter}`;
    const [contactsRes, messagesRes, statusRes] = await Promise.all([
      fetch(`/api/sms/contacts${kindQuery}`),
      fetch("/api/sms/messages"),
      fetch("/api/sms/status"),
    ]);

    if (contactsRes.ok) {
      const data = await contactsRes.json();
      setContacts(data.contacts ?? []);
      if (data.twilioHint) setHint(data.twilioHint);
      if (Array.isArray(data.missing)) setMissing(data.missing);
    }
    if (messagesRes.ok) {
      const data = await messagesRes.json();
      setMessages(data.messages ?? []);
    }
    if (statusRes.ok) {
      const data = await statusRes.json();
      setTwilioOk(data.configured);
      setFromNumber(data.fromNumber);
      if (data.hint) setHint(data.hint);
      if (Array.isArray(data.missing)) setMissing(data.missing);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  function selectContact(c: SmsContact) {
    setSelectedId(c.id);
    setToPhone(c.phone);
  }

  async function handleAddContact(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/sms/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName,
        phone: newPhone,
        kind: newKind,
        notes: newNotes,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not add contact");
      return;
    }
    setNewName("");
    setNewPhone("");
    setNewNotes("");
    await load();
    if (data.contact) selectContact(data.contact);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/sms/contacts?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (selectedId === id) {
      setSelectedId(null);
      setToPhone("");
    }
    await load();
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: toPhone,
          message,
          contactId: selectedId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Send failed");
        if (data.hint) setHint(data.hint);
        else if (data.error) setHint(null);
        await load();
        return;
      }
      setSuccess(`Message queued (${data.result?.status ?? "sent"}).`);
      setMessage("");
      await load();
    } catch {
      setError("Network error.");
    } finally {
      setSending(false);
    }
  }

  const inputClass =
    "w-full rounded-sm border border-[#c9a227]/20 bg-black/30 px-3 py-2 text-sm text-[#eae6dc] outline-none focus:border-[#c9a227]";

  return (
    <div className="space-y-8">
      {twilioOk === false && (
        <div className="rounded-sm border border-amber-500/40 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
          <p className="font-semibold">Twilio not connected</p>
          <p className="mt-1 text-amber-100/80">{hint}</p>
          {missing.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-amber-100/90">
              {missing.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {twilioOk && fromNumber && (
        <p className="text-sm text-[#eae6dc]/60">
          Sending from <span className="text-[#c9a227]">{fromNumber}</span> · A2P approval required
          for US marketing SMS.
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-sm border border-[#c9a227]/15 bg-[#111]/80 p-4">
            <div className="flex flex-wrap gap-2">
              {(["all", "lead", "client"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`rounded-sm px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                    filter === f
                      ? "bg-[#c9a227] text-[#050505]"
                      : "border border-[#c9a227]/25 text-[#eae6dc]/70"
                  }`}
                >
                  {f === "all" ? "All" : f + "s"}
                </button>
              ))}
            </div>
            <ul className="mt-4 max-h-72 space-y-2 overflow-y-auto">
              {contacts.length === 0 && (
                <li className="text-sm text-[#eae6dc]/45">No contacts yet.</li>
              )}
              {contacts.map((c) => (
                <li
                  key={c.id}
                  className={`flex items-start gap-2 rounded-sm border px-3 py-2 ${
                    selectedId === c.id
                      ? "border-[#c9a227] bg-[#c9a227]/10"
                      : "border-[#c9a227]/15"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => selectContact(c)}
                    className="min-w-0 flex-1 text-left text-sm"
                  >
                    <span className="font-medium text-[#f8f4ec]">{c.name}</span>
                    <span className="mt-0.5 block text-xs text-[#eae6dc]/50">
                      {c.kind} · {c.phone}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(c.id)}
                    className="shrink-0 text-xs text-red-300/80 hover:text-red-300"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <form
            onSubmit={handleAddContact}
            className="rounded-sm border border-[#c9a227]/15 bg-[#111]/80 p-4 space-y-3"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-[#c9a227]/80">
              Add lead or client
            </p>
            <input
              className={inputClass}
              placeholder="Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
            <input
              className={inputClass}
              placeholder="Phone"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              required
            />
            <select
              className={inputClass}
              value={newKind}
              onChange={(e) => setNewKind(e.target.value as ContactKind)}
            >
              <option value="lead">Lead</option>
              <option value="client">Client</option>
            </select>
            <textarea
              className={`${inputClass} resize-y`}
              rows={2}
              placeholder="Notes (optional)"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
            />
            <button
              type="submit"
              className="w-full rounded-sm border border-[#c9a227]/40 py-2 text-sm font-semibold uppercase tracking-wide text-[#c9a227] hover:bg-[#c9a227]/10"
            >
              Save contact
            </button>
          </form>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <form
            onSubmit={handleSend}
            className="rounded-sm border border-[#c9a227]/15 bg-[#111]/80 p-4 space-y-3"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-[#c9a227]/80">
              Send SMS
            </p>
            <input
              className={inputClass}
              placeholder="To (E.164 or US 10-digit)"
              value={toPhone}
              onChange={(e) => setToPhone(e.target.value)}
              required
            />
            <textarea
              className={`${inputClass} resize-y min-h-[120px]`}
              placeholder="Message (business name prefix added if missing)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
            <p className="text-xs text-[#eae6dc]/45">
              Only text contacts who opted in. Reply STOP / HELP language required for A2P
              campaigns.
            </p>
            {error && <p className="text-sm text-red-300">{error}</p>}
            {error && hint && (
              <p className="text-sm text-amber-200/90">{hint}</p>
            )}
            {success && <p className="text-sm text-emerald-300">{success}</p>}
            <button
              type="submit"
              disabled={sending || twilioOk === false}
              className="w-full rounded-sm bg-[#c9a227] py-3 text-sm font-semibold uppercase tracking-wide text-[#050505] disabled:opacity-40"
            >
              {sending ? "Sending…" : "Send text"}
            </button>
          </form>

          <div className="rounded-sm border border-[#c9a227]/15 bg-[#111]/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#c9a227]/80">
              Recent messages
            </p>
            <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm">
              {messages.length === 0 && (
                <li className="text-[#eae6dc]/45">No messages sent yet.</li>
              )}
              {messages.map((m) => (
                <li
                  key={m.id}
                  className="rounded-sm border border-[#c9a227]/10 px-3 py-2 text-[#eae6dc]/75"
                >
                  <div className="flex justify-between gap-2 text-xs text-[#eae6dc]/45">
                    <span>{m.to}</span>
                    <span>{new Date(m.sentAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-1 text-[#eae6dc]/85">{m.body}</p>
                  <p className="mt-1 text-xs">
                    {m.status}
                    {m.error ? ` · ${m.error}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
