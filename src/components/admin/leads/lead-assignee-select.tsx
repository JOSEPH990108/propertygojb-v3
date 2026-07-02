"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserRound, UsersRound } from "lucide-react";

import { AppSelect, type AppSelectOption } from "@/components/common/app-select";
import { postJson } from "@/lib/api/client";
import { appToast } from "@/lib/app-toast";

type LeadAgentOption = {
  id: string;
  name: string;
  email: string;
};

type LeadAssigneeSelectProps = {
  leadId: string;
  currentAssigneeUserId: string | null;
  agents: LeadAgentOption[];
};

const UNASSIGNED_VALUE = "__UNASSIGNED__";

export function LeadAssigneeSelect({
  leadId,
  currentAssigneeUserId,
  agents,
}: LeadAssigneeSelectProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedValue, setSelectedValue] = useState(
    currentAssigneeUserId ?? UNASSIGNED_VALUE,
  );

  const options = useMemo<AppSelectOption[]>(
    () => [
      {
        value: UNASSIGNED_VALUE,
        label: "Unassigned",
        description: "Open public lead",
        leading: (
          <span className="grid size-8 place-items-center rounded-xl bg-amber-100 text-amber-700">
            <UsersRound className="size-4" />
          </span>
        ),
      },
      ...agents.map((agent) => ({
        value: agent.id,
        label: agent.name,
        description: agent.email,
        leading: (
          <span className="grid size-8 place-items-center rounded-xl bg-blue-100 text-blue-700">
            <UserRound className="size-4" />
          </span>
        ),
      })),
    ],
    [agents],
  );

  function handleChange(nextValue: string) {
    if (nextValue === selectedValue) {
      return;
    }

    const previousValue = selectedValue;
    setSelectedValue(nextValue);

    startTransition(async () => {
      const result = await postJson("/api/admin/leads/assign", {
        leadId,
        assigneeUserId: nextValue === UNASSIGNED_VALUE ? null : nextValue,
      });

      if (!result.ok) {
        setSelectedValue(previousValue);
        appToast.error(result.message);
        return;
      }

      appToast.success(result.message ?? "Lead assignment updated.");
      router.refresh();
    });
  }

  return (
    <AppSelect
      value={selectedValue}
      options={options}
      onValueChange={handleChange}
      searchable
      searchPlaceholder="Search agent..."
      disabled={isPending}
      triggerClassName="h-11 min-w-56 rounded-xl bg-white"
      renderValue={(option) => (
        <span className="inline-flex items-center gap-2">
          {option?.leading}
          <span className="truncate">{option?.label ?? "Unassigned"}</span>
        </span>
      )}
      renderOption={(option) => (
        <>
          {option.leading}
          <div>
            <p className="font-bold">{option.label}</p>
            {option.description ? (
              <p className="text-xs text-slate-500">{option.description}</p>
            ) : null}
          </div>
        </>
      )}
    />
  );
}
