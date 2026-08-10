export const PORTAL_DIALER_EVENT = "mdc-portal-dialer-open";

export type PortalDialerTab = "call" | "sms";

export interface PortalDialerDetail {
  tab?: PortalDialerTab;
  contactId?: string;
  phone?: string;
  name?: string;
  message?: string;
}

export function openPortalDialer(detail: PortalDialerDetail = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PORTAL_DIALER_EVENT, { detail }));
}
