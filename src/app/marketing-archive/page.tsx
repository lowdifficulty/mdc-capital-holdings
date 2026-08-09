import type { Metadata } from "next";
import HomePageContent from "@/components/home/HomePageContent";

export const metadata: Metadata = {
  title: "Marketing site archive | MDC Capital Holdings",
  description: "Archived marketing homepage (not indexed).",
  robots: { index: false, follow: false },
};

export default function MarketingArchivePage() {
  return <HomePageContent />;
}
