import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import {
  ArrowLeft,
  CalendarClock,
  Mail,
  MessageCircle,
  Phone,
  UserRound,
} from "lucide-react";

import { LeadAssigneeSelect } from "@/components/admin/leads/lead-assignee-select";
import { LeadAppointmentComposer } from "@/components/internal/leads/lead-appointment-composer";
import { AppStatusBadge } from "@/components/common/app-status-badge";
import { LeadNoteComposer } from "@/components/internal/leads/lead-note-composer";
import { LeadStatusSelect } from "@/components/internal/leads/lead-status-select";
import { db, schema } from "@/db";

type AdminLeadDetailPageProps = {
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

export default async function AdminLeadDetailPage({
  params,
}: AdminLeadDetailPageProps) {
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
      assigneeName: schema.user.name,
      assigneeEmail: schema.user.email,
    })
    .from(schema.leads)
    .leftJoin(schema.leadSources, eq(schema.leads.sourceId, schema.leadSources.id))
    .leftJoin(schema.user, eq(schema.leads.currentAssigneeUserId, schema.user.id))
    .where(and(eq(schema.leads.id, leadId), isNull(schema.leads.deletedAt)))
    .limit(1);

  const lead = leadRows[0];

  if (!lead) {
    notFound();
  }

  const [agents, inquiries, activities, statusHistory] = await Promise.all([
    db
      .select({
        id: schema.user.id,
        name: schema.user.name,
        email: schema.user.email,
      })
      .from(schema.user)
      .innerJoin(schema.roles, eq(schema.user.roleId, schema.roles.id))
      .where(inArray(schema.roles.code, ["AGENT", "SUPER_ADMIN"]))
      .orderBy(asc(schema.user.name)),

    db
      .select({
        id: schema.inquiries.id,
        messageText: schema.inquiries.messageText,
        receivedAt: schema.inquiries.receivedAt,
        requesterName: schema.inquiries.requesterName,
        requesterPhoneNormalized: schema.inquiries.requesterPhoneNormalized,
        requesterEmail: schema.inquiries.requesterEmail,
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
      })
      .from(schema.leadActivities)
      .where(eq(schema.leadActivities.leadId, leadId))
      .orderBy(desc(schema.leadActivities.createdAt))
      .limit(50),

    db
      .select({
        id: schema.leadStatusHistory.id,
        fromStatus: schema.leadStatusHistory.fromStatus,
        toStatus: schema.leadStatusHistory.toStatus,
        changedAt: schema.leadStatusHistory.changedAt,
        reasonCode: schema.leadStatusHistory.reasonCode,
      })
      .from(schema.leadStatusHistory)
      .where(eq(schema.leadStatusHistory.leadId, leadId))
      .orderBy(desc(schema.leadStatusHistory.changedAt))
      .limit(30),
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

  return (
    <div className="space-y-8 p-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <Link
          href="/admin/leads"
          className="inline-flex items-center gap-2 text-sm font-black text-slate-500 transition hover:text-blue-700"
        >
          <ArrowLeft className="size-4" />
          Back to Leads
        </Link>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-blue-600">
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
              Current Assignee
            </p>
            <p className="mt-2 font-black text-slate-950">
              {lead.assigneeName ?? "Unassigned"}
            </p>
            {lead.assigneeEmail ? (
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {lead.assigneeEmail}
              </p>
            ) : null}
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

      <section className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="space-y-8">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black tracking-tight text-slate-950">
              Lead Status
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Update the customer journey status after follow-up.
            </p>

            <div className="mt-5">
              <LeadStatusSelect
                leadId={lead.id}
                currentStatus={lead.currentStatus ?? "NEW"}
              />
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black tracking-tight text-slate-950">
              Assign Agent
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Assign or unassign this lead from the admin portal.
            </p>

            <div className="mt-5">
              <LeadAssigneeSelect
                leadId={lead.id}
                currentAssigneeUserId={lead.currentAssigneeUserId}
                agents={agents}
              />
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black tracking-tight text-slate-950">
              Status History
            </h2>

            <div className="mt-5 space-y-3">
              {statusHistory.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <p className="font-black text-slate-950">
                    {formatStatus(item.fromStatus)} → {formatStatus(item.toStatus)}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {formatDate(item.changedAt)} · {item.reasonCode ?? "-"}
                  </p>
                </div>
              ))}

              {statusHistory.length === 0 ? (
                <p className="text-sm text-slate-500">No status history yet.</p>
              ) : null}
            </div>
          </section>
        </div>

        <div className="space-y-8">
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
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
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
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-slate-600">
                      {inquiry.messageText ?? "-"}
                    </p>
                  </div>
                );
              })}

              {inquiries.length === 0 ? (
                <p className="text-sm text-slate-500">No inquiry found.</p>
              ) : null}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black tracking-tight text-slate-950">
              Create Viewing Appointment
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Schedule a site viewing using the existing lead activity timeline.
            </p>

            <div className="mt-5">
              <LeadAppointmentComposer
                leadId={lead.id}
                projectOptions={projectOptions}
              />
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black tracking-tight text-slate-950">
              Add Follow-up Note
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Keep internal notes for calls, WhatsApp replies, appointments, or
              customer preferences.
            </p>

            <div className="mt-5">
              <LeadNoteComposer leadId={lead.id} />
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black tracking-tight text-slate-950">
              Activity Timeline
            </h2>

            <div className="mt-5 space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex gap-4">
                  <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700">
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
        </div>
      </section>
    </div>
  );
}
