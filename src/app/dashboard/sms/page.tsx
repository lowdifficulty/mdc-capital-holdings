import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import OperationsShell from "@/components/dashboard/OperationsShell";
import SmsConsolePanel from "@/components/dashboard/SmsConsolePanel";

export const metadata = {
  title: "SMS Console | MDC Capital Holdings",
  robots: { index: false, follow: false },
};

export default async function SmsDashboardPage() {
  const session = await getSession();
  if (!session.user) redirect("/login");

  return (
    <OperationsShell title="SMS Console" subtitle="Text clients and leads · Twilio">
      <SmsConsolePanel />
    </OperationsShell>
  );
}
