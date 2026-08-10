import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import OperationsShell from "@/components/dashboard/OperationsShell";
import CallsPanel from "@/components/platform/CallsPanel";

export const metadata = {
  title: "Calls | MDC Platform",
  robots: { index: false, follow: false },
};

export default async function CallsPage() {
  const session = await getSession();
  if (!session.user) redirect("/login");

  return (
    <OperationsShell title="Calling" subtitle="Click-to-call · Twilio voice">
      <CallsPanel />
    </OperationsShell>
  );
}
