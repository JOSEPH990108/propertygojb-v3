import { DashboardOverview } from "@/components/internal/dashboard/dashboard-overview";
import { requireRole } from "@/lib/auth/guards";
import { getReportOverview } from "@/lib/reports/overview";

export default async function AdminDashboardPage() {
  await requireRole(["ADMIN", "SUPER_ADMIN"], "/admin/dashboard");

  const report = await getReportOverview({
    portal: "admin",
    currentUserId: "",
    canSeeAll: true,
  });

  return <DashboardOverview portal="admin" report={report} />;
}
