"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { AppButton } from "@/components/common/app-button";
import { Input } from "@/components/ui/input";
import { postJson } from "@/lib/api/client";
import { appToast } from "@/lib/app-toast";

type AgentProfileFormProps = {
  userId: string;
  renNumber: string | null;
  agencyName: string | null;
  referralCode: string | null;
};

export function AgentProfileForm({
  userId,
  renNumber,
  agencyName,
  referralCode,
}: AgentProfileFormProps) {
  const router = useRouter();

  const [ren, setRen] = useState(renNumber ?? "");
  const [agency, setAgency] = useState(agencyName ?? "");
  const [referral, setReferral] = useState(referralCode ?? "");
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const result = await postJson("/api/admin/agents/profile", {
        userId,
        renNumber: ren,
        agencyName: agency,
        referralCode: referral,
      });

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      appToast.success("Agent profile updated.");
      router.refresh();
    });
  }

  return (
    <div className="grid min-w-[640px] grid-cols-[1fr_1.4fr_1fr_auto] items-center gap-3">
      <Input
        value={ren}
        onChange={(event) => setRen(event.target.value)}
        placeholder="REN number"
        className="h-10 rounded-xl border-slate-200 bg-white text-sm shadow-sm"
      />

      <Input
        value={agency}
        onChange={(event) => setAgency(event.target.value)}
        placeholder="Agency name"
        className="h-10 rounded-xl border-slate-200 bg-white text-sm shadow-sm"
      />

      <Input
        value={referral}
        onChange={(event) => setReferral(event.target.value)}
        placeholder="Referral code"
        className="h-10 rounded-xl border-slate-200 bg-white text-sm uppercase shadow-sm"
      />

      <AppButton
        type="button"
        disabled={isPending}
        onClick={handleSave}
        className="h-10 rounded-xl px-4 text-sm"
      >
        {isPending ? "Saving..." : "Save"}
      </AppButton>
    </div>
  );
}
