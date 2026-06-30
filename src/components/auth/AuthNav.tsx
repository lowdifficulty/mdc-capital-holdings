"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface SessionUser {
  email: string;
  name: string;
}

export default function AuthNav() {
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

  if (!checked) {
    return <span className="hidden w-16 lg:block" aria-hidden />;
  }

  if (user) {
    return (
      <div className="hidden items-center gap-4 lg:flex">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-white/70 transition-colors hover:text-white"
        >
          Dashboard
        </Link>
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="rounded-full border border-white/25 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-white hover:bg-white/10"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="hidden rounded-full border border-white/25 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-white hover:bg-white/10 lg:inline-flex"
    >
      Login
    </Link>
  );
}

export function AuthNavMobile({
  onNavigate,
}: {
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

  if (user) {
    return (
      <>
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="text-base font-medium text-white/90 hover:text-white"
        >
          Dashboard
        </Link>
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="text-left text-base font-medium text-white/90 hover:text-white"
        >
          Sign out
        </button>
      </>
    );
  }

  return (
    <Link
      href="/login"
      onClick={onNavigate}
      className="text-base font-medium text-white/90 hover:text-white"
    >
      Login
    </Link>
  );
}
