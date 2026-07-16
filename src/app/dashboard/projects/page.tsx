import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import OperationsShell from "@/components/dashboard/OperationsShell";
import ProjectManagementPanel from "@/components/dashboard/ProjectManagementPanel";

export const metadata = {
  title: "Project Management | MDC Capital Holdings",
  robots: { index: false, follow: false },
};

export default async function ProjectsPage() {
  const session = await getSession();
  if (!session.user) redirect("/login");

  return (
    <OperationsShell
      title="Project Management"
      subtitle="AI projects · tasks · sprints"
    >
      <ProjectManagementPanel />
    </OperationsShell>
  );
}
