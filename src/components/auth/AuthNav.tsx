"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface SessionUser {
  email: string;
  name: string;
}

export default function AuthNav({ luxury = false }: { luxury?: boolean }) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => setUser(d.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setChecked(true));
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  }

  const loginClass = luxury
    ? "inline-flex rounded-sm border border-[#c9a227]/50 px-4 py-2 text-sm font-medium uppercase tracking-wide text-[#eae6dc] transition-colors hover:border-[#c9a227] hover:bg-[#c9a227]/10"
    : "inline-flex rounded-full border border-white/25 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-white hover:bg-white/10";

  const loginPlaceholderClass = luxury
    ? "inline-flex rounded-sm border border-[#c9a227]/25 px-4 py-2 text-sm font-medium uppercase tracking-wide text-[#eae6dc]/40"
    : "inline-flex rounded-full border border-white/25 px-4 py-2 text-sm font-medium text-white/50";

  if (!checked) {
    return (
      <Link href="/login" className={loginPlaceholderClass} aria-hidden tabIndex={-1}>
        Login
      </Link>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3 sm:gap-4">
        <Link
          href="/dashboard"
          className={
            luxury
              ? "text-sm font-medium uppercase tracking-wide text-[#eae6dc]/70 transition-colors hover:text-[#c9a227]"
              : "text-sm font-medium text-white/70 transition-colors hover:text-white"
          }
        >
          Dashboard
        </Link>
        <button
          type="button"
          onClick={() => void handleLogout()}
          className={
            luxury
              ? "rounded-sm border border-[#c9a227]/40 px-4 py-2 text-sm font-medium uppercase tracking-wide text-[#eae6dc] transition-colors hover:border-[#c9a227] hover:bg-[#c9a227]/10"
              : "rounded-full border border-white/25 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-white hover:bg-white/10"
          }
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <Link href="/login" className={loginClass}>
      Login
    </Link>
  );
}

export function AuthNavMobile({
  luxury = false,
  onNavigate,
}: {
  luxury?: boolean;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => setUser(d.user ?? null))
      .catch(() => setUser(null));
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    onNavigate?.();
    router.push("/");
    router.refresh();
  }

  const linkClass = luxury
    ? "text-base font-medium uppercase tracking-wide text-[#eae6dc]/80 hover:text-[#c9a227]"
    : "text-base font-medium text-white/90 hover:text-white";

  if (user) {
    return (
      <>
        <Link href="/dashboard" onClick={onNavigate} className={linkClass}>
          Dashboard
        </Link>
        <button
          type="button"
          onClick={() => void handleLogout()}
          className={`text-left ${linkClass}`}
        >
          Sign out
        </button>
      </>
    );
  }

  return (
    <Link href="/login" onClick={onNavigate} className={linkClass}>
      Login
    </Link>
  );
}
