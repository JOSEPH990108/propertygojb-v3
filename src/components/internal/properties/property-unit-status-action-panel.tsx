"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { Home, RefreshCcw } from "lucide-react";

import { AppSelect, type AppSelectOption } from "@/components/common/app-select";
import { AppStatusBadge } from "@/components/common/app-status-badge";
import { postJson } from "@/lib/api/client";
import { appToast } from "@/lib/app-toast";

type BookingStatusOption = {
  id: string;
  code: string;
  name: string;
  color: string | null;
};

type PropertyUnitStatusActionPanelProps = {
  unitId: string;
  currentStatusId: string;
  currentStatusCode: string;
  currentStatusName: string;
  statusOptions: BookingStatusOption[];
};

type UpdateUnitStatusResult = {
  unitId: string;
  unitNo: string;
  statusCode: string;
  statusName: string;
  message?: string;
};

function getStatusTone(
  statusCode: string,
): "success" | "danger" | "warning" | "info" | "neutral" {
  switch (statusCode) {
    case "AVAILABLE":
    case "READY":
    case "OPEN":
      return "success";
    case "RESERVED":
    case "BOOKING":
    case "BOOKED":
    case "PENDING":
      return "warning";
    case "APPROVED":
    case "SPA_SIGNED":
    case "SOLD":
    case "COMPLETED":
      return "danger";
    default:
      return "neutral";
  }
}

function StatusDot({ statusCode }: { statusCode: string }) {
  const className =
    statusCode === "AVAILABLE"
      ? "bg-emerald-500"
      : statusCode === "APPROVED" || statusCode === "SPA_SIGNED" || statusCode === "SOLD"
        ? "bg-rose-500"
        : statusCode === "RESERVED" ||
            statusCode === "BOOKED" ||
            statusCode === "PENDING"
          ? "bg-amber-500"
          : "bg-slate-400";

  return <span className={`size-2.5 rounded-full ${className}`} />;
}

export function PropertyUnitStatusActionPanel({
  unitId,
  currentStatusId,
  currentStatusCode,
  currentStatusName,
  statusOptions,
}: PropertyUnitStatusActionPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [bookingStatusId, setBookingStatusId] = useState(currentStatusId);
  const [note, setNote] = useState("");

  const options = useMemo<AppSelectOption[]>(
    () =>
      statusOptions.map((status) => ({
        value: status.id,
        label: status.name,
        leading: (
          <span className="grid size-9 place-items-center rounded-2xl bg-slate-50">
            <StatusDot statusCode={status.code} />
          </span>
        ),
      })),
    [statusOptions],
  );

  const selectedStatus =
    statusOptions.find((status) => status.id === bookingStatusId) ?? null;

  const canSubmit =
    !isPending &&
    Boolean(bookingStatusId) &&
    bookingStatusId !== currentStatusId;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      appToast.error("Please select a different status.");
      return;
    }

    startTransition(async () => {
      const result = await postJson<UpdateUnitStatusResult>(
        "/api/internal/properties/unit-status",
        {
          unitId,
          bookingStatusId,
          note,
        },
      );

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      appToast.success(result.message ?? "Unit status updated.");
      router.refresh();
    });
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <Home className="h-4 w-4" />
            Admin Inventory Action
          </div>

          <h2 className="mt-3 text-xl font-black tracking-tight text-slate-950">
            Update Unit Status
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Manually update inventory booking status for this unit.
          </p>
        </div>

        <AppStatusBadge tone={getStatusTone(currentStatusCode)}>
          Current: {currentStatusName}
        </AppStatusBadge>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-5 grid gap-4 xl:grid-cols-[22rem_1fr_auto] xl:items-start"
      >
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            New Status
          </label>

          <AppSelect
            value={bookingStatusId}
            options={options}
            onValueChange={setBookingStatusId}
            disabled={isPending}
            placeholder="Select status"
            triggerClassName="h-14 w-full rounded-2xl bg-white"
            renderValue={(option) => (
              <span className="flex min-w-0 items-center gap-2">
                {option?.leading}
                <span className="min-w-0">
                  <span className="block truncate font-black">
                    {option?.label ?? "Select status"}
                  </span>
                  <span className="block truncate text-xs font-semibold text-slate-500">
                    {selectedStatus?.code ?? "-"}
                  </span>
                </span>
              </span>
            )}
            renderOption={(option) => {
              const status = statusOptions.find(
                (item) => item.id === option.value,
              );

              return (
                <>
                  {option.leading}
                  <span className="min-w-0">
                    <span className="block truncate font-bold">
                      {option.label}
                    </span>
                    <span className="block truncate text-xs font-semibold text-slate-500">
                      {status?.code ?? "-"}
                    </span>
                  </span>
                </>
              );
            }}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            Internal Note
          </label>

          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            disabled={isPending}
            rows={3}
            placeholder="Optional note, e.g. manual correction after booking cancelled..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
          />
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60 xl:mt-7"
        >
          <RefreshCcw className="size-4" />
          {isPending ? "Updating..." : "Update"}
        </button>
      </form>
    </section>
  );
}
