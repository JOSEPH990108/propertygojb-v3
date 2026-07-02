import { ReportOverview } from "@/components/internal/reports/report-overview";
import { requireRole } from "@/lib/auth/guards";
import { getReportOverview } from "@/lib/reports/overview";

type AdminReportsPageProps = {
  searchParams?: Promise<{
    from?: string | string[];
    to?: string | string[];
  }>;
};

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function parseStartDate(value: string) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function parseEndDate(value: string) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T23:59:59.999`);

  return Number.isNaN(date.getTime()) ? null : date;
}

export default async function AdminReportsPage({
  searchParams,
}: AdminReportsPageProps) {
  await requireRole(["ADMIN", "SUPER_ADMIN"], "/admin/reports");

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const dateFromValue = getSearchValue(resolvedSearchParams.from);
  const dateToValue = getSearchValue(resolvedSearchParams.to);

  const report = await getReportOverview({
    portal: "admin",
    currentUserId: "",
    canSeeAll: true,
    dateFrom: parseStartDate(dateFromValue),
    dateTo: parseEndDate(dateToValue),
  });

  return (
    <ReportOverview
      portal="admin"
      report={report}
      dateFromValue={dateFromValue}
      dateToValue={dateToValue}
    />
  );
}
