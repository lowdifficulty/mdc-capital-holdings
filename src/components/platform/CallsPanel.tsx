"use client";

import { useCallback, useEffect, useState } from "react";
import { openPortalDialer } from "@/lib/platform/portal-dialer";
import { portalBtnCall, portalBtnPrimary, portalCard, portalInput } from "@/components/platform/portal-ui";

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

  const inputClass = portalInput;

  return (
    <div className="space-y-4">
      <div className={`${portalCard} flex flex-wrap items-center justify-between gap-3`}>
        <p className="text-sm text-slate">
          Use the green <strong className="text-navy">phone button</strong> (bottom-right) for a Grasshopper-style
          pop-out, or dial below.
        </p>
        <button type="button" onClick={() => openPortalDialer({ tab: "call" })} className={portalBtnCall}>
          Open click-to-call
        </button>
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-4 rounded-2xl border border-navy/10 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-mdc-blue">Dialer</p>
        {twilioOk === false && (
          <p className="text-sm text-amber-800">Configure Twilio env vars to place calls.</p>
        )}
        <p className="text-xs text-slate">
          Optional: set <code className="text-mdc-blue">TWILIO_BRIDGE_PHONE</code> to your mobile — we call
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
            className={`${portalBtnPrimary} w-full justify-center !bg-emerald-600 !shadow-emerald-600/30 hover:!bg-emerald-700`}
          >
            {calling ? "Calling…" : "Start call"}
          </button>
        </form>
      </div>

      <div className={`${portalCard}`}>
        <p className="text-xs font-semibold uppercase tracking-wide text-mdc-blue">Call log</p>
        <ul className="mt-3 max-h-[420px] space-y-2 overflow-y-auto text-sm">
          {calls.length === 0 && <li className="text-slate">No calls yet.</li>}
          {calls.map((c) => (
            <li key={c.id} className="rounded-xl border border-navy/10 px-3 py-2">
              <div className="flex justify-between text-xs text-slate">
                <span>{c.to}</span>
                <span>{new Date(c.startedAt).toLocaleString()}</span>
              </div>
              <p className="mt-1 text-dark-text">
                {c.status}
                {c.error ? ` · ${c.error}` : ""}
              </p>
            </li>
          ))}
        </ul>
      </div>
      </div>
    </div>
  );
}
