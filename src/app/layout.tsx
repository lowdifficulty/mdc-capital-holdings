import type { Metadata } from "next";
import { DM_Sans, Instrument_Serif } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
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
    <html lang="en" className={`${dmSans.variable} ${instrumentSerif.variable}`}>
      <body className="antialiased">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
