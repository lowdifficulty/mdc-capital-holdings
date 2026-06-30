import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import SentimentDashboard from "@/components/dashboard/SentimentDashboard";

export const metadata = {
  title: "Sentiment Dashboard | MDC Capital Holdings",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const session = await getSession();
  if (!session.user) redirect("/login");

  return <SentimentDashboard />;
}
