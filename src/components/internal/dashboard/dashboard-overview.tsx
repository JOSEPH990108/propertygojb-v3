import type { ReactNode } from "react";

import Link from "next/link";

import {
  ArrowRight,
  Banknote,
  BriefcaseBusiness,
  CalendarClock,
  ClipboardList,
  FileText,
  Target,
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

type DashboardOverviewProps = {
  portal: "admin" | "agent";
  report: ReportOverviewData;
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
  customerPhone?: string | null;
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

function Panel({
  title,
  subtitle,
  actionHref,
  children,
}: {
  title: string;
  subtitle: string;
  actionHref: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-950">
            {title}
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>
        </div>

        <Link
          href={actionHref}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-black text-slate-700 transition hover:bg-slate-50"
        >
          View All
          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      <div className="mt-5">{children}</div>
    </section>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm font-semibold text-slate-500">
      {children}
    </div>
  );
}

export function DashboardOverview({ portal, report }: DashboardOverviewProps) {
  const accent = portal === "admin" ? "blue" : "emerald";

  const urgentDocuments = report.documents.latest.filter((document) =>
    ["REQUESTED", "SUBMITTED", "REJECTED"].includes(
      document.requestStatus ?? "",
    ),
  );

  return (
    <div className="space-y-8 p-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p
          className={`text-sm font-black uppercase tracking-[0.28em] ${
            accent === "blue" ? "text-blue-600" : "text-emerald-600"
          }`}
        >
          {portal === "admin" ? "Admin Dashboard" : "Agent Dashboard"}
        </p>

        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
          Today&apos;s Overview
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
          Quick snapshot of leads, bookings, payments, documents, and viewing
          activity.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/${portal}/leads`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-black text-white shadow-sm transition hover:bg-slate-800"
          >
            Leads
            <ArrowRight className="size-4" />
          </Link>

          <Link
            href={`/${portal}/bookings`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
          >
            Bookings
            <ArrowRight className="size-4" />
          </Link>

          <Link
            href={`/${portal}/documents`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
          >
            Documents
            <ArrowRight className="size-4" />
          </Link>

          <Link
            href={`/${portal}/reports`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
          >
            Reports
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<UsersRound className="size-5" />}
          label="Leads"
          value={report.leads.total}
          hint={`${report.leads.active} active, ${report.leads.qualified} qualified`}
        />

        <MetricCard
          icon={<BriefcaseBusiness className="size-5" />}
          label="Bookings"
          value={report.bookings.total}
          hint={`${report.bookings.active} active, ${report.bookings.approved} approved`}
        />

        <MetricCard
          icon={<Banknote className="size-5" />}
          label="Payment Collected"
          value={formatMoney(
            report.bookings.paymentCollected,
            report.bookings.currency,
          )}
          hint={`${formatMoney(
            report.bookings.bookingFeeTotal,
            report.bookings.currency,
          )} total booking fee`}
        />

        <MetricCard
          icon={<Target className="size-5" />}
          label="Conversion"
          value={`${report.leads.conversionRate}%`}
          hint="Leads linked with at least one booking"
        />
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel
          title="Latest Bookings"
          subtitle="Recently created bookings"
          actionHref={`/${portal}/bookings`}
        >
          <div className="space-y-4">
            {report.bookings.latest.slice(0, 5).map((booking) => (
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
                  <span>
                    {formatMoney(
                      booking.bookingFeePaidAmount,
                      booking.bookingFeeCurrency,
                    )}{" "}
                    paid
                  </span>
                </div>
              </Link>
            ))}

            {report.bookings.latest.length === 0 ? (
              <EmptyState>No booking record yet.</EmptyState>
            ) : null}
          </div>
        </Panel>

        <Panel
          title="Appointments"
          subtitle={`${report.appointments.pending} pending, ${report.appointments.completed} completed`}
          actionHref={`/${portal}/appointments`}
        >
          <div className="space-y-4">
            {report.appointments.latest.slice(0, 5).map((activity) => (
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
                      {activity.customerName ??
                        activity.customerPhone ??
                        "Customer"}
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
        </Panel>
      </section>

      <section className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel
          title="Document Attention"
          subtitle="Documents that need follow-up"
          actionHref={`/${portal}/documents`}
        >
          <div className="space-y-4">
            {urgentDocuments.slice(0, 5).map((document) => (
              <Link
                key={document.id}
                href={`/${portal}/documents/${document.id}`}
                className="block rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300 hover:bg-white"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-black text-slate-950">
                      {document.documentTypeName}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {document.customerName ?? "Customer"} ·{" "}
                      {document.bookingCode}
                    </p>
                  </div>

                  <AppStatusBadge
                    tone={getDocumentStatusTone(document.requestStatus)}
                  >
                    {formatStatus(document.requestStatus)}
                  </AppStatusBadge>
                </div>

                <p className="mt-4 text-xs font-bold text-slate-500">
                  Requested {formatDateTime(document.requestedAt)}
                </p>
              </Link>
            ))}

            {urgentDocuments.length === 0 ? (
              <EmptyState>No document follow-up needed.</EmptyState>
            ) : null}
          </div>
        </Panel>

        <Panel
          title="Quick Health"
          subtitle="Pipeline status summary"
          actionHref={`/${portal}/reports`}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <MetricCard
              icon={<ClipboardList className="size-5" />}
              label="Active Bookings"
              value={report.bookings.active}
              hint={`${report.bookings.inactive} inactive or cancelled`}
            />

            <MetricCard
              icon={<FileText className="size-5" />}
              label="Documents"
              value={report.documents.total}
              hint={`${report.documents.submitted} submitted, ${report.documents.verified} verified`}
            />

            <MetricCard
              icon={<CalendarClock className="size-5" />}
              label="Appointments"
              value={report.appointments.total}
              hint={`${report.appointments.pending} pending`}
            />

            <MetricCard
              icon={<BriefcaseBusiness className="size-5" />}
              label="Docs Pending"
              value={report.bookings.docsPending}
              hint="Bookings waiting for documents"
            />
          </div>
        </Panel>
      </section>
    </div>
  );
}
