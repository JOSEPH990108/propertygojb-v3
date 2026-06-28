"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { RotateCw, SendHorizontal } from "lucide-react";

import { AppSelect, type AppSelectOption } from "@/components/common/app-select";
import { AppStatusBadge } from "@/components/common/app-status-badge";
import { postJson } from "@/lib/api/client";
import { appToast } from "@/lib/app-toast";
import {
  formatBookingStatus,
  getBookingStatusTone,
} from "@/lib/bookings/format";

type BookingStatusActionPanelProps = {
  bookingId: string;
  currentStatus: string;
  approvalReadiness?: {
    canApprove: boolean;
    blockers: string[];
  };
};

type BookingStatusResult = {
  bookingId: string;
  bookingCode: string;
  status: string;
  message?: string;
};

const statusOptions = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "DOCS_PENDING",
  "DOCS_VERIFIED",
  "PAYMENT_PENDING",
  "PAYMENT_VERIFIED",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
] as const;

const terminalStatuses = ["APPROVED", "REJECTED", "EXPIRED", "CANCELLED"];

const statusDescriptions: Record<string, string> = {
  SUBMITTED: "Send booking for internal review",
  UNDER_REVIEW: "Admin is checking booking details",
  DOCS_PENDING: "Waiting for buyer documents",
  DOCS_VERIFIED: "Documents have been checked",
  PAYMENT_PENDING: "Waiting for booking fee payment",
  PAYMENT_VERIFIED: "Booking fee payment confirmed",
  APPROVED: "Approve and lock this booking",
  REJECTED: "Reject this booking with reason",
  CANCELLED: "Cancel this booking with reason",
};

function getAllowedNextStatuses(currentStatus: string) {
  switch (currentStatus) {
    case "DRAFT":
      return ["SUBMITTED", "CANCELLED"] as const;
    case "SUBMITTED":
      return [
        "UNDER_REVIEW",
        "DOCS_PENDING",
        "PAYMENT_PENDING",
        "REJECTED",
        "CANCELLED",
      ] as const;
    case "UNDER_REVIEW":
      return ["DOCS_PENDING", "PAYMENT_PENDING", "REJECTED", "CANCELLED"] as const;
    case "DOCS_PENDING":
      return ["DOCS_VERIFIED", "PAYMENT_PENDING", "REJECTED", "CANCELLED"] as const;
    case "DOCS_VERIFIED":
      return [
        "PAYMENT_PENDING",
        "PAYMENT_VERIFIED",
        "APPROVED",
        "REJECTED",
        "CANCELLED",
      ] as const;
    case "PAYMENT_PENDING":
      return ["PAYMENT_VERIFIED", "DOCS_PENDING", "REJECTED", "CANCELLED"] as const;
    case "PAYMENT_VERIFIED":
      return ["DOCS_PENDING", "DOCS_VERIFIED", "APPROVED", "REJECTED", "CANCELLED"] as const;
    default:
      return [] as const;
  }
}

function getSuggestedNextStatus(currentStatus: string) {
  switch (currentStatus) {
    case "DRAFT":
      return "SUBMITTED";
    case "SUBMITTED":
      return "UNDER_REVIEW";
    case "UNDER_REVIEW":
      return "PAYMENT_PENDING";
    case "PAYMENT_PENDING":
      return "PAYMENT_VERIFIED";
    case "PAYMENT_VERIFIED":
      return "APPROVED";
    default:
      return "";
  }
}

function needsReason(status: string) {
  return status === "REJECTED" || status === "CANCELLED";
}

function getDotClassName(status: string) {
  switch (getBookingStatusTone(status)) {
    case "success":
      return "bg-emerald-500";
    case "danger":
      return "bg-rose-500";
    case "warning":
      return "bg-amber-500";
    case "info":
      return "bg-blue-500";
    default:
      return "bg-slate-400";
  }
}

function StatusDot({ status }: { status: string }) {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-slate-50">
      <span className={`size-2.5 rounded-full ${getDotClassName(status)}`} />
    </span>
  );
}

function StatusOptionContent({
  status,
  suggestedStatus,
}: {
  status: string;
  suggestedStatus: string;
}) {
  const isSuggested = status === suggestedStatus;

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3 py-1">
      <StatusDot status={status} />

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-black text-slate-950">
          {formatBookingStatus(status)}
        </span>
        <span className="mt-0.5 block truncate text-xs font-semibold text-slate-500">
          {statusDescriptions[status] ?? "Update booking status"}
        </span>
      </span>

      {isSuggested ? (
        <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-blue-700">
          Next
        </span>
      ) : null}
    </div>
  );
}

export function BookingStatusActionPanel({
  bookingId,
  currentStatus,
  approvalReadiness,
}: BookingStatusActionPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const suggestedNextStatus = getSuggestedNextStatus(currentStatus);
  const [nextStatus, setNextStatus] = useState(suggestedNextStatus);
  const [reasonNote, setReasonNote] = useState("");

  const isTerminal = terminalStatuses.includes(currentStatus);
  const allowedNextStatuses = useMemo(
    () => [...getAllowedNextStatuses(currentStatus)],
    [currentStatus],
  );

  const options = useMemo<AppSelectOption[]>(
    () =>
      statusOptions
        .filter((status) => allowedNextStatuses.includes(status))
        .map((status) => ({
          value: status,
          label: formatBookingStatus(status),
          leading: <StatusDot status={status} />,
        })),
    [allowedNextStatuses],
  );

  const selectedStatusDescription =
    statusDescriptions[nextStatus] ?? "Select the next booking status.";

  const approvalBlockers = approvalReadiness?.blockers ?? [];
  const isApprovalBlocked =
    nextStatus === "APPROVED" && approvalReadiness?.canApprove === false;

  const canSubmit =
    Boolean(nextStatus) &&
    !isApprovalBlocked &&
    nextStatus !== currentStatus &&
    !isTerminal &&
    !isPending &&
    (!needsReason(nextStatus) || reasonNote.trim().length > 0);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isApprovalBlocked) {
      appToast.error(
        approvalBlockers[0] ?? "Booking is not ready for approval yet.",
      );
      return;
    }

    if (!canSubmit) {
      appToast.error(
        needsReason(nextStatus)
          ? "Please provide a reason."
          : "Please select a valid next status.",
      );
      return;
    }

    startTransition(async () => {
      const result = await postJson<BookingStatusResult>(
        "/api/internal/bookings/status",
        {
          bookingId,
          nextStatus,
          reasonNote,
        },
      );

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      appToast.success(result.message ?? "Booking status updated.");
      router.refresh();
    });
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <RotateCw className="h-4 w-4" />
            Admin Booking Action
          </div>

          <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">
            Update Booking Status
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Move this booking through review, document checking, payment
            verification, approval, rejection, or cancellation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wide text-slate-400">
            Current
          </span>
          <AppStatusBadge tone={getBookingStatusTone(currentStatus)}>
            {formatBookingStatus(currentStatus)}
          </AppStatusBadge>
        </div>
      </div>

      {isTerminal ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
          This booking is already in a terminal status. No further action is
          available.
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-5 grid gap-4 lg:grid-cols-[22rem_1fr_auto] lg:items-start"
        >
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              Next Status
            </label>

            <AppSelect
              value={nextStatus}
              options={options}
              onValueChange={setNextStatus}
              disabled={isPending}
              placeholder="Select next status"
              triggerClassName="h-14 w-full rounded-2xl bg-white"
              renderValue={(option) => {
                const status = option?.value ?? "";

                return status ? (
                  <span className="flex min-w-0 items-center gap-3">
                    <StatusDot status={status} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-slate-950">
                        {formatBookingStatus(status)}
                      </span>
                      <span className="block truncate text-xs font-semibold text-slate-500">
                        {selectedStatusDescription}
                      </span>
                    </span>
                  </span>
                ) : (
                  <span className="text-slate-400">Select next status</span>
                );
              }}
              renderOption={(option) => (
                <StatusOptionContent
                  status={option.value}
                  suggestedStatus={suggestedNextStatus}
                />
              )}
            />

            {isApprovalBlocked ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
                <p>This booking is not ready for approval.</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {approvalBlockers.map((blocker) => (
                    <li key={blocker}>{blocker}</li>
                  ))}
                </ul>
              </div>
            ) : null}
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
                needsReason(nextStatus)
                  ? "Required for rejected or cancelled booking..."
                  : "Optional internal note..."
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
            />
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60 lg:mt-7"
          >
            <SendHorizontal className="size-4" />
            {isPending ? "Updating..." : "Update"}
          </button>
        </form>
      )}
    </section>
  );
}
