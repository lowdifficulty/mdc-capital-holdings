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

  if (minimal) {
    return (
      <>
        <DashboardThemeApplier />
        {children}
      </>
    );
  }

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
