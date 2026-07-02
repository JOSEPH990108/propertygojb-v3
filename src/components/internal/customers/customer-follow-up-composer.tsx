"use client";

import { FormEvent, useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { CalendarPlus } from "lucide-react";

import { Input } from "@/components/ui/input";
import { postJson } from "@/lib/api/client";
import { appToast } from "@/lib/app-toast";

type CustomerFollowUpComposerProps = {
  customerId: string;
};

type CustomerFollowUpResult = {
  customerId: string;
  message?: string;
};

export function CustomerFollowUpComposer({
  customerId,
}: CustomerFollowUpComposerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [dueAt, setDueAt] = useState("");
  const [note, setNote] = useState("");

  const canSubmit = !isPending && Boolean(dueAt) && note.trim().length > 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!dueAt) {
      appToast.error("Please choose a follow-up date.");
      return;
    }

    if (!note.trim()) {
      appToast.error("Please enter a follow-up note.");
      return;
    }

    startTransition(async () => {
      const result = await postJson<CustomerFollowUpResult>(
        "/api/internal/customers/follow-up",
        {
          customerId,
          dueAt,
          note,
        },
      );

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      appToast.success(result.message ?? "Follow-up scheduled.");
      setDueAt("");
      setNote("");
      router.refresh();
    });
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <CalendarPlus className="h-4 w-4" />
            Customer Action
          </div>

          <h2 className="mt-3 text-xl font-black tracking-tight text-slate-950">
            Schedule Follow-Up
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Add a follow-up reminder to this customer timeline for future
            WhatsApp, call, viewing, or booking follow-up.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-5 grid gap-4 xl:grid-cols-[18rem_1fr_auto] xl:items-start"
      >
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            Follow-Up Date
          </label>

          <Input
            type="datetime-local"
            value={dueAt}
            onChange={(event) => setDueAt(event.target.value)}
            disabled={isPending}
            className="h-14 rounded-2xl bg-white font-bold"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            Follow-Up Note
          </label>

          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            disabled={isPending}
            rows={3}
            placeholder="Example: Follow up loan pre-check result and confirm preferred unit..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
          />
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60 xl:mt-7"
        >
          <CalendarPlus className="size-4" />
          {isPending ? "Scheduling..." : "Schedule"}
        </button>
      </form>
    </section>
  );
}
