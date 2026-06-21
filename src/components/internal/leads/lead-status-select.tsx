"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Activity } from "lucide-react";

import { AppSelect, type AppSelectOption } from "@/components/common/app-select";
import { postJson } from "@/lib/api/client";
import { appToast } from "@/lib/app-toast";

type LeadStatusSelectProps = {
  leadId: string;
  currentStatus: string;
  disabled?: boolean;
};

const statusOptions = [
  ["NEW", "New"],
  ["UNCONTACTED", "Uncontacted"],
  ["ASSIGNED", "Assigned"],
  ["CONTACTED", "Contacted"],
  ["QUALIFIED", "Qualified"],
  ["APPOINTMENT_SET", "Appointment Set"],
  ["NURTURING", "Nurturing"],
  ["LOST", "Lost"],
  ["SPAM", "Spam"],
  ["CLOSED", "Closed"],
] as const;

export function LeadStatusSelect({
  leadId,
  currentStatus,
  disabled = false,
}: LeadStatusSelectProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedValue, setSelectedValue] = useState(currentStatus);

  const options = useMemo<AppSelectOption[]>(
    () =>
      statusOptions.map(([value, label]) => ({
        value,
        label,
        leading: (
          <span className="grid size-8 place-items-center rounded-xl bg-blue-100 text-blue-700">
            <Activity className="size-4" />
          </span>
        ),
      })),
    [],
  );

  function handleChange(nextValue: string) {
    if (nextValue === selectedValue) {
      return;
    }

    const previousValue = selectedValue;
    setSelectedValue(nextValue);

    startTransition(async () => {
      const result = await postJson("/api/internal/leads/status", {
        leadId,
        status: nextValue,
      });

      if (!result.ok) {
        setSelectedValue(previousValue);
        appToast.error(result.message);
        return;
      }

      appToast.success(result.message ?? "Lead status updated.");
      router.refresh();
    });
  }

  return (
    <AppSelect
      value={selectedValue}
      options={options}
      onValueChange={handleChange}
      disabled={disabled || isPending}
      triggerClassName="h-11 rounded-xl bg-white"
      renderValue={(option) => (
        <span className="inline-flex items-center gap-2">
          {option?.leading}
          <span>{option?.label ?? selectedValue}</span>
        </span>
      )}
      renderOption={(option) => (
        <>
          {option.leading}
          <span className="font-bold">{option.label}</span>
        </>
      )}
    />
  );
}
