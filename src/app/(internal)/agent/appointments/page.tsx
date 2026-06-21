import Link from "next/link";
import { and, asc, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { CalendarClock, Clock3, MapPin, Search } from "lucide-react";

import { AppSearchInput } from "@/components/common/app-search-input";
import { AppStatusBadge } from "@/components/common/app-status-badge";
import { db, schema } from "@/db";
import { requireRole } from "@/lib/auth/guards";

type AgentAppointmentsPageProps = {
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

export default async function AgentAppointmentsPage({
  searchParams,
}: AgentAppointmentsPageProps) {
  const authContext = await requireRole(
    ["AGENT", "SUPER_ADMIN"],
    "/agent/appointments",
  );
  const currentUser = authContext.user as { id?: unknown };
  const currentUserId = typeof currentUser.id === "string" ? currentUser.id : "";
  const canSeeAll = authContext.roleCode === "SUPER_ADMIN";

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

  const scopeCondition = canSeeAll
    ? undefined
    : eq(schema.leads.currentAssigneeUserId, currentUserId);

  const baseCondition = and(
    eq(schema.leadActivities.activityType, "VIEWING_APPOINTMENT"),
    isNull(schema.leadActivities.deletedAt),
    scopeCondition,
    searchCondition,
  );

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
    })
    .from(schema.leadActivities)
    .innerJoin(schema.leads, eq(schema.leadActivities.leadId, schema.leads.id))
    .where(baseCondition)
    .orderBy(asc(schema.leadActivities.dueAt), desc(schema.leadActivities.createdAt))
    .limit(100);

  const scheduledCount = appointments.filter(
    (appointment) => !appointment.completedAt,
  ).length;

  return (
    <div className="space-y-8 p-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-emerald-600">
              Agent Schedule
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              Viewing Appointments
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
              View your scheduled site viewing appointments created from lead
              detail pages.
            </p>
          </div>

          <AppSearchInput
            placeholder="Search customer, phone, project..."
            className="w-full lg:w-[30rem]"
          />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <CalendarClock className="size-6 text-emerald-600" />
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
        </div>
      </section>

      <section className="grid gap-4">
        {appointments.map((appointment) => {
          const metadata = getMetadata(appointment.metadata);

          return (
            <article
              key={appointment.id}
              className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:border-emerald-200"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-black tracking-tight text-slate-950">
                      {appointment.customerName ?? "Customer"}
                    </h2>

                    <AppStatusBadge
                      tone={appointment.completedAt ? "success" : "warning"}
                    >
                      {appointment.completedAt ? "Completed" : "Scheduled"}
                    </AppStatusBadge>
                  </div>

                  <p className="mt-2 text-sm font-semibold text-slate-500">
                    {appointment.customerPhone ?? "-"} · {formatDate(appointment.dueAt)}
                  </p>

                  <p className="mt-4 font-black text-slate-950">
                    {metadata.projectName ?? "Project enquiry"}
                  </p>

                  <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-600">
                    <MapPin className="size-4 shrink-0 text-emerald-600" />
                    {metadata.locationText ?? "To be confirmed"}
                  </p>

                  {metadata.note ? (
                    <p className="mt-3 text-sm leading-6 text-slate-500">
                      {metadata.note}
                    </p>
                  ) : null}
                </div>

                <Link
                  href={`/agent/leads/${appointment.leadId}`}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  View Lead
                </Link>
              </div>
            </article>
          );
        })}

        {appointments.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-12 text-center">
            <Search className="mx-auto size-10 text-slate-300" />
            <h3 className="mt-4 text-lg font-black text-slate-950">
              No viewing appointments found
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Create an appointment from an assigned lead detail page.
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
