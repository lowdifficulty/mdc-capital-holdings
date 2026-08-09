"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SitePageShell from "@/components/SitePageShell";
import DashboardThemeApplier from "@/components/dashboard/DashboardThemeApplier";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const minimal =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/intelligence");

  const marketingArchive = pathname === "/marketing-archive";

  if (minimal) {
    return (
      <>
        <DashboardThemeApplier />
        {children}
      </>
    );
  }

  if (marketingArchive) {
    return (
      <>
        <Header luxury />
        <main>
          <SitePageShell>{children}</SitePageShell>
        </main>
        <Footer luxury />
      </>
    );
  }

  return (
    <>
      <Header a2p />
      <main className="min-h-screen bg-white pt-24 text-slate-900">{children}</main>
      <Footer a2p />
    </>
  );
}
