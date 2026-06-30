import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import IntelligenceDashboard from "@/components/intelligence/IntelligenceDashboard";

export const metadata = {
  title: "Trading Intelligence | MDC Capital Holdings",
  robots: { index: false, follow: false },
};

export default async function IntelligencePage() {
  const session = await getSession();
  if (!session.user) redirect("/login");
  return <IntelligenceDashboard />;
}
