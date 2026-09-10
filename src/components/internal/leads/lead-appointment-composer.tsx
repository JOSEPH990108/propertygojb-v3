"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, MapPin } from "lucide-react";

import { AppSelect, type AppSelectOption } from "@/components/common/app-select";
import { Input } from "@/components/ui/input";
import { postJson } from "@/lib/api/client";
import { appToast } from "@/lib/app-toast";

type LeadAppointmentProjectOption = {
  id: string;
  name: string;
};

type ExistingLeadAppointment = {
  id: string;
  projectId: string;
  scheduledAt: string;
  durationMinutes: number;
  locationText: string;
  note: string;
  status: string;
};

type LeadAppointmentComposerProps = {
  leadId: string;
  projectOptions: LeadAppointmentProjectOption[];
  existingAppointment?: ExistingLeadAppointment | null;
  disabled?: boolean;
};

function toDateInput(value?: string) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toTimeInput(value?: string) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

export function LeadAppointmentComposer({
  leadId,
  projectOptions,
  existingAppointment = null,
  disabled = false,
}: LeadAppointmentComposerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isEditMode = Boolean(existingAppointment?.id);

  const [projectId, setProjectId] = useState(
    existingAppointment?.projectId || projectOptions[0]?.id || "",
  );
  const [date, setDate] = useState(toDateInput(existingAppointment?.scheduledAt));
  const [time, setTime] = useState(toTimeInput(existingAppointment?.scheduledAt));
  const [durationMinutes, setDurationMinutes] = useState(
    String(existingAppointment?.durationMinutes ?? 60),
  );
  const [locationText, setLocationText] = useState(
    existingAppointment?.locationText ?? "",
  );
  const [note, setNote] = useState(existingAppointment?.note ?? "");

  const options = useMemo<AppSelectOption[]>(
    () =>
      projectOptions.map((project) => ({
        value: project.id,
        label: project.name,
        leading: (
          <span className="grid size-8 place-items-center rounded-xl bg-blue-100 text-blue-700">
            <MapPin className="size-4" />
          </span>
        ),
      })),
    [projectOptions],
  );

  const canSubmit =
    Boolean(projectId && date && time) &&
    !disabled &&
    !isPending &&
    projectOptions.length > 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      appToast.error("Please select project, date, and time.");
      return;
    }

    const scheduledAt = new Date(`${date}T${time}:00`);

    startTransition(async () => {
      const result = await postJson("/api/internal/leads/appointment", {
        activityId: existingAppointment?.id ?? null,
        leadId,
        projectId,
        scheduledAt: scheduledAt.toISOString(),
        durationMinutes: Number(durationMinutes),
        locationText,
        note,
      });

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      appToast.success(
        result.message ??
          (isEditMode
            ? "Viewing appointment updated."
            : "Viewing appointment created."),
      );

      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isEditMode ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
          {existingAppointment?.status === "REQUESTED"
            ? "Customer preferred time loaded. Review the details and save to confirm this appointment."
            : "Active viewing appointment found. Updating this form will edit the scheduled appointment instead of creating a duplicate."}
        </div>
      ) : null}

      <AppSelect
        value={projectId}
        options={options}
        onValueChange={setProjectId}
        disabled={disabled || isPending || projectOptions.length === 0}
        placeholder={
          projectOptions.length === 0 ? "No project enquiry found" : "Select project"
        }
        triggerClassName="h-11 rounded-xl bg-white"
        renderValue={(option) => (
          <span className="inline-flex items-center gap-2">
            {option?.leading}
            <span>{option?.label ?? "Select project"}</span>
          </span>
        )}
        renderOption={(option) => (
          <>
            {option.leading}
            <span className="font-bold">{option.label}</span>
          </>
        )}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          disabled={disabled || isPending}
          className="h-11 rounded-xl"
        />

        <Input
          type="time"
          value={time}
          onChange={(event) => setTime(event.target.value)}
          disabled={disabled || isPending}
          className="h-11 rounded-xl"
        />

        <Input
          type="number"
          min={15}
          max={480}
          value={durationMinutes}
          onChange={(event) => setDurationMinutes(event.target.value)}
          disabled={disabled || isPending}
          className="h-11 rounded-xl"
          placeholder="Duration"
        />
      </div>

      <Input
        value={locationText}
        onChange={(event) => setLocationText(event.target.value)}
        disabled={disabled || isPending}
        className="h-11 rounded-xl"
        placeholder="Viewing location / sales gallery / meet-up point"
      />

      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        disabled={disabled || isPending}
        rows={3}
        placeholder="Internal appointment note..."
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
      />

      <button
        type="submit"
        disabled={!canSubmit}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <CalendarPlus className="size-4" />
        {isPending
          ? isEditMode
            ? "Updating..."
            : "Creating..."
          : isEditMode
            ? existingAppointment?.status === "REQUESTED"
              ? "Confirm Viewing Appointment"
              : "Update Viewing Appointment"
            : "Create Viewing Appointment"}
      </button>
    </form>
  );
}
