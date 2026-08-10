"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { companyLegal } from "@/data/site";
import GrasshopperDialer from "@/components/platform/GrasshopperDialer";
import { openPortalDialer } from "@/lib/platform/portal-dialer";
import {
  portalBtnCall,
  portalBtnSms,
  portalNavActive,
  portalNavIdle,
} from "@/components/platform/portal-ui";

const OPS_NAV: { href: string; label: string; exact?: boolean }[] = [
  { href: "/dashboard", label: "Inbox", exact: true },
  { href: "/dashboard/crm", label: "CRM" },
  { href: "/dashboard/calls", label: "Calls" },
  { href: "/dashboard/integrations", label: "Integrations" },
];

export default function OperationsShell({
  children,
  title = "Client portal",
  subtitle,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  return (
    <div className="site-a2p min-h-screen bg-light-gray text-dark-text">
      <header className="a2p-hero relative overflow-hidden bg-navy text-white shadow-lg">
        <div className="pointer-events-none absolute inset-0 hero-noise" aria-hidden />
        <div className="pointer-events-none absolute inset-0 hero-blue-glow" aria-hidden />

        <div className="relative mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href="/"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mdc-blue text-xs font-bold text-white shadow-md"
              >
                MDC
              </Link>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/70">
                  {companyLegal.name}
                </p>
                <p className="truncate font-serif text-lg text-white sm:text-xl">{title}</p>
                {subtitle && (
                  <p className="hidden truncate text-xs text-white/65 sm:block">{subtitle}</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => openPortalDialer({ tab: "sms" })}
                className={`${portalBtnSms} !py-2.5`}
              >
                Text
              </button>
              <button
                type="button"
                onClick={() => openPortalDialer({ tab: "call" })}
                className={`${portalBtnCall} !py-2.5`}
              >
                Click to call
              </button>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="rounded-full border border-white/30 px-4 py-2.5 text-sm font-medium text-white/90 transition hover:bg-white/10"
              >
                Sign out
              </button>
            </div>
          </div>

          <nav className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {OPS_NAV.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={active ? portalNavActive : portalNavIdle}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 lg:px-8">{children}</div>

      <GrasshopperDialer />
    </div>
  );
}
