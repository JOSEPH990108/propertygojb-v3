"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  ChevronDown,
  Eye,
  MessageCircle,
  MoreHorizontal,
  UserCheck,
} from "lucide-react";

import { postJson } from "@/lib/api/client";
import { appToast } from "@/lib/app-toast";

type LeadAgentActionMenuProps = {
  leadId: string;
  whatsappHref: string | null;
  canClaim: boolean;
};

export function LeadAgentActionMenu({
  leadId,
  whatsappHref,
  canClaim,
}: LeadAgentActionMenuProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClaim() {
    startTransition(async () => {
      const result = await postJson("/api/agent/leads/claim", {
        leadId,
      });

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      appToast.success(result.message ?? "Lead claimed successfully.");
      router.refresh();
    });
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
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
              href={`/agent/leads/${leadId}`}
              className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 outline-none transition hover:bg-slate-50"
            >
              <Eye className="size-4 text-blue-600" />
              View Details
            </Link>
          </DropdownMenu.Item>

          {canClaim ? (
            <DropdownMenu.Item
              onSelect={(event) => {
                event.preventDefault();
                handleClaim();
              }}
              disabled={isPending}
              className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 outline-none transition hover:bg-blue-50 hover:text-blue-700 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50"
            >
              <UserCheck className="size-4 text-blue-600" />
              {isPending ? "Claiming..." : "Claim Lead"}
            </DropdownMenu.Item>
          ) : null}

          {whatsappHref ? (
            <DropdownMenu.Item asChild>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 outline-none transition hover:bg-emerald-50 hover:text-emerald-700"
              >
                <MessageCircle className="size-4 text-emerald-600" />
                WhatsApp Customer
              </a>
            </DropdownMenu.Item>
          ) : (
            <DropdownMenu.Item
              disabled
              className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-400 outline-none"
            >
              <MessageCircle className="size-4" />
              No Mobile Number
            </DropdownMenu.Item>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
