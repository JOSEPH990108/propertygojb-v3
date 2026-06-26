import { ReportOverview } from "@/components/internal/reports/report-overview";
import { requireRole } from "@/lib/auth/guards";
import { getReportOverview } from "@/lib/reports/overview";

export default async function AdminReportsPage() {
  await requireRole(["ADMIN", "SUPER_ADMIN"], "/admin/reports");

  const report = await getReportOverview({
    portal: "admin",
    currentUserId: "",
    canSeeAll: true,
  });

  return <ReportOverview portal="admin" report={report} />;
}
