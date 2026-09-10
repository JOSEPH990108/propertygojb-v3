"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { CheckCircle2, FileCheck2, RotateCw, ShieldX } from "lucide-react";

import { AppSelect, type AppSelectOption } from "@/components/common/app-select";
import { AppStatusBadge } from "@/components/common/app-status-badge";
import { postJson } from "@/lib/api/client";
import { appToast } from "@/lib/app-toast";

type DocumentVerificationActionPanelProps = {
  requestId: string;
  requestStatus: string;
  latestSubmissionId?: string | null;
  latestSubmissionStatus?: string | null;
};

type DocumentVerificationResult = {
  requestId: string;
  bookingId: string;
  status: string;
  message?: string;
};

const actionOptions = [
  {
    value: "UNDER_REVIEW",
    label: "Mark Under Review",
    description: "Move latest submission into review.",
    tone: "warning",
  },
  {
    value: "VERIFY",
    label: "Verify Document",
    description: "Approve the latest submitted document.",
    tone: "success",
  },
  {
    value: "REJECT",
    label: "Reject Document",
    description: "Reject with a reason for follow-up.",
    tone: "danger",
  },
  {
    value: "WAIVE",
    label: "Waive Request",
    description: "Close this request without submission.",
    tone: "info",
  },
] as const;

function formatStatus(value: string | null | undefined) {
  if (!value) {
    return "Unknown";
  }

  return value
    .split("_")
    .map((part) => part.slice(0, 1) + part.slice(1).toLowerCase())
    .join(" ");
}

function getStatusTone(
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

function needsReason(action: string) {
  return action === "REJECT" || action === "WAIVE";
}

function needsSubmission(action: string) {
  return action !== "WAIVE";
}

export function DocumentVerificationActionPanel({
  requestId,
  requestStatus,
  latestSubmissionId,
  latestSubmissionStatus,
}: DocumentVerificationActionPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [action, setAction] = useState("VERIFY");
  const [reasonNote, setReasonNote] = useState("");

  const isClosed = ["VERIFIED", "WAIVED"].includes(requestStatus);
  const hasSubmission = Boolean(latestSubmissionId);

  const options = useMemo<AppSelectOption[]>(
    () =>
      actionOptions.map((item) => ({
        value: item.value,
        label: item.label,
        leading: (
          <span className="grid size-9 place-items-center rounded-2xl bg-slate-50 text-slate-700">
            {item.value === "VERIFY" ? (
              <CheckCircle2 className="size-4 text-emerald-600" />
            ) : item.value === "REJECT" ? (
              <ShieldX className="size-4 text-rose-600" />
            ) : (
              <RotateCw className="size-4 text-blue-600" />
            )}
          </span>
        ),
      })),
    [],
  );

  const selectedAction =
    actionOptions.find((item) => item.value === action) ?? actionOptions[0];

  const canSubmit =
    !isClosed &&
    !isPending &&
    Boolean(action) &&
    (!needsSubmission(action) || hasSubmission) &&
    (!needsReason(action) || reasonNote.trim().length > 0);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      if (needsSubmission(action) && !hasSubmission) {
        appToast.error("A document submission is required for this action.");
        return;
      }

      if (needsReason(action)) {
        appToast.error("Please provide a reason.");
        return;
      }

      appToast.error("Please select a valid action.");
      return;
    }

    startTransition(async () => {
      const result = await postJson<DocumentVerificationResult>(
        "/api/internal/documents/verification",
        {
          requestId,
          submissionId: latestSubmissionId ?? "",
          action,
          reasonNote,
        },
      );

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      appToast.success(result.message ?? "Document updated.");
      router.refresh();
    });
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <FileCheck2 className="h-4 w-4" />
            Admin Document Action
          </div>

          <h2 className="mt-3 text-xl font-black tracking-tight text-slate-950">
            Verify Document
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Review the latest document submission, then verify, reject, or waive
            the request.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AppStatusBadge tone={getStatusTone(requestStatus)}>
            Request: {formatStatus(requestStatus)}
          </AppStatusBadge>
          {latestSubmissionStatus ? (
            <AppStatusBadge tone={getStatusTone(latestSubmissionStatus)}>
              Submission: {formatStatus(latestSubmissionStatus)}
            </AppStatusBadge>
          ) : (
            <AppStatusBadge tone="neutral">No Submission</AppStatusBadge>
          )}
        </div>
      </div>

      {isClosed ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
          This document request is already closed.
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-5 grid gap-4 xl:grid-cols-[22rem_1fr_auto] xl:items-start"
        >
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              Action
            </label>

            <AppSelect
              value={action}
              options={options}
              onValueChange={setAction}
              disabled={isPending}
              placeholder="Select action"
              triggerClassName="h-14 w-full rounded-2xl bg-white"
              renderValue={(option) => (
                <span className="flex min-w-0 items-center gap-2">
                  {option?.leading}
                  <span className="min-w-0">
                    <span className="block truncate font-black">
                      {option?.label ?? "Select action"}
                    </span>
                    <span className="block truncate text-xs font-semibold text-slate-500">
                      {selectedAction.description}
                    </span>
                  </span>
                </span>
              )}
              renderOption={(option) => {
                const current = actionOptions.find(
                  (item) => item.value === option.value,
                );

                return (
                  <>
                    {option.leading}
                    <span className="min-w-0">
                      <span className="block truncate font-bold">
                        {option.label}
                      </span>
                      <span className="block truncate text-xs font-semibold text-slate-500">
                        {current?.description}
                      </span>
                    </span>
                  </>
                );
              }}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              Reason / Note
            </label>

            <textarea
              value={reasonNote}
              onChange={(event) => setReasonNote(event.target.value)}
              disabled={isPending}
              rows={3}
              placeholder={
                needsReason(action)
                  ? "Required for rejected or waived document..."
                  : "Optional internal note..."
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
            />

            {needsSubmission(action) && !hasSubmission ? (
              <p className="text-xs font-bold text-amber-600">
                This action requires a submitted document. Use Waive Request if
                no submission is needed.
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60 xl:mt-7"
          >
            <FileCheck2 className="size-4" />
            {isPending ? "Updating..." : "Update"}
          </button>
        </form>
      )}
    </section>
  );
}
