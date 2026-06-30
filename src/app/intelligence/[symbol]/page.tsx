import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import TickerDetail from "@/components/intelligence/TickerDetail";

export const metadata = {
  title: "Ticker Analysis | MDC Capital Holdings",
  robots: { index: false, follow: false },
};

export default async function TickerPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const session = await getSession();
  if (!session.user) redirect("/login");
  const { symbol } = await params;
  return <TickerDetail symbol={symbol.toUpperCase()} />;
}
