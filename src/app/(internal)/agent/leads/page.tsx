import Link from "next/link";
import {
  and,
  desc,
  eq,
  ilike,
  isNull,
  or,
} from "drizzle-orm";
import {
  Clock3,
  Mail,
  MessageCircle,
  Phone,
  Search,
  UserCheck,
  UsersRound,
} from "lucide-react";

import { AppSearchInput } from "@/components/common/app-search-input";
import { AppStatusBadge } from "@/components/common/app-status-badge";
import { db, schema } from "@/db";
import { requireRole } from "@/lib/auth/guards";

type AgentLeadsPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

function formatDate(value: Date | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function formatLeadStatus(value: string | null) {
  if (!value) {
    return "Unknown";
  }

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

function getWhatsappHref(phoneNumber: string, projectName: string) {
  const digits = phoneNumber.replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  return `https://wa.me/${digits}?text=${encodeURIComponent(
    `Hi, I saw your interest in ${projectName}. May I assist you with the brochure, price list, and available units?`,
  )}`;
}

export default async function AgentLeadsPage({
  searchParams,
}: AgentLeadsPageProps) {
  const authContext = await requireRole(["AGENT", "SUPER_ADMIN"], "/agent/leads");
  const currentUser = authContext.user as { id?: unknown };
  const userId = typeof currentUser.id === "string" ? currentUser.id : "";
  const canSeeAll = authContext.roleCode === "SUPER_ADMIN";

  const params = await searchParams;
  const query = params?.q?.trim() ?? "";

  const searchCondition = query
    ? or(
        ilike(schema.leads.fullName, `%${query}%`),
        ilike(schema.leads.primaryPhoneNormalized, `%${query}%`),
        ilike(schema.leads.email, `%${query}%`),
        ilike(schema.inquiries.messageText, `%${query}%`),
        ilike(schema.projects.name, `%${query}%`),
        ilike(schema.projects.displayName, `%${query}%`),
      )
    : undefined;

  const baseCondition = and(
    isNull(schema.inquiries.deletedAt),
    isNull(schema.leads.deletedAt),
  );

  const agentScopeCondition = canSeeAll
    ? undefined
    : or(
        eq(schema.leads.currentAssigneeUserId, userId),
        isNull(schema.leads.currentAssigneeUserId),
      );

  const finalCondition = searchCondition
    ? agentScopeCondition
      ? and(baseCondition, agentScopeCondition, searchCondition)
      : and(baseCondition, searchCondition)
    : agentScopeCondition
      ? and(baseCondition, agentScopeCondition)
      : baseCondition;

  const inquiries = await db
    .select({
      inquiryId: schema.inquiries.id,
      receivedAt: schema.inquiries.receivedAt,
      messageText: schema.inquiries.messageText,
      requesterName: schema.inquiries.requesterName,
      requesterPhoneNormalized: schema.inquiries.requesterPhoneNormalized,
      requesterEmail: schema.inquiries.requesterEmail,

      leadId: schema.leads.id,
      fullName: schema.leads.fullName,
      phoneNormalized: schema.leads.primaryPhoneNormalized,
      phoneE164: schema.leads.primaryPhoneE164,
      email: schema.leads.email,
      currentStatus: schema.leads.currentStatus,
      currentAssigneeUserId: schema.leads.currentAssigneeUserId,

      projectName: schema.projects.name,
      projectDisplayName: schema.projects.displayName,
      projectSlug: schema.projects.slug,

      sourceName: schema.leadSources.name,
      sourceChannel: schema.leadSources.channel,
    })
    .from(schema.inquiries)
    .innerJoin(schema.leads, eq(schema.inquiries.leadId, schema.leads.id))
    .leftJoin(schema.projects, eq(schema.inquiries.projectId, schema.projects.id))
    .leftJoin(
      schema.leadSources,
      eq(schema.inquiries.sourceId, schema.leadSources.id),
    )
    .where(finalCondition)
    .orderBy(desc(schema.inquiries.receivedAt))
    .limit(80);

  const assignedToMeCount = inquiries.filter(
    (inquiry) => inquiry.currentAssigneeUserId === userId,
  ).length;
  const openPublicCount = inquiries.filter(
    (inquiry) => !inquiry.currentAssigneeUserId,
  ).length;
  const newCount = inquiries.filter(
    (inquiry) =>
      inquiry.currentStatus === "NEW" || inquiry.currentStatus === "UNCONTACTED",
  ).length;

  return (
    <div className="space-y-8 p-8">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-950 via-emerald-950 to-emerald-700 p-8 text-white shadow-sm">
        <p className="text-sm font-black uppercase tracking-[0.28em] text-emerald-100">
          Agent CRM
        </p>
        <h1 className="mt-4 text-3xl font-black tracking-tight">
          My Lead Inbox
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-emerald-100">
          View assigned leads and unassigned public enquiries from project
          Register Interest forms. Lead claiming and routing will be added next.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <UsersRound className="size-6 text-blue-600" />
          <p className="mt-4 text-3xl font-black text-slate-950">
            {inquiries.length}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Visible enquiries
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <UserCheck className="size-6 text-emerald-600" />
          <p className="mt-4 text-3xl font-black text-slate-950">
            {assignedToMeCount}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Assigned to me
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <Clock3 className="size-6 text-amber-600" />
          <p className="mt-4 text-3xl font-black text-slate-950">
            {openPublicCount}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Open public leads
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <Search className="size-6 text-red-600" />
          <p className="mt-4 text-3xl font-black text-slate-950">{newCount}</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            New / uncontacted
          </p>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-950">
              Customer Enquiries
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Contact customers quickly from new website submissions.
            </p>
          </div>

          <AppSearchInput
            placeholder="Search my leads..."
            className="w-full lg:w-96"
          />
        </div>

        <div className="grid gap-4">
          {inquiries.map((inquiry) => {
            const projectName =
              inquiry.projectDisplayName ??
              inquiry.projectName ??
              "Project not linked";
            const customerName =
              inquiry.fullName ?? inquiry.requesterName ?? "Unknown customer";
            const phone =
              inquiry.phoneNormalized ?? inquiry.requesterPhoneNormalized ?? "";
            const email = inquiry.email ?? inquiry.requesterEmail ?? "";
            const whatsappHref = getWhatsappHref(phone, projectName);
            const isAssignedToMe = inquiry.currentAssigneeUserId === userId;

            return (
              <article
                key={inquiry.inquiryId}
                className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black text-slate-950">
                        {customerName}
                      </h3>

                      <AppStatusBadge
                        tone={isAssignedToMe ? "success" : "warning"}
                      >
                        {isAssignedToMe ? "Assigned to me" : "Open public lead"}
                      </AppStatusBadge>

                      <AppStatusBadge
                        tone={getLeadStatusTone(inquiry.currentStatus)}
                      >
                        {formatLeadStatus(inquiry.currentStatus)}
                      </AppStatusBadge>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold text-slate-500">
                      <span className="inline-flex items-center gap-2">
                        <Phone className="size-4" />
                        {phone || "-"}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Mail className="size-4" />
                        {email || "-"}
                      </span>
                      <span>{formatDate(inquiry.receivedAt)}</span>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-slate-600">
                      {inquiry.messageText ?? "-"}
                    </p>

                    <p className="mt-3 text-sm font-bold text-slate-700">
                      Interested Project:{" "}
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
                  </div>

                  <div className="flex shrink-0 flex-col gap-2">
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

                    <span className="rounded-xl bg-white px-4 py-2 text-center text-xs font-black text-slate-500 ring-1 ring-slate-200">
                      {inquiry.sourceName ?? "Website Project Enquiry"}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}

          {inquiries.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <UsersRound className="mx-auto size-10 text-slate-300" />
              <h3 className="mt-4 text-lg font-black text-slate-950">
                No leads found
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Assigned and open public Register Interest enquiries will appear
                here.
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
