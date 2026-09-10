import { DashboardOverview } from "@/components/internal/dashboard/dashboard-overview";
import { requireRole } from "@/lib/auth/guards";
import { getReportOverview } from "@/lib/reports/overview";

export default async function AgentDashboardPage() {
  const authContext = await requireRole(
    ["AGENT", "SUPER_ADMIN"],
    "/agent/dashboard",
  );

  const currentUser = authContext.user as { id?: unknown };
  const currentUserId = typeof currentUser.id === "string" ? currentUser.id : "";
  const canSeeAll = authContext.roleCode === "SUPER_ADMIN";

  const report = await getReportOverview({
    portal: "agent",
    currentUserId,
    canSeeAll,
  });

  return <DashboardOverview portal="agent" report={report} />;
}
