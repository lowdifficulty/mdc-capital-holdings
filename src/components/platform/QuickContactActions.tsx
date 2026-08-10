"use client";

import { portalBtnCall, portalBtnSms } from "@/components/platform/portal-ui";
import { openPortalDialer } from "@/lib/platform/portal-dialer";

export default function QuickContactActions({
  contactId,
  phone,
  name,
  disabledCall,
  disabledSms,
  size = "md",
}: {
  contactId?: string;
  phone?: string;
  name?: string;
  disabledCall?: boolean;
  disabledSms?: boolean;
  size?: "sm" | "md";
}) {
  const pad = size === "sm" ? "px-3 py-1.5 text-[10px]" : "";

  return (
    <div className="flex shrink-0 gap-1.5" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <button
        type="button"
        disabled={disabledCall || !phone}
        title="Click to call"
        className={`${portalBtnCall} ${pad}`}
        onClick={() =>
          openPortalDialer({ tab: "call", contactId, phone, name })
        }
      >
        <PhoneIcon />
        Call
      </button>
      <button
        type="button"
        disabled={disabledSms}
        title="Send SMS"
        className={`${portalBtnSms} ${pad}`}
        onClick={() =>
          openPortalDialer({ tab: "sms", contactId, phone, name })
        }
      >
        <SmsIcon />
        Text
      </button>
    </div>
  );
}

function PhoneIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
    </svg>
  );
}

function SmsIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z" />
    </svg>
  );
}
