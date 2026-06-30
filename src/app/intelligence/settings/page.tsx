import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import IntelligenceSettingsPage from "@/components/intelligence/IntelligenceSettingsPage";

export const metadata = {
  title: "Intelligence Settings | MDC Capital Holdings",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const session = await getSession();
  if (!session.user) redirect("/login");
  return <IntelligenceSettingsPage />;
}
