import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import OperationsShell from "@/components/dashboard/OperationsShell";
import CrmPanel from "@/components/platform/CrmPanel";

export const metadata = {
  title: "CRM | MDC Platform",
  robots: { index: false, follow: false },
};

export default async function CrmPage() {
  const session = await getSession();
  if (!session.user) redirect("/login");

  return (
    <OperationsShell title="CRM" subtitle="Pipeline · leads · clients">
      <CrmPanel />
    </OperationsShell>
  );
}
