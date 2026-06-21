import Link from "next/link";
import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  or,
} from "drizzle-orm";
import {
  Clock3,
  Mail,
  Phone,
  Search,
  UserRound,
  UsersRound,
} from "lucide-react";

import { LeadAssigneeSelect } from "@/components/admin/leads/lead-assignee-select";
import { LeadAdminActionMenu } from "@/components/admin/leads/lead-action-menu";
import { AppSearchInput } from "@/components/common/app-search-input";
import { AppStatusBadge } from "@/components/common/app-status-badge";
import { db, schema } from "@/db";

type AdminLeadsPageProps = {
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

export default async function AdminLeadsPage({
  searchParams,
}: AdminLeadsPageProps) {
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";

  const agents = await db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      email: schema.user.email,
    })
    .from(schema.user)
    .innerJoin(schema.roles, eq(schema.user.roleId, schema.roles.id))
    .where(inArray(schema.roles.code, ["AGENT", "SUPER_ADMIN"]))
    .orderBy(asc(schema.user.name));

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
    .where(searchCondition ? and(baseCondition, searchCondition) : baseCondition)
    .orderBy(desc(schema.inquiries.receivedAt))
    .limit(100);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayCount = inquiries.filter(
    (inquiry) => inquiry.receivedAt >= todayStart,
  ).length;

  const newCount = inquiries.filter(
    (inquiry) =>
      inquiry.currentStatus === "NEW" || inquiry.currentStatus === "UNCONTACTED",
  ).length;

  const unassignedCount = inquiries.filter(
    (inquiry) => !inquiry.currentAssigneeUserId,
  ).length;

  return (
    <div className="space-y-8 p-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-blue-600">
              CRM Inbox
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              Register Interest Leads
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
              View public website enquiries submitted from project pages,
              monitor customer interest, and assign each lead to an agent.
            </p>
          </div>

          <AppSearchInput
            placeholder="Search customer, mobile, project..."
            className="w-full lg:w-[30rem]"
          />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <UsersRound className="size-6 text-blue-600" />
            <p className="mt-4 text-3xl font-black text-slate-950">
              {inquiries.length}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Showing leads
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <Clock3 className="size-6 text-emerald-600" />
            <p className="mt-4 text-3xl font-black text-slate-950">
              {todayCount}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Received today
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <Search className="size-6 text-amber-600" />
            <p className="mt-4 text-3xl font-black text-slate-950">
              {newCount}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              New / uncontacted
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <UserRound className="size-6 text-red-600" />
            <p className="mt-4 text-3xl font-black text-slate-950">
              {unassignedCount}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Unassigned
            </p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1280px] table-fixed">
            <colgroup>
              <col className="w-[18%]" />
              <col className="w-[13%]" />
              <col className="w-[13%]" />
              <col className="w-[9%]" />
              <col className="w-[18%]" />
              <col className="w-[20%]" />
              <col className="w-[9%]" />
            </colgroup>

            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Project</th>
                <th className="px-6 py-4">Source</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Assign Agent</th>
                <th className="px-6 py-4">Message</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
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

                return (
                  <tr
                    key={inquiry.inquiryId}
                    className="align-top transition hover:bg-slate-50/80"
                  >
                    <td className="px-6 py-5">
                      <div className="min-w-0">
                        <Link
                          href={`/admin/leads/${inquiry.leadId}`}
                          className="block truncate font-black text-slate-950 transition hover:text-blue-700 hover:underline"
                        >
                          {customerName}
                        </Link>

                        <div className="mt-2 space-y-1 text-xs font-semibold text-slate-500">
                          <p className="flex items-center gap-2">
                            <Phone className="size-3.5 shrink-0" />
                            <span className="truncate">{phone || "-"}</span>
                          </p>

                          <p className="flex items-center gap-2">
                            <Mail className="size-3.5 shrink-0" />
                            <span className="truncate">{email || "-"}</span>
                          </p>
                        </div>

                        <p className="mt-2 text-xs text-slate-400">
                          {formatDate(inquiry.receivedAt)}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      {inquiry.projectSlug ? (
                        <Link
                          href={`/projects/${inquiry.projectSlug}`}
                          className="font-bold text-blue-700 hover:underline"
                          target="_blank"
                        >
                          {projectName}
                        </Link>
                      ) : (
                        <p className="font-bold text-slate-700">{projectName}</p>
                      )}
                    </td>

                    <td className="px-6 py-5">
                      <p className="font-bold text-slate-700">
                        {inquiry.sourceName ?? "Website"}
                      </p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {inquiry.sourceChannel ?? "WEBSITE"}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <AppStatusBadge tone={getLeadStatusTone(inquiry.currentStatus)}>
                        {formatLeadStatus(inquiry.currentStatus)}
                      </AppStatusBadge>
                    </td>

                    <td className="px-6 py-5">
                      <LeadAssigneeSelect
                        leadId={inquiry.leadId}
                        currentAssigneeUserId={inquiry.currentAssigneeUserId}
                        agents={agents}
                      />
                    </td>

                    <td className="px-6 py-5">
                      <p className="line-clamp-3 text-sm leading-6 text-slate-500">
                        {inquiry.messageText ?? "-"}
                      </p>
                    </td>

                    <td className="px-6 py-5 text-right">
                      <LeadAdminActionMenu
                        leadId={inquiry.leadId}
                        whatsappHref={whatsappHref}
                      />
                    </td>
                  </tr>
                );
              })}

              {inquiries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center">
                    <UsersRound className="mx-auto size-10 text-slate-300" />
                    <h3 className="mt-4 text-lg font-black text-slate-950">
                      No leads found
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      Register Interest submissions will appear here.
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
