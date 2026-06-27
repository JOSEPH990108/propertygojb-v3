import type { ReactNode } from "react";

import Link from "next/link";

import { and, desc, eq, ilike, isNull, or } from "drizzle-orm";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  FileClock,
  Search,
} from "lucide-react";

import { AppStatusBadge } from "@/components/common/app-status-badge";
import { db, schema } from "@/db";
import {
  formatBookingStatus,
  formatDateTime,
  formatMoney,
  getBookingStatusTone,
} from "@/lib/bookings/format";
import { requireRole } from "@/lib/auth/guards";

type AdminBookingsPageProps = {
  searchParams?: Promise<{
    q?: string | string[];
  }>;
};

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }

  return value?.trim() ?? "";
}

function getProjectName(row: {
  projectDisplayName: string | null;
  projectName: string | null;
}) {
  return row.projectDisplayName ?? row.projectName ?? "Project not linked";
}

function getCustomerName(row: {
  customerName: string | null;
  customerPhone: string | null;
}) {
  return row.customerName ?? row.customerPhone ?? "Customer not linked";
}

function getUnitLabel(row: {
  unitNo: string | null;
  floor: number | null;
  stack: string | null;
}) {
  if (!row.unitNo) {
    return "-";
  }

  const meta = [row.floor ? `Floor ${row.floor}` : null, row.stack]
    .filter(Boolean)
    .join(" · ");

  return meta ? `${row.unitNo} (${meta})` : row.unitNo;
}

function MetricCard({
  icon,
  label,
  value,
  description,
  tone = "info",
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  description: string;
  tone?: "success" | "danger" | "warning" | "info" | "neutral";
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-slate-700">
          {icon}
        </div>
        <AppStatusBadge tone={tone}>Live</AppStatusBadge>
      </div>

      <div className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">
        {value}
      </div>

      <div className="mt-1 font-medium text-slate-900">{label}</div>
      <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

export default async function AdminBookingsPage({
  searchParams,
}: AdminBookingsPageProps) {
  await requireRole(["ADMIN", "SUPER_ADMIN"], "/admin/bookings");

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const search = getSearchValue(resolvedSearchParams.q);
  const searchPattern = `%${search}%`;

  const bookings = await db
    .select({
      id: schema.bookings.id,
      bookingCode: schema.bookings.bookingCode,
      status: schema.bookings.status,
      bookingChannel: schema.bookings.bookingChannel,
      bookingFeeAmount: schema.bookings.bookingFeeAmount,
      bookingFeeCurrency: schema.bookings.bookingFeeCurrency,
      bookingFeePaidAmount: schema.bookings.bookingFeePaidAmount,
      submittedAt: schema.bookings.submittedAt,
      approvedAt: schema.bookings.approvedAt,
      createdAt: schema.bookings.createdAt,

      customerName: schema.leads.fullName,
      customerPhone: schema.leads.primaryPhoneE164,
      customerEmail: schema.leads.email,

      projectName: schema.projects.name,
      projectDisplayName: schema.projects.displayName,
      projectSlug: schema.projects.slug,

      agentName: schema.user.name,
      agentEmail: schema.user.email,

      unitNo: schema.units.unitNo,
      floor: schema.units.floor,
      stack: schema.units.stack,
    })
    .from(schema.bookings)
    .leftJoin(schema.leads, eq(schema.bookings.leadId, schema.leads.id))
    .leftJoin(schema.projects, eq(schema.bookings.projectId, schema.projects.id))
    .leftJoin(
      schema.user,
      eq(schema.bookings.assignedAgentUserId, schema.user.id),
    )
    .leftJoin(
      schema.bookingUnits,
      eq(schema.bookings.id, schema.bookingUnits.bookingId),
    )
    .leftJoin(schema.units, eq(schema.bookingUnits.unitId, schema.units.id))
    .where(
      and(
        isNull(schema.bookings.deletedAt),
        search
          ? or(
              ilike(schema.bookings.bookingCode, searchPattern),
              ilike(schema.leads.fullName, searchPattern),
              ilike(schema.leads.primaryPhoneE164, searchPattern),
              ilike(schema.leads.email, searchPattern),
              ilike(schema.projects.name, searchPattern),
              ilike(schema.projects.displayName, searchPattern),
              ilike(schema.user.name, searchPattern),
            )
          : undefined,
      ),
    )
    .orderBy(desc(schema.bookings.createdAt))
    .limit(100);

  const totalBookings = bookings.length;
  const activeReviewCount = bookings.filter((booking) =>
    ["SUBMITTED", "UNDER_REVIEW"].includes(booking.status),
  ).length;
  const approvedCount = bookings.filter(
    (booking) => booking.status === "APPROVED",
  ).length;
  const paymentCount = bookings.filter((booking) =>
    ["PAYMENT_PENDING", "PAYMENT_VERIFIED"].includes(booking.status),
  ).length;

  return (
    <div className="space-y-8 p-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <ClipboardList className="h-4 w-4" />
              Admin Booking Management
            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Bookings
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              View customer booking pipeline, assigned agents, project links,
              units, payment summary, and booking status.
            </p>
          </div>

          <form className="flex w-full max-w-md items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              name="q"
              defaultValue={search}
              placeholder="Search booking, customer, project, agent..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </form>
          <a
            href="/api/internal/bookings/export?portal=admin"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
          >
            Export CSV
          </a>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<ClipboardList className="h-5 w-5" />}
          label="Total Bookings"
          value={totalBookings}
          description="Latest booking records shown in this admin view."
          tone="info"
        />
        <MetricCard
          icon={<FileClock className="h-5 w-5" />}
          label="Submitted / Review"
          value={activeReviewCount}
          description="Bookings waiting for internal checking."
          tone="warning"
        />
        <MetricCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Approved"
          value={approvedCount}
          description="Bookings that have passed approval."
          tone="success"
        />
        <MetricCard
          icon={<CreditCard className="h-5 w-5" />}
          label="Payment Stage"
          value={paymentCount}
          description="Bookings with payment pending or verified."
          tone="neutral"
        />
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-950">
            Booking Pipeline
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Showing latest {bookings.length} booking records.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-4">Booking</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Project / Unit</th>
                <th className="px-6 py-4">Agent</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Fee</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {bookings.map((booking) => (
                <tr key={booking.id} className="align-top">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-950">
                      {booking.bookingCode}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {booking.bookingChannel}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">
                      {getCustomerName(booking)}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {booking.customerEmail ?? booking.customerPhone ?? "-"}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">
                      {getProjectName(booking)}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Unit: {getUnitLabel(booking)}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">
                      {booking.agentName ?? "Unassigned"}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {booking.agentEmail ?? "-"}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <AppStatusBadge tone={getBookingStatusTone(booking.status)}>
                      {formatBookingStatus(booking.status)}
                    </AppStatusBadge>
                  </td>

                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">
                      {formatMoney(
                        booking.bookingFeeAmount,
                        booking.bookingFeeCurrency,
                      )}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Paid:{" "}
                      {formatMoney(
                        booking.bookingFeePaidAmount,
                        booking.bookingFeeCurrency,
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-slate-500">
                    {formatDateTime(booking.submittedAt ?? booking.createdAt)}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/bookings/${booking.id}`}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Detail
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}

              {bookings.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-sm text-slate-500"
                  >
                    No bookings found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
