"use client";

import { FormEvent, useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { MessageSquarePlus } from "lucide-react";

import { postJson } from "@/lib/api/client";
import { appToast } from "@/lib/app-toast";

type CustomerNoteComposerProps = {
  customerId: string;
};

type CustomerNoteResult = {
  customerId: string;
  message?: string;
};

export function CustomerNoteComposer({ customerId }: CustomerNoteComposerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [note, setNote] = useState("");

  const canSubmit = !isPending && note.trim().length > 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      appToast.error("Please enter a note.");
      return;
    }

    startTransition(async () => {
      const result = await postJson<CustomerNoteResult>(
        "/api/internal/customers/note",
        {
          customerId,
          note,
        },
      );

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      appToast.success(result.message ?? "Customer note added.");
      setNote("");
      router.refresh();
    });
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <MessageSquarePlus className="h-4 w-4" />
            Customer Action
          </div>

          <h2 className="mt-3 text-xl font-black tracking-tight text-slate-950">
            Add Internal Note
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Save internal follow-up notes to this customer timeline. Notes are
            visible only inside the internal portal.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 grid gap-4 xl:grid-cols-[1fr_auto] xl:items-start">
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            Note
          </label>

          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            disabled={isPending}
            rows={4}
            placeholder="Example: Customer prefers corner unit, follow up after loan pre-check..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
          />
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60 xl:mt-7"
        >
          <MessageSquarePlus className="size-4" />
          {isPending ? "Saving..." : "Add Note"}
        </button>
      </form>
    </section>
  );
}
