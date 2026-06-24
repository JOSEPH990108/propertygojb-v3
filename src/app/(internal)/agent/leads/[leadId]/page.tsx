import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq, isNull } from "drizzle-orm";
import {
  ArrowLeft,
  CalendarClock,
  Mail,
  MessageCircle,
  Phone,
  UserRound,
} from "lucide-react";

import { LeadClaimButton } from "@/components/agent/leads/lead-claim-button";
import { LeadAppointmentComposer } from "@/components/internal/leads/lead-appointment-composer";
import { LeadBookingComposer } from "@/components/internal/leads/lead-booking-composer";
import { AppStatusBadge } from "@/components/common/app-status-badge";
import { LeadNoteComposer } from "@/components/internal/leads/lead-note-composer";
import { LeadStatusSelect } from "@/components/internal/leads/lead-status-select";
import { db, schema } from "@/db";
import { requireRole } from "@/lib/auth/guards";

type AgentLeadDetailPageProps = {
  params: Promise<{
    leadId: string;
  }>;
};

function formatDate(value: Date | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function formatStatus(value: string | null) {
  if (!value) return "Unknown";

  return value
    .split("_")
    .map((part) => part.slice(0, 1) + part.slice(1).toLowerCase())
    .join(" ");
}

function getLeadStatusTone(
  value: string | null,
): "success" | "danger" | "warning" | "info" | "neutral" {
  switch (value) {
    case "NEW":
    case "UNCONTACTED":
      return "warning";
    case "ASSIGNED":
    case "CONTACTED":
    case "QUALIFIED":
    case "APPOINTMENT_SET":
      return "success";
    case "NURTURING":
      return "info";
    case "LOST":
    case "SPAM":
    case "CLOSED":
      return "danger";
    default:
      return "neutral";
  }
}

function getWhatsappHref(phoneNumber: string, customerName: string) {
  const digits = phoneNumber.replace(/\D/g, "");

  if (!digits) return null;

  return `https://wa.me/${digits}?text=${encodeURIComponent(
    `Hi ${customerName}, I saw your project enquiry. May I assist you with the brochure, price list, and available units?`,
  )}`;
}

export default async function AgentLeadDetailPage({
  params,
}: AgentLeadDetailPageProps) {
  const authContext = await requireRole(["AGENT", "SUPER_ADMIN"], "/agent/leads");
  const currentUser = authContext.user as { id?: unknown };
  const currentUserId = typeof currentUser.id === "string" ? currentUser.id : "";
  const canSeeAll = authContext.roleCode === "SUPER_ADMIN";

  const { leadId } = await params;

  const leadRows = await db
    .select({
      id: schema.leads.id,
      fullName: schema.leads.fullName,
      phoneNormalized: schema.leads.primaryPhoneNormalized,
      phoneE164: schema.leads.primaryPhoneE164,
      email: schema.leads.email,
      currentStatus: schema.leads.currentStatus,
      currentAssigneeUserId: schema.leads.currentAssigneeUserId,
      firstInquiryAt: schema.leads.firstInquiryAt,
      lastActivityAt: schema.leads.lastActivityAt,
      createdAt: schema.leads.createdAt,
      sourceName: schema.leadSources.name,
    })
    .from(schema.leads)
    .leftJoin(schema.leadSources, eq(schema.leads.sourceId, schema.leadSources.id))
    .where(and(eq(schema.leads.id, leadId), isNull(schema.leads.deletedAt)))
    .limit(1);

  const lead = leadRows[0];

  if (!lead) {
    notFound();
  }

  const isAssignedToMe = lead.currentAssigneeUserId === currentUserId;
  const isOpenLead = !lead.currentAssigneeUserId;
  const canManageLead = canSeeAll || isAssignedToMe;

  if (!canSeeAll && !isAssignedToMe && !isOpenLead) {
    notFound();
  }

  const [inquiries, activities] = await Promise.all([
    db
      .select({
        id: schema.inquiries.id,
        messageText: schema.inquiries.messageText,
        receivedAt: schema.inquiries.receivedAt,
        projectId: schema.inquiries.projectId,
        projectName: schema.projects.name,
        projectDisplayName: schema.projects.displayName,
        projectSlug: schema.projects.slug,
      })
      .from(schema.inquiries)
      .leftJoin(schema.projects, eq(schema.inquiries.projectId, schema.projects.id))
      .where(and(eq(schema.inquiries.leadId, leadId), isNull(schema.inquiries.deletedAt)))
      .orderBy(desc(schema.inquiries.receivedAt)),

    db
      .select({
        id: schema.leadActivities.id,
        activityType: schema.leadActivities.activityType,
        title: schema.leadActivities.title,
        body: schema.leadActivities.body,
        createdAt: schema.leadActivities.createdAt,
        dueAt: schema.leadActivities.dueAt,
        completedAt: schema.leadActivities.completedAt,
        metadata: schema.leadActivities.metadata,
      })
      .from(schema.leadActivities)
      .where(eq(schema.leadActivities.leadId, leadId))
      .orderBy(desc(schema.leadActivities.createdAt))
      .limit(50),
  ]);

  const customerName = lead.fullName ?? "Customer";
  const phone = lead.phoneNormalized ?? lead.phoneE164 ?? "";
  const whatsappHref = getWhatsappHref(phone, customerName);

  const projectOptions = Array.from(
    new Map(
      inquiries
        .filter((inquiry) => inquiry.projectId)
        .map((inquiry) => [
          inquiry.projectId as string,
          {
            id: inquiry.projectId as string,
            name:
              inquiry.projectDisplayName ??
              inquiry.projectName ??
              "Project enquiry",
          },
        ]),
    ).values(),
  );



  const availableUnits =
    projectOptions.length > 0
      ? await db
          .select({
            id: schema.units.id,
            projectId: schema.units.projectId,
            unitNo: schema.units.unitNo,
            basePrice: schema.units.basePrice,
            finalPrice: schema.units.finalPrice,
            bookingStatusCode: schema.bookingStatuses.code,
          })
          .from(schema.units)
          .leftJoin(
            schema.bookingStatuses,
            eq(schema.units.bookingStatusId, schema.bookingStatuses.id),
          )
          .where(isNull(schema.units.deletedAt))
      : [];

  const projectIds = new Set(projectOptions.map((project) => project.id));

  const unitOptions = availableUnits
    .filter(
      (unit) =>
        projectIds.has(unit.projectId) &&
        (!unit.bookingStatusCode || unit.bookingStatusCode === "AVAILABLE"),
    )
    .map((unit) => {
      const price = unit.finalPrice ?? unit.basePrice;
      const priceLabel =
        price === null || price === undefined
          ? "Price TBC"
          : `RM ${Number(price).toLocaleString("en-MY")}`;

      return {
        id: unit.id,
        projectId: unit.projectId,
        unitNo: unit.unitNo ?? "Unit",
        priceLabel,
      };
    });

  const latestViewingAppointment = activities.find(
    (activity) => activity.activityType === "VIEWING_APPOINTMENT",
  );

  const latestViewingAppointmentMetadata =
    latestViewingAppointment?.metadata &&
    typeof latestViewingAppointment.metadata === "object" &&
    !Array.isArray(latestViewingAppointment.metadata)
      ? (latestViewingAppointment.metadata as {
          projectId?: string;
          durationMinutes?: number;
          locationText?: string | null;
          note?: string | null;
          appointmentStatus?: string;
        })
      : {};

  const latestViewingAppointmentStatus =
    latestViewingAppointmentMetadata.appointmentStatus ?? "SCHEDULED";

  const existingAppointment =
    latestViewingAppointment?.dueAt &&
    latestViewingAppointmentMetadata.projectId &&
    latestViewingAppointmentStatus === "SCHEDULED"
      ? {
          id: latestViewingAppointment.id,
          projectId: latestViewingAppointmentMetadata.projectId,
          scheduledAt: latestViewingAppointment.dueAt.toISOString(),
          durationMinutes: latestViewingAppointmentMetadata.durationMinutes ?? 60,
          locationText: latestViewingAppointmentMetadata.locationText ?? "",
          note: latestViewingAppointmentMetadata.note ?? "",
          status: latestViewingAppointmentStatus,
        }
      : null;


  return (
    <div className="space-y-8 p-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <Link
          href="/agent/leads"
          className="inline-flex items-center gap-2 text-sm font-black text-slate-500 transition hover:text-blue-700"
        >
          <ArrowLeft className="size-4" />
          Back to Leads
        </Link>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-emerald-600">
              Lead Detail
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              {customerName}
            </h1>

            <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-slate-500">
              <span className="inline-flex items-center gap-2">
                <Phone className="size-4" />
                {phone || "-"}
              </span>
              <span className="inline-flex items-center gap-2">
                <Mail className="size-4" />
                {lead.email || "-"}
              </span>
              <span className="inline-flex items-center gap-2">
                <CalendarClock className="size-4" />
                {formatDate(lead.firstInquiryAt ?? lead.createdAt)}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {isOpenLead ? <LeadClaimButton leadId={lead.id} /> : null}

            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700"
              >
                <MessageCircle className="size-4" />
                WhatsApp
              </a>
            ) : null}

            <AppStatusBadge tone={getLeadStatusTone(lead.currentStatus)}>
              {formatStatus(lead.currentStatus)}
            </AppStatusBadge>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              Source
            </p>
            <p className="mt-2 font-black text-slate-950">
              {lead.sourceName ?? "Website Project Enquiry"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              Ownership
            </p>
            <p className="mt-2 font-black text-slate-950">
              {isAssignedToMe ? "Assigned to me" : "Open public lead"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              Last Activity
            </p>
            <p className="mt-2 font-black text-slate-950">
              {formatDate(lead.lastActivityAt)}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-8">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black tracking-tight text-slate-950">
              Lead Status
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Update status after contacting the customer.
            </p>

            <div className="mt-5">
          <LeadStatusSelect
                leadId={lead.id}
                currentStatus={lead.currentStatus ?? "NEW"}
                disabled={!canManageLead}
              />
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black tracking-tight text-slate-950">
              Viewing Appointment
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Claim or assign the lead first, then schedule the site viewing.
            </p>

            <div className="mt-5">
              <LeadAppointmentComposer
                leadId={lead.id}
                projectOptions={projectOptions}
                existingAppointment={existingAppointment}
                disabled={!canManageLead}
              />
            </div>

            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black tracking-tight text-slate-950">
                Create Booking
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Reserve an available unit and create a draft booking from this lead.
              </p>

              <div className="mt-5">
                <LeadBookingComposer
                  leadId={lead.id}
                  projectOptions={projectOptions}
                  unitOptions={unitOptions}
                  disabled={!canManageLead}
                />
              </div>
            </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black tracking-tight text-slate-950">
              Add Follow-up Note
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Add call notes, WhatsApp response notes, appointment interest, or
              buyer preferences.
            </p>

            <div className="mt-5">
              <LeadNoteComposer leadId={lead.id} disabled={!canManageLead} />
            </div>
          </section>
        </div>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-slate-950">
            Inquiry History
          </h2>

          <div className="mt-5 space-y-4">
            {inquiries.map((inquiry) => {
              const projectName =
                inquiry.projectDisplayName ??
                inquiry.projectName ??
                "Project not linked";

              return (
                <div
                  key={inquiry.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <p className="font-black text-slate-950">
                    {inquiry.projectSlug ? (
                      <Link
                        href={`/projects/${inquiry.projectSlug}`}
                        target="_blank"
                        className="text-blue-700 hover:underline"
                      >
                        {projectName}
                      </Link>
                    ) : (
                      projectName
                    )}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {formatDate(inquiry.receivedAt)}
                  </p>

                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    {inquiry.messageText ?? "-"}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-slate-950">
            Activity Timeline
          </h2>

          <div className="mt-5 space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex gap-4">
                <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <UserRound className="size-5" />
                </div>

                <div className="min-w-0 flex-1 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="font-black text-slate-950">{activity.title}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    {activity.activityType} · {formatDate(activity.createdAt)}
                  </p>
                  {activity.body ? (
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {activity.body}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}

            {activities.length === 0 ? (
              <p className="text-sm text-slate-500">No activity yet.</p>
            ) : null}
          </div>
        </section>
      </section>
    </div>
  );
}
