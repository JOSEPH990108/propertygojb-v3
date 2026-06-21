import Link from "next/link";
import { and, asc, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { CalendarClock, Clock3, MapPin, Search, UserRound } from "lucide-react";

import { AppSearchInput } from "@/components/common/app-search-input";
import { AppStatusBadge } from "@/components/common/app-status-badge";
import { db, schema } from "@/db";

type AdminAppointmentsPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

type AppointmentMetadata = {
  appointmentStatus?: string;
  projectId?: string;
  projectName?: string;
  locationText?: string | null;
  durationMinutes?: number;
  note?: string | null;
};

function getMetadata(value: unknown): AppointmentMetadata {
  if (!value || typeof value !== "object") {
    return {};
  }

  return value as AppointmentMetadata;
}

function formatDate(value: Date | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function AdminAppointmentsPage({
  searchParams,
}: AdminAppointmentsPageProps) {
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";

  const searchCondition = query
    ? or(
        ilike(schema.leads.fullName, `%${query}%`),
        ilike(schema.leads.primaryPhoneNormalized, `%${query}%`),
        ilike(schema.leadActivities.title, `%${query}%`),
        ilike(schema.leadActivities.body, `%${query}%`),
      )
    : undefined;

  const appointments = await db
    .select({
      id: schema.leadActivities.id,
      leadId: schema.leadActivities.leadId,
      title: schema.leadActivities.title,
      body: schema.leadActivities.body,
      dueAt: schema.leadActivities.dueAt,
      completedAt: schema.leadActivities.completedAt,
      createdAt: schema.leadActivities.createdAt,
      metadata: schema.leadActivities.metadata,
      customerName: schema.leads.fullName,
      customerPhone: schema.leads.primaryPhoneNormalized,
      assigneeName: schema.user.name,
    })
    .from(schema.leadActivities)
    .innerJoin(schema.leads, eq(schema.leadActivities.leadId, schema.leads.id))
    .leftJoin(schema.user, eq(schema.leads.currentAssigneeUserId, schema.user.id))
    .where(
      searchCondition
        ? and(
            eq(schema.leadActivities.activityType, "VIEWING_APPOINTMENT"),
            isNull(schema.leadActivities.deletedAt),
            searchCondition,
          )
        : and(
            eq(schema.leadActivities.activityType, "VIEWING_APPOINTMENT"),
            isNull(schema.leadActivities.deletedAt),
          ),
    )
    .orderBy(asc(schema.leadActivities.dueAt), desc(schema.leadActivities.createdAt))
    .limit(100);

  const scheduledCount = appointments.filter(
    (appointment) => !appointment.completedAt,
  ).length;
  const completedCount = appointments.filter(
    (appointment) => appointment.completedAt,
  ).length;

  return (
    <div className="space-y-8 p-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-blue-600">
              Admin Schedule
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              Viewing Appointments
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
              View appointments scheduled from lead detail pages. Stored as lead
              activities, no extra appointment table needed.
            </p>
          </div>

          <AppSearchInput
            placeholder="Search customer, phone, project..."
            className="w-full lg:w-[30rem]"
          />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <CalendarClock className="size-6 text-blue-600" />
            <p className="mt-4 text-3xl font-black text-slate-950">
              {appointments.length}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Showing appointments
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <Clock3 className="size-6 text-amber-600" />
            <p className="mt-4 text-3xl font-black text-slate-950">
              {scheduledCount}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Scheduled
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <UserRound className="size-6 text-emerald-600" />
            <p className="mt-4 text-3xl font-black text-slate-950">
              {completedCount}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Completed
            </p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] table-fixed">
            <colgroup>
              <col className="w-[18%]" />
              <col className="w-[18%]" />
              <col className="w-[18%]" />
              <col className="w-[14%]" />
              <col className="w-[20%]" />
              <col className="w-[12%]" />
            </colgroup>

            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Project</th>
                <th className="px-6 py-4">Schedule</th>
                <th className="px-6 py-4">Agent</th>
                <th className="px-6 py-4">Location / Note</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {appointments.map((appointment) => {
                const metadata = getMetadata(appointment.metadata);

                return (
                  <tr
                    key={appointment.id}
                    className="align-top transition hover:bg-slate-50/80"
                  >
                    <td className="px-6 py-5">
                      <p className="font-black text-slate-950">
                        {appointment.customerName ?? "Customer"}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {appointment.customerPhone ?? "-"}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <p className="font-bold text-slate-700">
                        {metadata.projectName ?? "Project enquiry"}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <p className="font-black text-slate-950">
                        {formatDate(appointment.dueAt)}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {metadata.durationMinutes ?? 60} minutes
                      </p>
                      <div className="mt-2">
                        <AppStatusBadge
                          tone={appointment.completedAt ? "success" : "warning"}
                        >
                          {appointment.completedAt ? "Completed" : "Scheduled"}
                        </AppStatusBadge>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <p className="font-bold text-slate-700">
                        {appointment.assigneeName ?? "Unassigned"}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <p className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                        <MapPin className="size-4 shrink-0 text-blue-600" />
                        {metadata.locationText ?? "To be confirmed"}
                      </p>
                      {metadata.note ? (
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                          {metadata.note}
                        </p>
                      ) : null}
                    </td>

                    <td className="px-6 py-5 text-right">
                      <Link
                        href={`/admin/leads/${appointment.leadId}`}
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                      >
                        View Lead
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center">
                    <Search className="mx-auto size-10 text-slate-300" />
                    <h3 className="mt-4 text-lg font-black text-slate-950">
                      No viewing appointments found
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      Create an appointment from a lead detail page.
                    </p>
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
