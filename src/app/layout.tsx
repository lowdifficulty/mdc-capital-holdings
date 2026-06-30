import type { Metadata } from "next";
import { DM_Sans, Libre_Baskerville } from "next/font/google";
import AppShell from "@/components/AppShell";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MDC Capital Holdings | Operating Holdings Company",
  description:
    "MDC Capital Holdings is an operating holdings company focused on building, acquiring, and scaling small businesses and digital platforms across healthcare, local services, digital health, and technology.",
  metadataBase: new URL("https://mdccapitalholdings.com"),
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "MDC Capital Holdings | Operating Holdings Company",
    description:
      "MDC Capital Holdings is an operating holdings company focused on building, acquiring, and scaling small businesses and digital platforms.",
    url: "https://mdccapitalholdings.com",
    siteName: "MDC Capital Holdings",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${libreBaskerville.variable}`}>
      <body className="antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
