"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SitePageShell from "@/components/SitePageShell";
import A2pBodyTheme from "@/components/a2p/A2pBodyTheme";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const minimal =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/intelligence");

  const legacyMarketing =
    pathname === "/" || pathname === "/marketing-archive";

  if (minimal) {
    return (
      <>
        <A2pBodyTheme />
        {children}
      </>
    );
  }

  if (legacyMarketing) {
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
      <A2pBodyTheme />
      <Header a2p />
      <main className="site-a2p min-h-screen pt-[5.5rem]">
        {children}
      </main>
      <Footer a2p />
    </>
  );
}
