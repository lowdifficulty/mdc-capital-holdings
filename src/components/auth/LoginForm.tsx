"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
    <div className="dashboard-wayne relative min-h-screen text-[#eae6dc]">
      <div className="pointer-events-none fixed inset-0 dashboard-wayne-texture" aria-hidden />
      <div className="pointer-events-none fixed inset-0 dashboard-wayne-gold-wash" aria-hidden />

      <div className="relative flex min-h-screen flex-col">
        <div className="relative flex flex-1 items-center justify-center px-6 py-16">
          <div className="w-full max-w-md">
            <Link href="/" className="mb-10 flex items-center justify-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-[#c9a227] text-sm font-bold text-[#050505]">
                MDC
              </span>
              <span className="font-serif text-xl text-[#f8f4ec]">MDC Capital Holdings</span>
            </Link>

            <div className="rounded-sm border border-[#c9a227]/20 bg-[#111]/90 p-8 backdrop-blur-sm">
              <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-[#c9a227]/80">
                Command center
              </p>
              <h1 className="mt-2 text-center font-serif text-2xl text-[#f8f4ec]">Sign in</h1>
              <p className="mt-2 text-center text-sm text-[#eae6dc]/55">
                Access the operations dashboard
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <div>
                  <label
                    htmlFor="username"
                    className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[#eae6dc]/70"
                  >
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-sm border border-[#c9a227]/20 bg-black/30 px-4 py-3 text-sm text-[#eae6dc] placeholder:text-[#eae6dc]/30 outline-none focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/25"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[#eae6dc]/70"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-sm border border-[#c9a227]/20 bg-black/30 px-4 py-3 text-sm text-[#eae6dc] placeholder:text-[#eae6dc]/30 outline-none focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/25"
                    required
                  />
                </div>

                {error && <p className="text-sm text-red-300">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-sm bg-[#c9a227] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-[#050505] transition hover:bg-[#e0c56a] disabled:opacity-50"
                >
                  {loading ? "Signing in…" : "Sign in"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
