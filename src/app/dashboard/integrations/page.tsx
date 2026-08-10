import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import OperationsShell from "@/components/dashboard/OperationsShell";
import IntegrationsPanel from "@/components/platform/IntegrationsPanel";

export const metadata = {
  title: "Integrations | MDC Platform",
  robots: { index: false, follow: false },
};

export default async function IntegrationsPage() {
  const session = await getSession();
  if (!session.user) redirect("/login");

  return (
    <OperationsShell title="Integrations" subtitle="Twilio · Meta Messenger & Instagram">
      <Suspense fallback={<p className="text-sm text-[#eae6dc]/50">Loading…</p>}>
        <IntegrationsPanel />
      </Suspense>
    </OperationsShell>
  );
}
