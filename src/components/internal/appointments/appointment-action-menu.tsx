"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  CheckCircle2,
  ChevronDown,
  Eye,
  MoreHorizontal,
  RotateCcw,
  XCircle,
} from "lucide-react";

import { postJson } from "@/lib/api/client";
import { appToast } from "@/lib/app-toast";

type AppointmentActionMenuProps = {
  activityId: string;
  currentStatus: string;
  leadHref: string;
};

export function AppointmentActionMenu({
  activityId,
  currentStatus,
  leadHref,
}: AppointmentActionMenuProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function runAction(action: "COMPLETE" | "CANCEL" | "REOPEN") {
    startTransition(async () => {
      const result = await postJson("/api/internal/leads/appointment/action", {
        activityId,
        action,
      });

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      appToast.success(result.message ?? "Appointment updated.");
      router.refresh();
    });
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <MoreHorizontal className="size-4" />
          Actions
          <ChevronDown className="size-3.5 text-slate-400" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
        >
          <DropdownMenu.Item asChild>
            <Link
              href={leadHref}
              className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 outline-none transition hover:bg-slate-50"
            >
              <Eye className="size-4 text-blue-600" />
              View Lead
            </Link>
          </DropdownMenu.Item>

          {currentStatus !== "COMPLETED" && currentStatus !== "REQUESTED" ? (
            <DropdownMenu.Item
              onSelect={(event) => {
                event.preventDefault();
                runAction("COMPLETE");
              }}
              disabled={isPending}
              className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 outline-none transition hover:bg-emerald-50 hover:text-emerald-700 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50"
            >
              <CheckCircle2 className="size-4 text-emerald-600" />
              Mark Completed
            </DropdownMenu.Item>
          ) : null}

          {currentStatus !== "CANCELLED" ? (
            <DropdownMenu.Item
              onSelect={(event) => {
                event.preventDefault();
                runAction("CANCEL");
              }}
              disabled={isPending}
              className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 outline-none transition hover:bg-red-50 hover:text-red-700 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50"
            >
              <XCircle className="size-4 text-red-600" />
              Cancel Appointment
            </DropdownMenu.Item>
          ) : null}

          {currentStatus !== "SCHEDULED" && currentStatus !== "REQUESTED" ? (
            <DropdownMenu.Item
              onSelect={(event) => {
                event.preventDefault();
                runAction("REOPEN");
              }}
              disabled={isPending}
              className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 outline-none transition hover:bg-blue-50 hover:text-blue-700 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50"
            >
              <RotateCcw className="size-4 text-blue-600" />
              Reopen as Scheduled
            </DropdownMenu.Item>
          ) : null}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
