"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "@/components/dashboard/ThemeToggle";

const OPS_NAV: { href: string; label: string; exact?: boolean }[] = [
  { href: "/dashboard", label: "Operations", exact: true },
  { href: "/dashboard/projects", label: "Projects" },
  { href: "/intelligence", label: "Intelligence" },
];

export default function OperationsShell({
  children,
  title = "Operations Dashboard",
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
    <div className="dashboard-wayne relative min-h-screen text-[#eae6dc]">
      <div className="pointer-events-none fixed inset-0 dashboard-wayne-texture" aria-hidden />
      <div className="pointer-events-none fixed inset-0 dashboard-wayne-gold-wash" aria-hidden />

      <header className="sticky top-0 z-[60] border-b border-[#c9a227]/15 bg-[#050505]/95 backdrop-blur-md">
        <div className="relative z-10 mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-[#c9a227] text-xs font-bold text-[#050505]"
            >
              MDC
            </Link>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium uppercase tracking-[0.2em] text-[#c9a227]/80">
                Command center
              </p>
              <p className="truncate font-serif text-sm text-[#f8f4ec] sm:text-base">{title}</p>
              {subtitle && (
                <p className="hidden truncate text-xs text-[#eae6dc]/45 lg:block">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="rounded-sm border border-[#c9a227]/35 px-3 py-1.5 text-sm uppercase tracking-wide text-[#eae6dc]/70 transition-colors hover:border-[#c9a227] hover:text-[#c9a227]"
            >
              Sign out
            </button>
          </div>
        </div>
        <nav className="relative z-10 mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3 sm:px-6 lg:px-8">
          {OPS_NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`touch-manipulation shrink-0 rounded-sm px-4 py-2 text-sm font-bold uppercase tracking-wide transition ${
                  active
                    ? "bg-[#c9a227] text-[#050505] shadow-lg shadow-[#c9a227]/20"
                    : "border border-[#c9a227]/20 text-[#eae6dc]/65 hover:border-[#c9a227]/40 hover:text-[#c9a227]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <div className="relative z-10 mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-8 lg:px-8">{children}</div>
    </div>
  );
}
