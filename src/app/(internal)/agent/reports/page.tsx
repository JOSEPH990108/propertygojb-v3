import { ReportOverview } from "@/components/internal/reports/report-overview";
import { requireRole } from "@/lib/auth/guards";
import { getReportOverview } from "@/lib/reports/overview";

type AgentReportsPageProps = {
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

export default async function AgentReportsPage({
  searchParams,
}: AgentReportsPageProps) {
  const authContext = await requireRole(["AGENT", "SUPER_ADMIN"], "/agent/reports");

  const currentUser = authContext.user as { id?: unknown };
  const currentUserId = typeof currentUser.id === "string" ? currentUser.id : "";
  const canSeeAll = authContext.roleCode === "SUPER_ADMIN";

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const dateFromValue = getSearchValue(resolvedSearchParams.from);
  const dateToValue = getSearchValue(resolvedSearchParams.to);

  const report = await getReportOverview({
    portal: "agent",
    currentUserId,
    canSeeAll,
    dateFrom: parseStartDate(dateFromValue),
    dateTo: parseEndDate(dateToValue),
  });

  return (
    <ReportOverview
      portal="agent"
      report={report}
      dateFromValue={dateFromValue}
      dateToValue={dateToValue}
    />
  );
}
