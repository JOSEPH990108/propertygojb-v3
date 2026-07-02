"use client";

import type { ReactNode } from "react";
import { BriefcaseBusiness, Crown, ShieldCheck, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { AppSelect, type AppSelectOption } from "@/components/common/app-select";
import { postJson } from "@/lib/api/client";
import { appToast } from "@/lib/app-toast";

type RoleOption = {
  id: string;
  code: string;
  name: string;
};

type UserRoleSelectProps = {
  userId: string;
  currentRoleCode: string;
  roles: RoleOption[];
  disabled?: boolean;
};

function getRoleIcon(roleCode: string): ReactNode {
  switch (roleCode) {
    case "SUPER_ADMIN":
      return <Crown className="size-4" />;
    case "ADMIN":
      return <ShieldCheck className="size-4" />;
    case "AGENT":
      return <BriefcaseBusiness className="size-4" />;
    case "CUSTOMER":
    default:
      return <UserRound className="size-4" />;
  }
}

function getRoleIconClassName(roleCode: string) {
  switch (roleCode) {
    case "SUPER_ADMIN":
      return "bg-amber-100 text-amber-700";
    case "ADMIN":
      return "bg-blue-100 text-blue-700";
    case "AGENT":
      return "bg-purple-100 text-purple-700";
    case "CUSTOMER":
    default:
      return "bg-emerald-100 text-emerald-700";
  }
}

function formatRoleCode(roleCode: string) {
  return roleCode
    .toLowerCase()
    .split("_")
    .map((word) => word.slice(0, 1).toUpperCase() + word.slice(1))
    .join(" ");
}

export function UserRoleSelect({
  userId,
  currentRoleCode,
  roles,
  disabled,
}: UserRoleSelectProps) {
  const router = useRouter();

  const [selectedRole, setSelectedRole] = useState(currentRoleCode);
  const [isPending, startTransition] = useTransition();

  const roleOptions = useMemo<AppSelectOption[]>(
    () =>
      roles.map((role) => ({
        value: role.code,
        label: role.name || formatRoleCode(role.code),
        description: role.code,
        leading: (
          <span
            className={`grid size-8 shrink-0 place-items-center rounded-xl ${getRoleIconClassName(
              role.code,
            )}`}
          >
            {getRoleIcon(role.code)}
          </span>
        ),
      })),
    [roles],
  );

  function handleRoleChange(nextRoleCode: string) {
    if (nextRoleCode === selectedRole) {
      return;
    }

    const previousRole = selectedRole;

    setSelectedRole(nextRoleCode);

    startTransition(async () => {
      const result = await postJson("/api/admin/users/role", {
        userId,
        roleCode: nextRoleCode,
      });

      if (!result.ok) {
        setSelectedRole(previousRole);
        appToast.error(result.message);
        return;
      }

      appToast.success("User role updated.");
      router.refresh();
    });
  }

  return (
    <AppSelect
      value={selectedRole}
      options={roleOptions}
      onValueChange={handleRoleChange}
      disabled={disabled || isPending}
      triggerClassName="h-10 w-[190px] rounded-xl bg-white"
      contentClassName="w-[220px]"
      renderValue={(option) => (
        <span className="flex items-center gap-2">
          {option?.leading}
          <span className="font-semibold">
            {option?.label ?? formatRoleCode(selectedRole)}
          </span>
        </span>
      )}
      renderOption={(option) => (
        <>
          {option.leading}
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-900">{option.label}</p>
            <p className="text-xs text-slate-500">{option.description}</p>
          </div>
        </>
      )}
    />
  );
}
