"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { portalBtnPrimary, portalCard } from "@/components/platform/portal-ui";

export default function IntegrationsPanel() {
  const searchParams = useSearchParams();
  const [twilio, setTwilio] = useState<{ configured: boolean; fromNumber: string | null; missing: string[] }>({
    configured: false,
    fromNumber: null,
    missing: [],
  });
  const [meta, setMeta] = useState<{
    configured: boolean;
    connected: boolean;
    pageName: string | null;
    appId: string | null;
    webhookPath: string;
  }>({
    configured: false,
    connected: false,
    pageName: null,
    appId: null,
    webhookPath: "/api/meta/webhook",
  });
  const [connecting, setConnecting] = useState(false);
  const [banner, setBanner] = useState("");

  const load = useCallback(async () => {
    const [twilioRes, metaRes] = await Promise.all([fetch("/api/sms/status"), fetch("/api/meta/status")]);
    if (twilioRes.ok) {
      const data = await twilioRes.json();
      setTwilio({
        configured: data.configured,
        fromNumber: data.fromNumber,
        missing: data.missing ?? [],
      });
    }
    if (metaRes.ok) {
      const data = await metaRes.json();
      setMeta({
        configured: data.configured,
        connected: data.connected,
        pageName: data.pageName,
        appId: data.appId,
        webhookPath: data.webhookPath,
      });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const flag = searchParams.get("meta");
    if (flag === "connected") setBanner("Meta connected successfully.");
    if (flag === "error") setBanner("Meta connection failed. Check app credentials and try again.");
    if (flag === "no_page") setBanner("No Facebook Page found on this Meta account.");
  }, [searchParams]);

  async function connectMeta() {
    setConnecting(true);
    setBanner("");
    try {
      const res = await fetch("/api/meta/status", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setBanner(data.error ?? "Could not start Meta OAuth");
        return;
      }
      window.location.href = data.url as string;
    } finally {
      setConnecting(false);
    }
  }

  const appUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "https://mdccapitalholdings.com";

  return (
    <div className="space-y-6">
      {banner && (
        <p className="rounded-xl border border-mdc-blue/20 bg-soft-blue px-4 py-3 text-sm text-navy">
          {banner}
        </p>
      )}

      <section className={`${portalCard} space-y-3`}>
        <h2 className="font-serif text-lg text-navy">Twilio · SMS &amp; voice</h2>
        <p className="text-sm text-slate">
          Powers outbound SMS and click-to-call from Inbox and Calls.
        </p>
        <p className="text-sm">
          Status:{" "}
          <span className={twilio.configured ? "text-emerald-700 font-medium" : "text-amber-700"}>
            {twilio.configured ? "Connected" : "Not configured"}
          </span>
        </p>
        {twilio.fromNumber && (
          <p className="text-sm text-[#eae6dc]/70">From number: {twilio.fromNumber}</p>
        )}
        {twilio.missing.length > 0 && (
          <ul className="list-disc pl-5 text-sm text-amber-100/90">
            {twilio.missing.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        )}
      </section>

      <section className={`${portalCard} space-y-4`}>
        <h2 className="font-serif text-lg text-navy">Meta · Messenger &amp; Instagram DMs</h2>
        <p className="text-sm text-slate">
          Connect your Facebook Page to receive and reply to DMs in the unified Inbox alongside SMS and
          calls.
        </p>
        <p className="text-sm">
          Status:{" "}
          <span className={meta.connected ? "text-emerald-700 font-medium" : "text-amber-700"}>
            {meta.connected ? `Connected · ${meta.pageName}` : "Not connected"}
          </span>
        </p>
        {!meta.configured && (
          <p className="text-sm text-amber-200">
            Add <code className="text-[#c9a227]">META_APP_ID</code>,{" "}
            <code className="text-[#c9a227]">META_APP_SECRET</code>, and{" "}
            <code className="text-[#c9a227]">META_WEBHOOK_VERIFY_TOKEN</code> in Vercel, then redeploy.
          </p>
        )}
        <button
          type="button"
          disabled={!meta.configured || connecting}
          onClick={() => void connectMeta()}
          className={`${portalBtnPrimary} !bg-[#1877f2] hover:!bg-[#166fe5]`}
        >
          {connecting ? "Redirecting…" : "Connect Meta"}
        </button>
        <div className="rounded-xl bg-slate-50 p-4 text-xs text-slate space-y-2">
          <p className="font-semibold text-[#eae6dc]/75">Webhook setup (Meta Developer App)</p>
          <p>Callback URL: {appUrl}{meta.webhookPath}</p>
          <p>Verify token: same as META_WEBHOOK_VERIFY_TOKEN env var</p>
          <p>Subscribe to: messages, messaging_postbacks (Page + Instagram)</p>
          <p>OAuth redirect: {appUrl}/api/meta/oauth/callback</p>
        </div>
      </section>
    </div>
  );
}
