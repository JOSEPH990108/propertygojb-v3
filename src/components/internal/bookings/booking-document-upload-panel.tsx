"use client";

import { ChangeEvent, FormEvent, useMemo, useState, useTransition } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { FileUp, Loader2, UploadCloud } from "lucide-react";

import { AppStatusBadge } from "@/components/common/app-status-badge";
import { appToast } from "@/lib/app-toast";
import { formatDateTime } from "@/lib/bookings/format";

type DocumentRequest = {
  id: string;
  requestStatus: string;
  dueAt?: Date | null;
  notes?: string | null;
  documentTypeName?: string | null;
  documentTypeCode?: string | null;
  latestSubmissionId?: string | null;
  latestSubmissionStatus?: string | null;
  latestSubmissionVersionNo?: number | null;
  latestSubmissionUploadedAt?: Date | null;
};

type BookingDocumentUploadPanelProps = {
  bookingStatus: string;
  documentRequests: DocumentRequest[];
  portalLabel: "Admin" | "Agent";
};

type UploadState = {
  requestId: string;
  file: File | null;
  notes: string;
};

function formatDocumentStatus(status: string | null | undefined) {
  if (!status) {
    return "Unknown";
  }

  return status
    .split("_")
    .map((part) => part.slice(0, 1) + part.slice(1).toLowerCase())
    .join(" ");
}

function getDocumentStatusTone(
  status: string | null | undefined,
): "success" | "danger" | "warning" | "info" | "neutral" {
  switch (status) {
    case "VERIFIED":
    case "WAIVED":
      return "success";
    case "REJECTED":
      return "danger";
    case "SUBMITTED":
      return "info";
    case "REQUESTED":
      return "warning";
    default:
      return "neutral";
  }
}

function isClosedDocumentStatus(status: string | null | undefined) {
  return status === "VERIFIED" || status === "WAIVED";
}

function isInactiveBookingStatus(status: string) {
  return status === "REJECTED" || status === "EXPIRED" || status === "CANCELLED";
}

function getDocumentName(request: DocumentRequest) {
  return (
    request.documentTypeName ??
    request.documentTypeCode ??
    "Requested document"
  );
}

export function BookingDocumentUploadPanel({
  bookingStatus,
  documentRequests,
  portalLabel,
}: BookingDocumentUploadPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploadState, setUploadState] = useState<UploadState>({
    requestId: "",
    file: null,
    notes: "",
  });

  const uploadableRequests = useMemo(
    () =>
      documentRequests.filter(
        (request) => !isClosedDocumentStatus(request.requestStatus),
      ),
    [documentRequests],
  );

  const selectedRequest = uploadableRequests.find(
    (request) => request.id === uploadState.requestId,
  );

  const isInactive = isInactiveBookingStatus(bookingStatus);

  function handleRequestChange(event: ChangeEvent<HTMLSelectElement>) {
    setUploadState((current) => ({
      ...current,
      requestId: event.target.value,
    }));
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setUploadState((current) => ({
      ...current,
      file: event.target.files?.[0] ?? null,
    }));
  }

  function handleNotesChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setUploadState((current) => ({
      ...current,
      notes: event.target.value,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isInactive) {
      appToast.error("Document cannot be uploaded for inactive booking.");
      return;
    }

    if (!uploadState.requestId) {
      appToast.error("Please select a document request.");
      return;
    }

    if (!uploadState.file) {
      appToast.error("Please choose a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("requestId", uploadState.requestId);
    formData.append("notes", uploadState.notes);
    formData.append("file", uploadState.file);

    startTransition(async () => {
      const response = await fetch("/api/internal/documents/upload", {
        method: "POST",
        body: formData,
      });

      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
        error?: {
          message?: string;
        };
      };

      if (!response.ok || result.ok === false) {
        appToast.error(
          result.error?.message ?? result.message ?? "Document upload failed.",
        );
        return;
      }

      appToast.success(result.message ?? "Document uploaded successfully.");
      setUploadState({
        requestId: "",
        file: null,
        notes: "",
      });
      router.refresh();
    });
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-blue-700">
            <FileUp className="size-4" />
            Document Upload
          </div>

          <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
            Upload requested documents
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            {portalLabel === "Agent"
              ? "Upload documents for your assigned booking. Admin will verify or reject each submission."
              : "Upload buyer documents directly from this booking detail page."}
          </p>
        </div>

        <AppStatusBadge tone={uploadableRequests.length > 0 ? "warning" : "success"}>
          {uploadableRequests.length} pending upload(s)
        </AppStatusBadge>
      </div>

      {documentRequests.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
          No document requests have been created for this booking yet.
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {documentRequests.map((request) => (
            <div
              key={request.id}
              className="rounded-2xl border border-slate-200 p-4"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="font-semibold text-slate-950">
                    {getDocumentName(request)}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    Due: {formatDateTime(request.dueAt ?? null)}
                  </div>
                  {request.notes ? (
                    <p className="mt-2 text-sm text-slate-500">{request.notes}</p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <AppStatusBadge tone={getDocumentStatusTone(request.requestStatus)}>
                    {formatDocumentStatus(request.requestStatus)}
                  </AppStatusBadge>

                  <Link
                    href={`/${portalLabel.toLowerCase()}/documents/${request.id}`}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
                  >
                    View Detail
                  </Link>
                </div>
              </div>

              {request.latestSubmissionId ? (
                <div className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500">
                  Latest submission: v{request.latestSubmissionVersionNo ?? "-"} ·{" "}
                  {formatDocumentStatus(request.latestSubmissionStatus)} ·{" "}
                  {formatDateTime(request.latestSubmissionUploadedAt ?? null)}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {uploadableRequests.length > 0 ? (
        <form onSubmit={handleSubmit} className="mt-6 rounded-2xl bg-slate-50 p-5">
          <div className="grid gap-4 xl:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                Document Request
              </label>
              <select
                value={uploadState.requestId}
                onChange={handleRequestChange}
                disabled={isPending || isInactive}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="">Select document to upload</option>
                {uploadableRequests.map((request) => (
                  <option key={request.id} value={request.id}>
                    {getDocumentName(request)} ·{" "}
                    {formatDocumentStatus(request.requestStatus)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                File
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                disabled={isPending || isInactive}
                className="block h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 file:mr-4 file:rounded-xl file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-xs file:font-black file:text-blue-700 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              Notes
            </label>
            <textarea
              value={uploadState.notes}
              onChange={handleNotesChange}
              disabled={isPending || isInactive}
              rows={3}
              placeholder={
                selectedRequest
                  ? `Optional note for ${getDocumentName(selectedRequest)}`
                  : "Optional upload note"
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </div>

          {isInactive ? (
            <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              This booking is inactive, so document upload is disabled.
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isPending || isInactive}
            className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <UploadCloud className="size-4" />
            )}
            Upload Document
          </button>
        </form>
      ) : null}
    </section>
  );
}
