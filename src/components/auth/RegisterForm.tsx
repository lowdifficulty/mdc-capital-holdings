"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Registration failed");
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
    <div className="min-h-screen bg-navy flex flex-col">
      <div className="pointer-events-none absolute inset-0 hero-blue-glow opacity-40" />
      <div className="relative flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-10 flex items-center justify-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-mdc-blue text-sm font-bold text-white">
              MDC
            </span>
            <span className="font-serif text-xl text-white">MDC Capital Holdings</span>
          </Link>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
            <h1 className="font-serif text-2xl text-white text-center">Create account</h1>
            <p className="mt-2 text-sm text-white/60 text-center">
              Register for access to the market sentiment dashboard
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <label htmlFor="name" className="block text-xs font-medium text-white/70 mb-1.5">
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-navy/80 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-mdc-blue focus:ring-2 focus:ring-mdc-blue/30"
                  placeholder="Your name"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-white/70 mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-navy/80 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-mdc-blue focus:ring-2 focus:ring-mdc-blue/30"
                  placeholder="you@company.com"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-xs font-medium text-white/70 mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-navy/80 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-mdc-blue focus:ring-2 focus:ring-mdc-blue/30"
                  placeholder="At least 8 characters"
                  minLength={8}
                  required
                />
              </div>

              {error && <p className="text-sm text-red-300">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-mdc-blue px-6 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-navy disabled:opacity-50"
              >
                {loading ? "Creating account…" : "Create account"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-white/60">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-white hover:text-mdc-blue">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
