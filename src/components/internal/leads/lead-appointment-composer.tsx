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

type LeadAppointmentComposerProps = {
  leadId: string;
  projectOptions: LeadAppointmentProjectOption[];
  disabled?: boolean;
};

export function LeadAppointmentComposer({
  leadId,
  projectOptions,
  disabled = false,
}: LeadAppointmentComposerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [projectId, setProjectId] = useState(projectOptions[0]?.id ?? "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [locationText, setLocationText] = useState("");
  const [note, setNote] = useState("");

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

      setDate("");
      setTime("");
      setDurationMinutes("60");
      setLocationText("");
      setNote("");

      appToast.success(result.message ?? "Viewing appointment created.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        {isPending ? "Creating..." : "Create Viewing Appointment"}
      </button>
    </form>
  );
}
