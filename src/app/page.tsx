import type { Metadata } from "next";
import HomePageContent from "@/components/home/HomePageContent";

export const metadata: Metadata = {
  title: "MDC Capital Holdings | Private Operating Holdings",
  description:
    "MDC Capital Holdings is a private operating holding company focused on long-term capital, operational leadership, and durable growth.",
};

export default function HomePage() {
  return <HomePageContent />;
}
