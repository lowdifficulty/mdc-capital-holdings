import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import StrategyScanner from "@/components/intelligence/StrategyScanner";

export const metadata = {
  title: "Strategy Scanner | MDC Capital Holdings",
  robots: { index: false, follow: false },
};

export default async function ScannerPage() {
  const session = await getSession();
  if (!session.user) redirect("/login");
  return <StrategyScanner />;
}
