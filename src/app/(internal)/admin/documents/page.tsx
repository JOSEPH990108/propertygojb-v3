import Link from "next/link";

import { and, desc, eq, ilike, isNull, or } from "drizzle-orm";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  FileClock,
  FileText,
  Search,
} from "lucide-react";

import { AppStatusBadge } from "@/components/common/app-status-badge";
import { db, schema } from "@/db";
import { requireRole } from "@/lib/auth/guards";
import {
  formatBookingStatus,
  formatDateTime,
  getBookingStatusTone,
} from "@/lib/bookings/format";

type DocumentsPageProps = {
  searchParams?: Promise<{
    q?: string | string[];
  }>;
};

type PortalMode = "admin" | "agent";

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }

  return value?.trim() ?? "";
}

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
    case "UNDER_REVIEW":
      return "warning";
    case "WAIVED":
    case "REPLACED":
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
  projectDisplayName: string | null;
  projectName: string | null;
}) {
  return row.projectDisplayName ?? row.projectName ?? "Project";
}

async function DocumentsPage({
  searchParams,
  portal,
}: DocumentsPageProps & {
  portal: PortalMode;
}) {
  const authContext =
    portal === "admin"
      ? await requireRole(["ADMIN", "SUPER_ADMIN"], "/admin/documents")
      : await requireRole(["AGENT", "SUPER_ADMIN"], "/agent/documents");

  const currentUser = authContext.user as { id?: unknown };
  const currentUserId = typeof currentUser.id === "string" ? currentUser.id : "";
  const canSeeAll = authContext.roleCode === "SUPER_ADMIN" || portal === "admin";

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const search = getSearchValue(resolvedSearchParams.q);
  const searchPattern = `%${search}%`;

  const documents = await db
    .select({
      requestId: schema.documentRequests.id,
      requestStatus: schema.documentRequests.requestStatus,
      requestedAt: schema.documentRequests.requestedAt,
      dueAt: schema.documentRequests.dueAt,
      notes: schema.documentRequests.notes,

      documentTypeCode: schema.documentTypes.code,
      documentTypeName: schema.documentTypes.name,
      documentCategory: schema.documentTypes.category,
      isMandatoryDefault: schema.documentTypes.isMandatoryDefault,

      bookingId: schema.bookings.id,
      bookingCode: schema.bookings.bookingCode,
      bookingStatus: schema.bookings.status,
      assignedAgentUserId: schema.bookings.assignedAgentUserId,

      customerName: schema.leads.fullName,
      customerPhone: schema.leads.primaryPhoneE164,
      customerEmail: schema.leads.email,

      projectName: schema.projects.name,
      projectDisplayName: schema.projects.displayName,

      participantName: schema.bookingParticipants.fullName,
      participantRole: schema.bookingParticipants.role,

      submissionId: schema.documentSubmissions.id,
      submissionStatus: schema.documentSubmissions.submissionStatus,
      uploadedAt: schema.documentSubmissions.uploadedAt,
      versionNo: schema.documentSubmissions.versionNo,
      submissionNotes: schema.documentSubmissions.notes,

      verifiedAt: schema.documentVerificationLogs.verifiedAt,
      verificationStatus: schema.documentVerificationLogs.verificationStatus,
      verificationReason: schema.documentVerificationLogs.reasonNote,
    })
    .from(schema.documentRequests)
    .innerJoin(
      schema.documentTypes,
      eq(schema.documentRequests.documentTypeId, schema.documentTypes.id),
    )
    .innerJoin(schema.bookings, eq(schema.documentRequests.bookingId, schema.bookings.id))
    .innerJoin(schema.leads, eq(schema.bookings.leadId, schema.leads.id))
    .innerJoin(schema.projects, eq(schema.bookings.projectId, schema.projects.id))
    .leftJoin(
      schema.bookingParticipants,
      eq(schema.documentRequests.participantId, schema.bookingParticipants.id),
    )
    .leftJoin(
      schema.documentSubmissions,
      eq(schema.documentRequests.id, schema.documentSubmissions.requestId),
    )
    .leftJoin(
      schema.documentVerificationLogs,
      eq(schema.documentSubmissions.id, schema.documentVerificationLogs.submissionId),
    )
    .where(
      and(
        isNull(schema.documentRequests.deletedAt),
        isNull(schema.bookings.deletedAt),
        canSeeAll
          ? undefined
          : eq(schema.bookings.assignedAgentUserId, currentUserId),
        search
          ? or(
              ilike(schema.bookings.bookingCode, searchPattern),
              ilike(schema.documentTypes.name, searchPattern),
              ilike(schema.documentTypes.code, searchPattern),
              ilike(schema.leads.fullName, searchPattern),
              ilike(schema.leads.primaryPhoneE164, searchPattern),
              ilike(schema.leads.email, searchPattern),
              ilike(schema.projects.name, searchPattern),
              ilike(schema.projects.displayName, searchPattern),
            )
          : undefined,
      ),
    )
    .orderBy(desc(schema.documentRequests.requestedAt))
    .limit(120);

  const requestedCount = documents.filter(
    (document) => document.requestStatus === "REQUESTED",
  ).length;

  const submittedCount = documents.filter(
    (document) =>
      document.submissionStatus === "SUBMITTED" ||
      document.submissionStatus === "UNDER_REVIEW",
  ).length;

  const verifiedCount = documents.filter(
    (document) =>
      document.requestStatus === "VERIFIED" ||
      document.verificationStatus === "VERIFIED",
  ).length;

  const rejectedCount = documents.filter(
    (document) =>
      document.requestStatus === "REJECTED" ||
      document.submissionStatus === "REJECTED" ||
      document.verificationStatus === "REJECTED",
  ).length;

  const accent = portal === "admin" ? "blue" : "emerald";
  const title = portal === "admin" ? "Documents" : "My Documents";
  const subtitle =
    portal === "admin"
      ? "Track document requests, submissions, verification status, linked booking, customer, and project."
      : "Track document requests and submissions for your assigned customer bookings.";

  return (
    <div className="space-y-8 p-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p
              className={`text-sm font-black uppercase tracking-[0.28em] ${
                accent === "blue" ? "text-blue-600" : "text-emerald-600"
              }`}
            >
              {portal === "admin" ? "Admin Document Center" : "Agent Document Center"}
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              {title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
              {subtitle}
            </p>
          </div>

          <form className="flex w-full max-w-md items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <Search className="size-4 text-slate-400" />
            <input
              name="q"
              defaultValue={search}
              placeholder="Search document, booking, customer..."
              className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
            />
          </form>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <ClipboardList
              className={`size-6 ${
                accent === "blue" ? "text-blue-600" : "text-emerald-600"
              }`}
            />
            <p className="mt-4 text-3xl font-black text-slate-950">
              {documents.length}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Showing requests
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <FileClock className="size-6 text-amber-600" />
            <p className="mt-4 text-3xl font-black text-slate-950">
              {requestedCount}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Requested
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <FileText className="size-6 text-indigo-600" />
            <p className="mt-4 text-3xl font-black text-slate-950">
              {submittedCount}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Submitted / review
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <CheckCircle2 className="size-6 text-emerald-600" />
            <p className="mt-4 text-3xl font-black text-slate-950">
              {verifiedCount}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Verified
            </p>
          </div>
        </div>

        {rejectedCount > 0 ? (
          <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
            {rejectedCount} document request{submittedCount === 1 ? "" : "s"} need attention.
          </div>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] table-fixed">
            <colgroup>
              <col className="w-[20%]" />
              <col className="w-[18%]" />
              <col className="w-[18%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[16%]" />
            </colgroup>

            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                <th className="px-6 py-4">Document</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Booking / Project</th>
                <th className="px-6 py-4">Request Status</th>
                <th className="px-6 py-4">Submission</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {documents.map((document) => (
                <tr
                  key={`${document.requestId}-${document.submissionId ?? "no-submission"}`}
                  className="align-top transition hover:bg-slate-50/80"
                >
                  <td className="px-6 py-5">
                    <p className="font-black text-slate-950">
                      {document.documentTypeName}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {document.documentTypeCode} · {document.documentCategory}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {document.isMandatoryDefault ? (
                        <AppStatusBadge tone="warning">Mandatory</AppStatusBadge>
                      ) : (
                        <AppStatusBadge tone="neutral">Optional</AppStatusBadge>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <p className="font-black text-slate-950">
                      {getCustomerName(document)}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {document.customerEmail ?? document.customerPhone ?? "-"}
                    </p>
                    {document.participantName ? (
                      <p className="mt-2 text-xs font-bold text-slate-500">
                        Participant: {document.participantName} ·{" "}
                        {document.participantRole ?? "-"}
                      </p>
                    ) : null}
                  </td>

                  <td className="px-6 py-5">
                    <p className="font-black text-slate-950">
                      {document.bookingCode}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {getProjectName(document)}
                    </p>
                    <div className="mt-2">
                      <AppStatusBadge tone={getBookingStatusTone(document.bookingStatus)}>
                        {formatBookingStatus(document.bookingStatus)}
                      </AppStatusBadge>
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <AppStatusBadge tone={getDocumentStatusTone(document.requestStatus)}>
                      {formatStatus(document.requestStatus)}
                    </AppStatusBadge>
                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      Requested {formatDateTime(document.requestedAt)}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Due {formatDateTime(document.dueAt)}
                    </p>
                  </td>

                  <td className="px-6 py-5">
                    {document.submissionStatus ? (
                      <>
                        <AppStatusBadge
                          tone={getDocumentStatusTone(
                            document.verificationStatus ?? document.submissionStatus,
                          )}
                        >
                          {formatStatus(
                            document.verificationStatus ?? document.submissionStatus,
                          )}
                        </AppStatusBadge>
                        <p className="mt-2 text-xs font-semibold text-slate-500">
                          Uploaded {formatDateTime(document.uploadedAt)}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          Version {document.versionNo}
                        </p>
                      </>
                    ) : (
                      <AppStatusBadge tone="neutral">No submission</AppStatusBadge>
                    )}

                    {document.verificationReason ? (
                      <p className="mt-2 text-xs font-bold text-rose-600">
                        {document.verificationReason}
                      </p>
                    ) : null}
                  </td>

                  <td className="px-6 py-5 text-right">
                    <div className="flex flex-col items-end gap-2">
                      <Link
                        href={`/${portal}/bookings/${document.bookingId}`}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-black text-white shadow-sm transition hover:bg-slate-800"
                      >
                        Booking
                        <ArrowRight className="size-3.5" />
                      </Link>

                    </div>
                  </td>
                </tr>
              ))}

              {documents.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-sm font-semibold text-slate-500"
                  >
                    No document requests found.
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

export default function AdminDocumentsPage(props: DocumentsPageProps) {
  return <DocumentsPage {...props} portal="admin" />;
}
