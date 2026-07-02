"use client";

import { useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { Clock3, PlayCircle, SearchCheck } from "lucide-react";

import { postJson } from "@/lib/api/client";
import { appToast } from "@/lib/app-toast";
import { formatDateTime } from "@/lib/bookings/format";

type ExpiryResult = {
  message?: string;
  checkedAt: string;
  dryRun: boolean;
  limit: number;
  scannedCount: number;
  expiredCount: number;
  expiredBookings: {
    bookingId: string;
    bookingCode: string;
    bookingUnitId: string;
    previousStatus: string;
    nextStatus: "EXPIRED";
    reservationExpiresAt: string | Date | null;
    unitReleased: boolean;
    unitSetAvailable: boolean;
    dryRun: boolean;
  }[];
};

function toDate(value: string | Date | null | undefined) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value : new Date(value);
}

export function BookingExpiryActionPanel() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lastResult, setLastResult] = useState<ExpiryResult | null>(null);

  function runExpiryCheck(dryRun: boolean) {
    startTransition(async () => {
      const result = await postJson<ExpiryResult>(
        "/api/internal/bookings/expire",
        {
          dryRun,
          limit: 100,
        },
      );

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      setLastResult(result);
      appToast.success(result.message ?? "Expiry check completed.");

      if (!dryRun) {
        router.refresh();
      }
    });
  }

  return (
    <section className="rounded-3xl border border-amber-200 bg-amber-50/60 p-6 shadow-sm">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-amber-700">
            <Clock3 className="size-4" />
            Expiry Automation
          </div>

          <h2 className="mt-3 text-xl font-black tracking-tight text-slate-950">
            Run Booking Expiry Check
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
            Checks overdue reservation expiry dates, expires eligible bookings,
            releases booking units, and returns units to Available when safe.
            Use dry run first before running the real update.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={isPending}
            onClick={() => runExpiryCheck(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-amber-300 bg-white px-5 text-sm font-black text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <SearchCheck className="size-4" />
            {isPending ? "Checking..." : "Dry Run"}
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={() => runExpiryCheck(false)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PlayCircle className="size-4" />
            {isPending ? "Running..." : "Run Expiry"}
          </button>
        </div>
      </div>

      {lastResult ? (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-white p-4">
          <div className="grid gap-3 text-sm md:grid-cols-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                Mode
              </p>
              <p className="mt-1 font-black text-slate-900">
                {lastResult.dryRun ? "Dry Run" : "Real Run"}
              </p>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                Scanned
              </p>
              <p className="mt-1 font-black text-slate-900">
                {lastResult.scannedCount}
              </p>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                Expired
              </p>
              <p className="mt-1 font-black text-slate-900">
                {lastResult.expiredCount}
              </p>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                Checked At
              </p>
              <p className="mt-1 font-black text-slate-900">
                {formatDateTime(toDate(lastResult.checkedAt))}
              </p>
            </div>
          </div>

          {lastResult.expiredBookings.length > 0 ? (
            <div className="mt-4 space-y-2">
              {lastResult.expiredBookings.slice(0, 5).map((booking) => (
                <div
                  key={`${booking.bookingId}-${booking.bookingUnitId}`}
                  className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm"
                >
                  <div className="font-black text-slate-950">
                    {booking.bookingCode}
                  </div>
                  <div className="mt-1 text-xs font-semibold text-slate-500">
                    {booking.previousStatus} → {booking.nextStatus} · Expires{" "}
                    {formatDateTime(toDate(booking.reservationExpiresAt))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
