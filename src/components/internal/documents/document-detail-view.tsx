import type { ReactNode } from "react";

import Link from "next/link";

import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarClock,
  ClipboardCheck,
  FileText,
  History,
  UserRound,
} from "lucide-react";

import { AppStatusBadge } from "@/components/common/app-status-badge";
import { DocumentUploadComposer } from "@/components/internal/documents/document-upload-composer";
import { DocumentVerificationActionPanel } from "@/components/internal/documents/document-verification-action-panel";
import {
  formatBookingStatus,
  formatDateTime,
  formatMoney,
  getBookingStatusTone,
} from "@/lib/bookings/format";
import type { getDocumentRequestDetailById } from "@/lib/documents/queries";

type DocumentDetail = NonNullable<
  Awaited<ReturnType<typeof getDocumentRequestDetailById>>
>;

type DocumentDetailViewProps = {
  detail: DocumentDetail;
  portal: "admin" | "agent";
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
    case "UNDER_REVIEW":
      return "warning";
    case "WAIVED":
    case "REPLACED":
      return "info";
    default:
      return "neutral";
  }
}

function formatFileSize(value: number | null | undefined) {
  if (!value) {
    return "-";
  }

  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function getCustomerName(request: DocumentDetail["request"]) {
  return request.customerName ?? request.customerPhone ?? "Customer";
}

function getProjectName(request: DocumentDetail["request"]) {
  return request.projectDisplayName ?? request.projectName ?? "Project";
}

function InfoCard({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-2xl bg-slate-50 text-slate-700">
          {icon}
        </div>
        <h2 className="text-xl font-black tracking-tight text-slate-950">
          {title}
        </h2>
      </div>

      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <div className="mt-1 text-sm font-bold text-slate-800">{value}</div>
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm font-semibold text-slate-500">
      {children}
    </div>
  );
}

export function DocumentDetailView({ detail, portal }: DocumentDetailViewProps) {
  const { request, submissions, verificationLogs } = detail;
  const accent = portal === "admin" ? "blue" : "emerald";

  const latestSubmission = submissions[0];
  const latestVerification = verificationLogs[0];

  return (
    <div className="space-y-8 p-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <Link
          href={`/${portal}/documents`}
          className={`inline-flex items-center gap-2 text-sm font-black text-slate-500 transition ${
            accent === "blue" ? "hover:text-blue-700" : "hover:text-emerald-700"
          }`}
        >
          <ArrowLeft className="size-4" />
          Back to Documents
        </Link>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p
              className={`text-sm font-black uppercase tracking-[0.28em] ${
                accent === "blue" ? "text-blue-600" : "text-emerald-600"
              }`}
            >
              Document Request Detail
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              {request.documentTypeName}
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
              {request.documentTypeCode} · {request.documentCategory} ·{" "}
              {request.isMandatoryDefault ? "Mandatory" : "Optional"}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <AppStatusBadge tone={getDocumentStatusTone(request.requestStatus)}>
                Request: {formatStatus(request.requestStatus)}
              </AppStatusBadge>

              {latestSubmission ? (
                <AppStatusBadge
                  tone={getDocumentStatusTone(latestSubmission.submissionStatus)}
                >
                  Submission: {formatStatus(latestSubmission.submissionStatus)}
                </AppStatusBadge>
              ) : (
                <AppStatusBadge tone="neutral">No Submission</AppStatusBadge>
              )}

              {latestVerification ? (
                <AppStatusBadge
                  tone={getDocumentStatusTone(latestVerification.verificationStatus)}
                >
                  Verification:{" "}
                  {formatStatus(latestVerification.verificationStatus)}
                </AppStatusBadge>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/${portal}/bookings/${request.bookingId}`}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-black text-white shadow-sm transition hover:bg-slate-800"
            >
              Open Booking
            </Link>

            <Link
              href={`/${portal}/customers/${request.leadId}`}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            >
              Open Customer
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <FileText
              className={`size-6 ${
                accent === "blue" ? "text-blue-600" : "text-emerald-600"
              }`}
            />
            <p className="mt-4 text-lg font-black text-slate-950">
              {formatStatus(request.requestStatus)}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Request status
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <CalendarClock className="size-6 text-amber-600" />
            <p className="mt-4 text-lg font-black text-slate-950">
              {formatDateTime(request.dueAt)}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">Due date</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <ClipboardCheck className="size-6 text-emerald-600" />
            <p className="mt-4 text-lg font-black text-slate-950">
              {submissions.length}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Submissions
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <History className="size-6 text-slate-600" />
            <p className="mt-4 text-lg font-black text-slate-950">
              {verificationLogs.length}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Verification logs
            </p>
          </div>
        </div>
      </section>

      <DocumentUploadComposer
        requestId={request.requestId}
        requestStatus={request.requestStatus}
        latestSubmissionStatus={latestSubmission?.submissionStatus}
      />

      {portal === "admin" ? (
        <DocumentVerificationActionPanel
          requestId={request.requestId}
          requestStatus={request.requestStatus}
          latestSubmissionId={latestSubmission?.id}
          latestSubmissionStatus={latestSubmission?.submissionStatus}
        />
      ) : null}

      <section className="grid gap-8 xl:grid-cols-2">
        <InfoCard icon={<UserRound className="size-5" />} title="Customer">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Name" value={getCustomerName(request)} />
            <Field label="Phone" value={request.customerPhone ?? "-"} />
            <Field label="Email" value={request.customerEmail ?? "-"} />
            <Field label="Lead Status" value={formatStatus(request.leadStatus)} />
          </div>
        </InfoCard>

        <InfoCard
          icon={<BriefcaseBusiness className="size-5" />}
          title="Booking"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Booking Code" value={request.bookingCode} />
            <Field
              label="Booking Status"
              value={
                <AppStatusBadge tone={getBookingStatusTone(request.bookingStatus)}>
                  {formatBookingStatus(request.bookingStatus)}
                </AppStatusBadge>
              }
            />
            <Field label="Project" value={getProjectName(request)} />
            <Field
              label="Fee"
              value={`${formatMoney(
                request.bookingFeePaidAmount,
                request.bookingFeeCurrency,
              )} paid / ${formatMoney(
                request.bookingFeeAmount,
                request.bookingFeeCurrency,
              )}`}
            />
          </div>
        </InfoCard>

        <InfoCard icon={<UserRound className="size-5" />} title="Participant">
          {request.participantId ? (
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Name" value={request.participantName ?? "-"} />
              <Field label="Role" value={request.participantRole ?? "-"} />
              <Field label="Phone" value={request.participantPhone ?? "-"} />
              <Field label="Email" value={request.participantEmail ?? "-"} />
              <Field
                label="Identity Type"
                value={request.participantIdentityType ?? "-"}
              />
              <Field
                label="Identity No"
                value={request.participantIdentityNoMasked ?? "-"}
              />
            </div>
          ) : (
            <EmptyState>This is a booking-level document request.</EmptyState>
          )}
        </InfoCard>

        <InfoCard icon={<FileText className="size-5" />} title="Request Notes">
          {request.notes ? (
            <p className="text-sm leading-7 text-slate-600">{request.notes}</p>
          ) : (
            <EmptyState>No request note.</EmptyState>
          )}
        </InfoCard>
      </section>

      <InfoCard icon={<ClipboardCheck className="size-5" />} title="Submissions">
        {submissions.length > 0 ? (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-black text-slate-950">
                      Version {submission.versionNo}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Uploaded {formatDateTime(submission.uploadedAt)}
                    </p>
                  </div>

                  <AppStatusBadge
                    tone={getDocumentStatusTone(submission.submissionStatus)}
                  >
                    {formatStatus(submission.submissionStatus)}
                  </AppStatusBadge>
                </div>

                <div className="mt-4 grid gap-4 text-sm md:grid-cols-3">
                  <Field
                    label="File"
                    value={
                      submission.fileUrl ? (
                        <a
                          href={submission.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-black text-blue-700 hover:underline"
                        >
                          Open file
                        </a>
                      ) : (
                        submission.fileId ?? "-"
                      )
                    }
                  />
                  <Field label="File Type" value={submission.fileMimeType ?? "-"} />
                  <Field label="File Size" value={formatFileSize(submission.fileSize)} />
                  <Field label="Submission ID" value={submission.id} />
                  <Field
                    label="Uploaded By"
                    value={submission.uploadedByUserId ?? "-"}
                  />
                  <Field label="Created" value={formatDateTime(submission.createdAt)} />
                </div>

                {submission.notes ? (
                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    {submission.notes}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>No document submission yet.</EmptyState>
        )}
      </InfoCard>

      <InfoCard
        icon={<ClipboardCheck className="size-5" />}
        title="Verification Logs"
      >
        {verificationLogs.length > 0 ? (
          <div className="space-y-4">
            {verificationLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-black text-slate-950">
                      {formatStatus(log.verificationStatus)}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Verified {formatDateTime(log.verifiedAt)}
                    </p>
                  </div>

                  <AppStatusBadge tone={getDocumentStatusTone(log.verificationStatus)}>
                    {formatStatus(log.verificationStatus)}
                  </AppStatusBadge>
                </div>

                <div className="mt-4 grid gap-4 text-sm md:grid-cols-3">
                  <Field label="Submission ID" value={log.submissionId} />
                  <Field label="Verified By" value={log.verifiedByUserId ?? "-"} />
                  <Field label="Reason Code" value={log.reasonCode ?? "-"} />
                </div>

                {log.reasonNote ? (
                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    {log.reasonNote}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>No verification log yet.</EmptyState>
        )}
      </InfoCard>
    </div>
  );
}
