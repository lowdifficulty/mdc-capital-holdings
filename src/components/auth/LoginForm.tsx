"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { companyLegal } from "@/data/site";
import { portalBtnPrimary, portalInput } from "@/components/platform/portal-ui";

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="site-a2p min-h-screen bg-light-gray text-dark-text">
      <section className="a2p-hero relative flex min-h-screen flex-col overflow-hidden bg-navy text-white">
        <div className="pointer-events-none absolute inset-0 hero-noise" aria-hidden />
        <div className="pointer-events-none absolute inset-0 hero-blue-glow" aria-hidden />
        <div className="pointer-events-none absolute inset-0 hero-blue-mesh opacity-60" aria-hidden />

        <div className="relative flex flex-1 items-center justify-center px-6 py-16">
          <div className="w-full max-w-md">
            <Link href="/" className="mb-10 flex flex-col items-center gap-2 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-mdc-blue text-sm font-bold text-white shadow-lg shadow-mdc-blue/40">
                MDC
              </span>
              <span className="font-serif text-2xl text-white">{companyLegal.name}</span>
              <span className="text-sm text-white/70">Client & operations portal</span>
            </Link>

            <div className="rounded-2xl border border-white/15 bg-white/10 p-8 backdrop-blur-md">
              <h1 className="text-center font-serif text-2xl text-white">Sign in</h1>
              <p className="mt-2 text-center text-sm text-white/70">
                SMS, calling, CRM, and Meta — one workspace
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <div>
                  <label htmlFor="username" className="mb-1.5 block text-xs font-medium text-white/80">
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-mdc-blue focus:ring-2 focus:ring-mdc-blue/30"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-white/80">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-mdc-blue focus:ring-2 focus:ring-mdc-blue/30"
                    required
                  />
                </div>

                {error && <p className="text-sm text-red-200">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className={`${portalBtnPrimary} w-full justify-center !shadow-lg`}
                >
                  {loading ? "Signing in…" : "Enter portal"}
                </button>
              </form>
            </div>

            <p className="mt-8 text-center text-xs text-white/50">
              <Link href="/" className="underline hover:text-white">
                Back to public site
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
