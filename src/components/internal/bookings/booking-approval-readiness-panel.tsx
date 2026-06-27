import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  FileCheck2,
  ShieldCheck,
} from "lucide-react";

import { formatDateTime, formatMoney } from "@/lib/bookings/format";
import type { getBookingDetailById } from "@/lib/bookings/queries";

type BookingDetail = NonNullable<
  Awaited<ReturnType<typeof getBookingDetailById>>
>;

type BookingApprovalReadinessPanelProps = {
  detail: BookingDetail;
};

function toAmount(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);

  if (Number.isNaN(amount)) {
    return 0;
  }

  return amount;
}

function isDocumentResolved(status: string | null) {
  return status === "VERIFIED" || status === "WAIVED";
}

function getDocumentStatusClassName(status: string | null) {
  if (status === "VERIFIED" || status === "WAIVED") {
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  }

  if (status === "REJECTED") {
    return "border-rose-100 bg-rose-50 text-rose-700";
  }

  return "border-amber-100 bg-amber-50 text-amber-700";
}

function formatDocumentStatus(status: string | null) {
  if (!status) {
    return "Unknown";
  }

  return status
    .split("_")
    .map((part) => part.slice(0, 1) + part.slice(1).toLowerCase())
    .join(" ");
}

export function BookingApprovalReadinessPanel({
  detail,
}: BookingApprovalReadinessPanelProps) {
  const { booking, documentRequests } = detail;

  const bookingFeeAmount = toAmount(booking.bookingFeeAmount);
  const bookingFeePaidAmount = toAmount(booking.bookingFeePaidAmount);
  const outstandingAmount = Math.max(bookingFeeAmount - bookingFeePaidAmount, 0);
  const isPaymentReady =
    bookingFeeAmount <= 0 || bookingFeePaidAmount >= bookingFeeAmount;

  const unresolvedDocuments = documentRequests.filter(
    (request) => !isDocumentResolved(request.requestStatus),
  );

  const isDocumentReady = unresolvedDocuments.length === 0;
  const canApprove = isPaymentReady && isDocumentReady;

  return (
    <section
      className={`rounded-3xl border p-6 shadow-sm ${
        canApprove
          ? "border-emerald-100 bg-emerald-50/70"
          : "border-amber-100 bg-amber-50/70"
      }`}
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div
            className={`flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] ${
              canApprove ? "text-emerald-700" : "text-amber-700"
            }`}
          >
            <ShieldCheck className="size-4" />
            Approval Readiness
          </div>

          <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
            {canApprove ? "Ready for approval" : "Approval blocked"}
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            This pre-check mirrors the approval API guard. Payment must be fully
            paid and requested documents must be verified or waived before this
            booking can be approved.
          </p>
        </div>

        <div
          className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black ${
            canApprove
              ? "bg-emerald-600 text-white"
              : "bg-amber-500 text-white"
          }`}
        >
          {canApprove ? (
            <CheckCircle2 className="size-4" />
          ) : (
            <AlertTriangle className="size-4" />
          )}
          {canApprove ? "Can Approve" : "Needs Action"}
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-white/80 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div
              className={`grid size-10 place-items-center rounded-xl ${
                isPaymentReady
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              <CreditCard className="size-5" />
            </div>

            <div>
              <h3 className="font-black text-slate-950">Payment Check</h3>
              <p className="text-sm font-semibold text-slate-500">
                {isPaymentReady ? "Fully paid" : "Payment not complete"}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 text-sm md:grid-cols-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                Fee
              </p>
              <p className="mt-1 font-black text-slate-900">
                {formatMoney(
                  booking.bookingFeeAmount,
                  booking.bookingFeeCurrency,
                )}
              </p>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                Paid
              </p>
              <p className="mt-1 font-black text-slate-900">
                {formatMoney(
                  booking.bookingFeePaidAmount,
                  booking.bookingFeeCurrency,
                )}
              </p>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                Outstanding
              </p>
              <p className="mt-1 font-black text-slate-900">
                {formatMoney(outstandingAmount, booking.bookingFeeCurrency)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/80 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div
              className={`grid size-10 place-items-center rounded-xl ${
                isDocumentReady
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              <FileCheck2 className="size-5" />
            </div>

            <div>
              <h3 className="font-black text-slate-950">Document Check</h3>
              <p className="text-sm font-semibold text-slate-500">
                {isDocumentReady
                  ? "No pending document blockers"
                  : `${unresolvedDocuments.length} document blocker(s)`}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {documentRequests.length === 0 ? (
              <p className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
                No document requests have been created for this booking.
              </p>
            ) : (
              documentRequests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-900">
                        {request.documentTypeName}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {request.documentTypeCode} · Due{" "}
                        {formatDateTime(request.dueAt)}
                      </p>
                    </div>

                    <span
                      className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-black ${getDocumentStatusClassName(
                        request.requestStatus,
                      )}`}
                    >
                      {formatDocumentStatus(request.requestStatus)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {!canApprove ? (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-100/60 px-4 py-3 text-sm font-bold text-amber-900">
          Fix the blockers above before changing this booking to Approved.
        </div>
      ) : null}
    </section>
  );
}
