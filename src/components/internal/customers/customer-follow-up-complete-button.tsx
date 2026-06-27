"use client";

import { useTransition } from "react";

import { useRouter } from "next/navigation";

import { CheckCircle2 } from "lucide-react";

import { postJson } from "@/lib/api/client";
import { appToast } from "@/lib/app-toast";

type CustomerFollowUpCompleteButtonProps = {
  activityId: string;
};

type CompleteFollowUpResult = {
  activityId: string;
  message?: string;
};

export function CustomerFollowUpCompleteButton({
  activityId,
}: CustomerFollowUpCompleteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleComplete() {
    startTransition(async () => {
      const result = await postJson<CompleteFollowUpResult>(
        "/api/internal/customers/follow-up/complete",
        {
          activityId,
        },
      );

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      appToast.success(result.message ?? "Follow-up completed.");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleComplete}
      disabled={isPending}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <CheckCircle2 className="size-4" />
      {isPending ? "Completing..." : "Complete"}
    </button>
  );
}
