"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV: { href: string; label: string; exact?: boolean }[] = [
  { href: "/intelligence", label: "Dashboard", exact: true },
  { href: "/intelligence/scanner", label: "Scanner" },
  { href: "/intelligence/watchlist", label: "Watchlist" },
  { href: "/intelligence/settings", label: "Settings" },
  { href: "/dashboard", label: "Sentiment" },
];

export default function IntelligenceShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-navy text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-navy/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-9 w-9 items-center justify-center rounded-md bg-mdc-blue text-xs font-bold"
            >
              MDC
            </Link>
            <div>
              <p className="text-sm font-semibold">{title}</p>
              {subtitle && <p className="text-xs text-white/50">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="text-sm text-white/60 hover:text-white"
          >
            Sign out
          </button>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-6 pb-3 lg:px-8">
          {NAV.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-mdc-blue text-white"
                    : "border border-white/15 text-white/70 hover:border-white/30"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">{children}</div>
    </div>
  );
}
