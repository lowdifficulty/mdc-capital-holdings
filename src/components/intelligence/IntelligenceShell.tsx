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
    <div className="dashboard-wayne relative min-h-screen text-[#eae6dc]">
      <div className="pointer-events-none fixed inset-0 dashboard-wayne-texture" aria-hidden />
      <div className="pointer-events-none fixed inset-0 dashboard-wayne-gold-wash" aria-hidden />

      <header className="sticky top-0 z-20 border-b border-[#c9a227]/15 bg-[#050505]/95 backdrop-blur-md">
        <div className="relative z-10 mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-9 w-9 items-center justify-center rounded-sm bg-[#c9a227] text-xs font-bold text-[#050505]"
            >
              MDC
            </Link>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#c9a227]/80">
                Intelligence
              </p>
              <p className="text-sm font-serif text-[#f8f4ec]">{title}</p>
              {subtitle && <p className="text-xs text-[#eae6dc]/45">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="rounded-sm border border-[#c9a227]/35 px-3 py-1.5 text-sm uppercase tracking-wide text-[#eae6dc]/70 transition-colors hover:border-[#c9a227] hover:text-[#c9a227]"
          >
            Sign out
          </button>
        </div>
        <nav className="relative z-10 mx-auto flex max-w-7xl gap-2 overflow-x-auto px-6 pb-3 lg:px-8">
          {NAV.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-sm px-4 py-1.5 text-sm font-medium uppercase tracking-wide transition ${
                  active
                    ? "bg-[#c9a227] text-[#050505]"
                    : "border border-[#c9a227]/20 text-[#eae6dc]/65 hover:border-[#c9a227]/40 hover:text-[#c9a227]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-8 lg:px-8">{children}</div>
    </div>
  );
}
