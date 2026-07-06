import type { Metadata } from "next";
import HomePageContent from "@/components/home/HomePageContent";

export const metadata: Metadata = {
  title: "MDC Capital Holdings | Operating Holdings Company",
  description:
    "From small business to global enterprise. MDC Capital Holdings builds, acquires, and scales operating businesses through capital, technology, and command-center execution.",
};

export default function HomePage() {
  return <HomePageContent />;
}
