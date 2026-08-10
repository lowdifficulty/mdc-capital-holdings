"use client";

import { useCallback, useEffect, useState } from "react";

interface CallLog {
  id: string;
  to: string;
  from: string;
  status: string;
  startedAt: string;
  twilioSid: string | null;
  error: string | null;
}

interface Contact {
  id: string;
  name: string;
  phone: string;
}

export default function CallsPanel() {
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactId, setContactId] = useState("");
  const [dialTo, setDialTo] = useState("");
  const [error, setError] = useState("");
  const [calling, setCalling] = useState(false);
  const [twilioOk, setTwilioOk] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    const [callsRes, crmRes, statusRes] = await Promise.all([
      fetch("/api/calls"),
      fetch("/api/crm/contacts"),
      fetch("/api/sms/status"),
    ]);
    if (callsRes.ok) {
      const data = await callsRes.json();
      setCalls(data.calls ?? []);
    }
    if (crmRes.ok) {
      const data = await crmRes.json();
      setContacts(data.contacts ?? []);
    }
    if (statusRes.ok) {
      const data = await statusRes.json();
      setTwilioOk(data.configured);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCall(e: React.FormEvent) {
    e.preventDefault();
    setCalling(true);
    setError("");
    try {
      const res = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: contactId || undefined,
          to: dialTo || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Call failed");
        return;
      }
      setDialTo("");
      await load();
    } finally {
      setCalling(false);
    }
  }

  const inputClass =
    "w-full rounded-sm border border-[#c9a227]/20 bg-black/30 px-3 py-2 text-sm text-[#eae6dc] outline-none focus:border-[#c9a227]";

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-4 rounded-sm border border-[#c9a227]/15 bg-[#111]/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#c9a227]/80">Dialer</p>
        {twilioOk === false && (
          <p className="text-sm text-amber-200">Configure Twilio env vars to place calls.</p>
        )}
        <p className="text-xs text-[#eae6dc]/50">
          Optional: set <code className="text-[#c9a227]">TWILIO_BRIDGE_PHONE</code> to your mobile — we call
          you first, then bridge to the contact (GoHighLevel-style click-to-call).
        </p>
        <form onSubmit={handleCall} className="space-y-3">
          <select
            className={inputClass}
            value={contactId}
            onChange={(e) => {
              setContactId(e.target.value);
              const c = contacts.find((x) => x.id === e.target.value);
              if (c?.phone) setDialTo(c.phone);
            }}
          >
            <option value="">Select CRM contact</option>
            {contacts
              .filter((c) => c.phone)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.phone}
                </option>
              ))}
          </select>
          <input
            className={inputClass}
            placeholder="Or enter number (E.164)"
            value={dialTo}
            onChange={(e) => setDialTo(e.target.value)}
          />
          {error && <p className="text-sm text-red-300">{error}</p>}
          <button
            type="submit"
            disabled={calling || twilioOk === false}
            className="w-full rounded-sm bg-[#c9a227] py-3 text-sm font-semibold uppercase text-[#050505] disabled:opacity-40"
          >
            {calling ? "Calling…" : "Start call"}
          </button>
        </form>
      </div>

      <div className="rounded-sm border border-[#c9a227]/15 bg-[#111]/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#c9a227]/80">Call log</p>
        <ul className="mt-3 max-h-[420px] space-y-2 overflow-y-auto text-sm">
          {calls.length === 0 && <li className="text-[#eae6dc]/45">No calls yet.</li>}
          {calls.map((c) => (
            <li key={c.id} className="rounded-sm border border-[#c9a227]/10 px-3 py-2">
              <div className="flex justify-between text-xs text-[#eae6dc]/45">
                <span>{c.to}</span>
                <span>{new Date(c.startedAt).toLocaleString()}</span>
              </div>
              <p className="mt-1 text-[#eae6dc]/80">
                {c.status}
                {c.error ? ` · ${c.error}` : ""}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
