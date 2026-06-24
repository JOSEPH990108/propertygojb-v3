"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRight,
  Banknote,
  Building2,
  CheckCircle2,
  FileText,
  Home,
  ReceiptText,
} from "lucide-react";

import { AppSelect, type AppSelectOption } from "@/components/common/app-select";
import { Input } from "@/components/ui/input";
import { postJson } from "@/lib/api/client";
import { appToast } from "@/lib/app-toast";

type LeadBookingProjectOption = {
  id: string;
  name: string;
};

type LeadBookingUnitOption = {
  id: string;
  projectId: string;
  unitNo: string;
  priceLabel: string;
};

type LeadBookingComposerProps = {
  leadId: string;
  projectOptions: LeadBookingProjectOption[];
  unitOptions: LeadBookingUnitOption[];
  disabled?: boolean;
};

type CreateLeadBookingResult = {
  bookingId: string;
  bookingCode: string;
  alreadyExists: boolean;
  message?: string;
};

export function LeadBookingComposer({
  leadId,
  projectOptions,
  unitOptions,
  disabled = false,
}: LeadBookingComposerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [projectId, setProjectId] = useState(projectOptions[0]?.id ?? "");
  const [unitId, setUnitId] = useState("");
  const [bookingFeeAmount, setBookingFeeAmount] = useState("0");
  const [note, setNote] = useState("");

  const projectSelectOptions = useMemo<AppSelectOption[]>(
    () =>
      projectOptions.map((project) => ({
        value: project.id,
        label: project.name,
        leading: (
          <span className="grid size-9 place-items-center rounded-2xl bg-blue-100 text-blue-700">
            <Building2 className="size-4" />
          </span>
        ),
      })),
    [projectOptions],
  );

  const filteredUnitOptions = useMemo(
    () => unitOptions.filter((unit) => unit.projectId === projectId),
    [projectId, unitOptions],
  );

  const selectedUnit = filteredUnitOptions.find((unit) => unit.id === unitId);

  const unitSelectOptions = useMemo<AppSelectOption[]>(
    () =>
      filteredUnitOptions.map((unit) => ({
        value: unit.id,
        label: `${unit.unitNo} · ${unit.priceLabel}`,
        leading: (
          <span className="grid size-9 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
            <Home className="size-4" />
          </span>
        ),
      })),
    [filteredUnitOptions],
  );

  const canSubmit =
    Boolean(projectId && unitId) &&
    !disabled &&
    !isPending &&
    projectOptions.length > 0 &&
    filteredUnitOptions.length > 0;

  function handleProjectChange(nextProjectId: string) {
    setProjectId(nextProjectId);
    setUnitId("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      appToast.error("Please select project and available unit.");
      return;
    }

    startTransition(async () => {
      const result = await postJson<CreateLeadBookingResult>("/api/internal/leads/booking", {
        leadId,
        projectId,
        unitId,
        bookingFeeAmount: Number(bookingFeeAmount || 0),
        note,
      });

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      const portal = pathname.startsWith("/agent") ? "agent" : "admin";

      appToast.success(
        result.message ??
          (result.alreadyExists
            ? "Opening existing booking."
            : "Booking created successfully."),
      );

      router.push(`/${portal}/bookings/${result.bookingId}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              Project
            </label>
            <AppSelect
              value={projectId}
              options={projectSelectOptions}
              onValueChange={handleProjectChange}
              disabled={disabled || isPending || projectOptions.length === 0}
              placeholder={
                projectOptions.length === 0
                  ? "No project enquiry found"
                  : "Select project"
              }
              triggerClassName="h-12 w-full rounded-2xl bg-white"
              renderValue={(option) => (
                <span className="inline-flex min-w-0 items-center gap-2">
                  {option?.leading}
                  <span className="truncate">
                    {option?.label ?? "Select project"}
                  </span>
                </span>
              )}
              renderOption={(option) => (
                <>
                  {option.leading}
                  <span className="font-bold">{option.label}</span>
                </>
              )}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              Available Unit
            </label>
            <AppSelect
              value={unitId}
              options={unitSelectOptions}
              onValueChange={setUnitId}
              disabled={
                disabled ||
                isPending ||
                !projectId ||
                filteredUnitOptions.length === 0
              }
              placeholder={
                !projectId
                  ? "Select project first"
                  : filteredUnitOptions.length === 0
                    ? "No available unit found"
                    : "Select available unit"
              }
              triggerClassName="h-12 w-full rounded-2xl bg-white"
              renderValue={(option) => (
                <span className="inline-flex min-w-0 items-center gap-2">
                  {option?.leading}
                  <span className="truncate">
                    {option?.label ?? "Select available unit"}
                  </span>
                </span>
              )}
              renderOption={(option) => (
                <>
                  {option.leading}
                  <span className="font-bold">{option.label}</span>
                </>
              )}
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[18rem_1fr]">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              Booking Fee
            </label>
            <div className="relative">
              <Banknote className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="number"
                min={0}
                step="0.01"
                value={bookingFeeAmount}
                onChange={(event) => setBookingFeeAmount(event.target.value)}
                disabled={disabled || isPending}
                className="h-12 rounded-2xl bg-white pl-11 font-bold"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              Internal Note
            </label>
            <div className="relative">
              <FileText className="pointer-events-none absolute left-4 top-4 size-4 text-slate-400" />
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                disabled={disabled || isPending}
                rows={3}
                placeholder="Example: Buyer wants this unit. Waiting for booking fee proof..."
                className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>
          </div>
        </div>

        {selectedUnit ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
            <CheckCircle2 className="size-4" />
            Selected unit: {selectedUnit.unitNo}
            <span className="text-emerald-600">·</span>
            {selectedUnit.priceLabel}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-400">
            Select an available unit to continue.
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-bold text-slate-400">
          Booking will be created as draft first. Payment proof and approval can be handled later.
        </p>

        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
        >
          <ReceiptText className="size-4" />
          {isPending ? "Creating Booking..." : "Create Booking"}
          <ArrowRight className="size-4" />
        </button>
      </div>
    </form>
  );
}
