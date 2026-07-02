"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserCheck } from "lucide-react";

import { postJson } from "@/lib/api/client";
import { appToast } from "@/lib/app-toast";

type LeadClaimButtonProps = {
  leadId: string;
};

export function LeadClaimButton({ leadId }: LeadClaimButtonProps) {
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
    <button
      type="button"
      onClick={handleClaim}
      disabled={isPending}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <UserCheck className="size-4" />
      {isPending ? "Claiming..." : "Claim Lead"}
    </button>
  );
}
