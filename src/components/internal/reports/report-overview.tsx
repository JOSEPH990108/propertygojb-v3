import type { ReactNode } from "react";

import Link from "next/link";

import {
  ArrowRight,
  Banknote,
  BriefcaseBusiness,
  CalendarClock,
  FileText,
  Target,
  TrendingUp,
  UsersRound,
} from "lucide-react";

import { AppStatusBadge } from "@/components/common/app-status-badge";
import {
  formatBookingStatus,
  formatDateTime,
  formatMoney,
  getBookingStatusTone,
} from "@/lib/bookings/format";
import type { ReportOverview as ReportOverviewData } from "@/lib/reports/overview";

type ReportOverviewProps = {
  portal: "admin" | "agent";
  report: ReportOverviewData;
  dateFromValue?: string;
  dateToValue?: string;
};

function formatStatus(value: string | null | undefined) {
  if (!value) {
    return "Unknown";
  }

  return value
    .split("_")
    .map((part) => part.slice(0, 1) + part.slice(1).toLowerCase())
    .join(" ");
}

function getDocumentStatusTone(
  value: string | null | undefined,
): "success" | "danger" | "warning" | "info" | "neutral" {
  switch (value) {
    case "VERIFIED":
      return "success";
    case "REJECTED":
      return "danger";
    case "REQUESTED":
    case "SUBMITTED":
      return "warning";
    case "WAIVED":
      return "info";
    default:
      return "neutral";
  }
}

function getCustomerName(row: {
  customerName: string | null;
  customerPhone: string | null;
}) {
  return row.customerName ?? row.customerPhone ?? "Customer";
}

function getProjectName(row: {
  projectDisplayName?: string | null;
  projectName: string | null;
}) {
  return row.projectDisplayName ?? row.projectName ?? "Project";
}

function MetricCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  hint: string;
}) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid size-11 place-items-center rounded-2xl bg-slate-50 text-slate-700">
        {icon}
      </div>
      <p className="mt-5 text-3xl font-black tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-1 text-sm font-black text-slate-700">{label}</p>
      <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
        {hint}
      </p>
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-black tracking-tight text-slate-950">
          {title}
        </h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>
      </div>

      <div className="mt-5">{children}</div>
    </section>
  );
}

function StatRow({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="font-bold text-slate-700">{label}</span>
        <span className="font-black text-slate-950">
          {value}{" "}
          <span className="text-xs font-bold text-slate-400">
            ({percentage}%)
          </span>
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-slate-950"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function buildReportExportHref({
  portal,
  dateFromValue,
  dateToValue,
}: {
  portal: "admin" | "agent";
  dateFromValue: string;
  dateToValue: string;
}) {
  const params = new URLSearchParams();
  params.set("portal", portal);

  if (dateFromValue) {
    params.set("from", dateFromValue);
  }

  if (dateToValue) {
    params.set("to", dateToValue);
  }

  return `/api/internal/reports/export?${params.toString()}`;
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm font-semibold text-slate-500">
      {children}
    </div>
  );
}

export function ReportOverview({
  portal,
  report,
  dateFromValue = "",
  dateToValue = "",
}: ReportOverviewProps) {
  const accent = portal === "admin" ? "blue" : "emerald";

  return (
    <div className="space-y-8 p-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p
          className={`text-sm font-black uppercase tracking-[0.28em] ${
            accent === "blue" ? "text-blue-600" : "text-emerald-600"
          }`}
        >
          {portal === "admin" ? "Admin Reports" : "Agent Reports"}
        </p>

        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
          Performance Overview
        </h1>

        <div className="mt-6 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <p className="max-w-3xl text-sm leading-7 text-slate-500">
            Monitor leads, bookings, document progress, appointment activity, and
            booking fee collection in one place.
          </p>

          <form className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-end">
            <div className="space-y-1">
              <label className="text-xs font-black uppercase tracking-wide text-slate-400">
                From
              </label>
              <input
                type="date"
                name="from"
                defaultValue={dateFromValue}
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black uppercase tracking-wide text-slate-400">
                To
              </label>
              <input
                type="date"
                name="to"
                defaultValue={dateToValue}
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-black text-white shadow-sm transition hover:bg-slate-800"
            >
              Apply
            </button>

            <Link
              href={buildReportExportHref({
                portal,
                dateFromValue,
                dateToValue,
              })}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            >
              Export CSV
            </Link>

            <Link
              href={`/${portal}/reports`}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            >
              Reset
            </Link>
          </form>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<UsersRound className="size-5" />}
          label="Total Leads"
          value={report.leads.total}
          hint={`${report.leads.active} active, ${report.leads.qualified} qualified`}
        />

        <MetricCard
          icon={<BriefcaseBusiness className="size-5" />}
          label="Total Bookings"
          value={report.bookings.total}
          hint={`${report.bookings.approved} approved, ${report.bookings.active} active`}
        />

        <MetricCard
          icon={<Banknote className="size-5" />}
          label="Payment Collected"
          value={formatMoney(report.bookings.paymentCollected, report.bookings.currency)}
          hint={`${formatMoney(
            report.bookings.bookingFeeTotal,
            report.bookings.currency,
          )} total booking fee`}
        />

        <MetricCard
          icon={<Target className="size-5" />}
          label="Lead Conversion"
          value={`${report.leads.conversionRate}%`}
          hint="Leads linked with at least one booking"
        />
      </section>

      <section className="grid gap-8 xl:grid-cols-3">
        <SectionCard
          title="Lead Pipeline"
          subtitle="Current customer pipeline health"
        >
          <div className="space-y-5">
            <StatRow label="New / Uncontacted" value={report.leads.new} total={report.leads.total} />
            <StatRow label="Active" value={report.leads.active} total={report.leads.total} />
            <StatRow label="Qualified" value={report.leads.qualified} total={report.leads.total} />
            <StatRow label="Lost / Spam" value={report.leads.lost} total={report.leads.total} />
          </div>
        </SectionCard>

        <SectionCard
          title="Booking Pipeline"
          subtitle="Booking workflow status split"
        >
          <div className="space-y-5">
            <StatRow label="Payment Pending" value={report.bookings.paymentPending} total={report.bookings.total} />
            <StatRow label="Payment Verified" value={report.bookings.paymentVerified} total={report.bookings.total} />
            <StatRow label="Docs Pending" value={report.bookings.docsPending} total={report.bookings.total} />
            <StatRow label="Approved" value={report.bookings.approved} total={report.bookings.total} />
          </div>
        </SectionCard>

        <SectionCard
          title="Document Pipeline"
          subtitle="Document request and verification status"
        >
          <div className="space-y-5">
            <StatRow label="Requested" value={report.documents.requested} total={report.documents.total} />
            <StatRow label="Submitted" value={report.documents.submitted} total={report.documents.total} />
            <StatRow label="Verified" value={report.documents.verified} total={report.documents.total} />
            <StatRow label="Rejected / Waived" value={report.documents.rejected + report.documents.waived} total={report.documents.total} />
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title="Latest Bookings"
          subtitle="Most recent booking activities"
        >
          <div className="space-y-4">
            {report.bookings.latest.map((booking) => (
              <Link
                key={booking.id}
                href={`/${portal}/bookings/${booking.id}`}
                className="block rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300 hover:bg-white"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-black text-slate-950">
                      {booking.bookingCode}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {getCustomerName(booking)} · {getProjectName(booking)}
                    </p>
                  </div>

                  <AppStatusBadge tone={getBookingStatusTone(booking.status)}>
                    {formatBookingStatus(booking.status)}
                  </AppStatusBadge>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 text-xs font-bold text-slate-500">
                  <span>{formatDateTime(booking.createdAt)}</span>
                  <span className="inline-flex items-center gap-1">
                    Open <ArrowRight className="size-3.5" />
                  </span>
                </div>
              </Link>
            ))}

            {report.bookings.latest.length === 0 ? (
              <EmptyState>No booking record yet.</EmptyState>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard
          title="Appointment Activity"
          subtitle={`${report.appointments.pending} pending, ${report.appointments.completed} completed`}
        >
          <div className="space-y-4">
            {report.appointments.latest.map((activity) => (
              <Link
                key={activity.id}
                href={`/${portal}/leads/${activity.leadId}`}
                className="block rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300 hover:bg-white"
              >
                <div className="flex items-start gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white text-slate-600">
                    <CalendarClock className="size-4" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-black text-slate-950">
                      {activity.title ?? "Viewing Appointment"}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {activity.customerName ?? activity.customerPhone ?? "Customer"}
                    </p>
                    <p className="mt-2 text-xs font-bold text-slate-500">
                      {formatDateTime(activity.dueAt ?? activity.createdAt)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}

            {report.appointments.latest.length === 0 ? (
              <EmptyState>No appointment activity yet.</EmptyState>
            ) : null}
          </div>
        </SectionCard>
      </section>

      <SectionCard
        title="Latest Document Requests"
        subtitle="Recent document requests across bookings"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] table-fixed">
            <colgroup>
              <col className="w-[24%]" />
              <col className="w-[20%]" />
              <col className="w-[22%]" />
              <col className="w-[16%]" />
              <col className="w-[18%]" />
            </colgroup>

            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-black uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">Document</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Booking / Project</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {report.documents.latest.map((document) => (
                <tr key={document.id}>
                  <td className="px-4 py-4">
                    <p className="font-black text-slate-950">
                      {document.documentTypeName}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Requested {formatDateTime(document.requestedAt)}
                    </p>
                  </td>

                  <td className="px-4 py-4 text-sm font-bold text-slate-700">
                    {document.customerName ?? "Customer"}
                  </td>

                  <td className="px-4 py-4">
                    <p className="text-sm font-black text-slate-950">
                      {document.bookingCode}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {getProjectName(document)}
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <AppStatusBadge tone={getDocumentStatusTone(document.requestStatus)}>
                      {formatStatus(document.requestStatus)}
                    </AppStatusBadge>
                  </td>

                  <td className="px-4 py-4 text-right">
                    <Link
                      href={`/${portal}/documents/${document.id}`}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-black text-white shadow-sm transition hover:bg-slate-800"
                    >
                      Detail
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}

              {report.documents.latest.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm font-semibold text-slate-500"
                  >
                    No document request yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          icon={<FileText className="size-5" />}
          label="Document Requests"
          value={report.documents.total}
          hint={`${report.documents.submitted} submitted, ${report.documents.verified} verified`}
        />

        <MetricCard
          icon={<CalendarClock className="size-5" />}
          label="Appointments"
          value={report.appointments.total}
          hint={`${report.appointments.pending} pending, ${report.appointments.completed} completed`}
        />

        <MetricCard
          icon={<TrendingUp className="size-5" />}
          label="Active Bookings"
          value={report.bookings.active}
          hint={`${report.bookings.inactive} inactive or cancelled`}
        />
      </section>
    </div>
  );
}
