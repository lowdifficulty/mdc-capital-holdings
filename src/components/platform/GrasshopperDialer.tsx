"use client";

import { useCallback, useEffect, useState } from "react";
import {
  PORTAL_DIALER_EVENT,
  type PortalDialerDetail,
  type PortalDialerTab,
} from "@/lib/platform/portal-dialer";
import { portalBtnPrimary, portalInput } from "@/components/platform/portal-ui";

interface ContactOption {
  id: string;
  name: string;
  phone: string;
}

export default function GrasshopperDialer() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<PortalDialerTab>("call");
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [contactId, setContactId] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [twilioOk, setTwilioOk] = useState(true);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const loadContacts = useCallback(async () => {
    const [crmRes, statusRes] = await Promise.all([
      fetch("/api/crm/contacts"),
      fetch("/api/sms/status"),
    ]);
    if (crmRes.ok) {
      const data = await crmRes.json();
      setContacts(
        (data.contacts ?? []).map((c: ContactOption) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
        })),
      );
    }
    if (statusRes.ok) {
      const data = await statusRes.json();
      setTwilioOk(Boolean(data.configured));
    }
  }, []);

  useEffect(() => {
    void loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    function onOpen(e: Event) {
      const detail = (e as CustomEvent<PortalDialerDetail>).detail ?? {};
      setOpen(true);
      if (detail.tab) setTab(detail.tab);
      if (detail.contactId) setContactId(detail.contactId);
      if (detail.phone) setPhone(detail.phone);
      if (detail.name) setName(detail.name);
      if (detail.message) setMessage(detail.message);
      void loadContacts();
    }
    window.addEventListener(PORTAL_DIALER_EVENT, onOpen);
    return () => window.removeEventListener(PORTAL_DIALER_EVENT, onOpen);
  }, [loadContacts]);

  function pickContact(id: string) {
    setContactId(id);
    const c = contacts.find((x) => x.id === id);
    if (c) {
      setName(c.name);
      if (c.phone) setPhone(c.phone);
    }
  }

  async function handleCall() {
    setBusy(true);
    setError("");
    setFeedback("");
    try {
      const res = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: contactId || undefined, to: phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Call failed");
        return;
      }
      setFeedback("Calling — answer your phone if bridge is enabled.");
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function handleSms(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setFeedback("");
    try {
      const res = await fetch("/api/inbox/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: contactId || undefined,
          channel: "sms",
          to: phone,
          message,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Send failed");
        return;
      }
      setFeedback("Text queued.");
      setMessage("");
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-3">
      {open && (
        <div
          className="w-[min(100vw-2rem,360px)] overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-2xl shadow-navy/20"
          role="dialog"
          aria-label="Click to call and text"
        >
          <div className="flex items-center justify-between bg-navy px-4 py-3 text-white">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
                MDC Phone
              </p>
              <p className="font-serif text-base">Quick connect</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-2 text-white/80 hover:bg-white/10"
              aria-label="Minimize"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex border-b border-slate-200">
            {(["call", "sms"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex-1 py-3 text-sm font-semibold ${
                  tab === t ? "border-b-2 border-mdc-blue text-mdc-blue" : "text-slate"
                }`}
              >
                {t === "call" ? "Call" : "Text"}
              </button>
            ))}
          </div>

          <div className="space-y-3 p-4">
            {!twilioOk && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                Twilio not configured — add keys in Integrations.
              </p>
            )}

            <select
              className={portalInput}
              value={contactId}
              onChange={(e) => pickContact(e.target.value)}
            >
              <option value="">Choose contact…</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `· ${c.phone}` : ""}
                </option>
              ))}
            </select>

            <input
              className={portalInput}
              placeholder="Name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className={portalInput}
              placeholder="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            {tab === "call" ? (
              <button
                type="button"
                disabled={busy || !twilioOk || !phone}
                onClick={() => void handleCall()}
                className={`${portalBtnPrimary} w-full !bg-emerald-600 !shadow-emerald-600/30 hover:!bg-emerald-700`}
              >
                {busy ? "Connecting…" : "Click to call"}
              </button>
            ) : (
              <form onSubmit={handleSms} className="space-y-3">
                <textarea
                  className={`${portalInput} min-h-[88px] resize-y`}
                  placeholder="Your message…"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  disabled={busy || !twilioOk || !phone}
                  className={`${portalBtnPrimary} w-full`}
                >
                  {busy ? "Sending…" : "Send text"}
                </button>
              </form>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}
            {feedback && <p className="text-sm text-emerald-700">{feedback}</p>}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) void loadContacts();
        }}
        className="group flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xl shadow-emerald-700/40 ring-4 ring-white transition hover:scale-105 hover:bg-emerald-700"
        aria-label={open ? "Close phone panel" : "Open click to call"}
      >
        {open ? (
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 15l-6-6-6 6" />
          </svg>
        ) : (
          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
          </svg>
        )}
      </button>
    </div>
  );
}
