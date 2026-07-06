"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { navLinks } from "@/data/site";
import AuthNav, { AuthNavMobile } from "@/components/auth/AuthNav";

export default function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const shellClass = isHome
    ? scrolled
      ? "border-b border-[#c9a227]/20 bg-[#050505]/95 shadow-lg shadow-black/40 backdrop-blur-md"
      : "bg-transparent"
    : scrolled
      ? "border-b border-white/10 bg-navy/95 shadow-lg shadow-navy/10 backdrop-blur-md"
      : "bg-transparent";

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${shellClass}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <span
            className={`flex h-9 w-9 items-center justify-center text-sm font-bold transition-transform group-hover:scale-105 ${
              isHome
                ? "rounded-sm bg-[#c9a227] text-[#050505]"
                : "rounded-md bg-mdc-blue text-white"
            }`}
          >
            MDC
          </span>
          <span
            className={`hidden font-serif text-lg tracking-tight sm:block ${
              isHome ? "text-[#f8f4ec]" : "text-white"
            }`}
          >
            MDC Capital Holdings
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium uppercase tracking-wide transition-colors ${
                  isHome
                    ? active
                      ? "text-[#c9a227]"
                      : "text-[#eae6dc]/65 hover:text-[#c9a227]"
                    : active
                      ? "text-white"
                      : "text-white/70 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <AuthNav luxury={isHome} />
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className={`inline-flex h-10 w-10 items-center justify-center lg:hidden ${
              isHome
                ? "rounded-sm border border-[#c9a227]/30 text-[#eae6dc]"
                : "rounded-md border border-white/20 text-white"
            }`}
          >
            <span className="sr-only">Menu</span>
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          className={`border-t px-6 py-6 lg:hidden ${
            isHome
              ? "border-[#c9a227]/15 bg-[#050505]"
              : "border-white/10 bg-navy"
          }`}
        >
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-base font-medium uppercase tracking-wide ${
                    isHome
                      ? active
                        ? "text-[#c9a227]"
                        : "text-[#eae6dc]/80 hover:text-[#c9a227]"
                      : "text-white/90 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <AuthNavMobile luxury={isHome} onNavigate={() => setMenuOpen(false)} />
          </nav>
        </div>
      )}
    </header>
  );
}
