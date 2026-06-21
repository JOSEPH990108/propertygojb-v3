"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";

import { postJson } from "@/lib/api/client";
import { appToast } from "@/lib/app-toast";

type LeadNoteComposerProps = {
  leadId: string;
  disabled?: boolean;
};

export function LeadNoteComposer({
  leadId,
  disabled = false,
}: LeadNoteComposerProps) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!note.trim()) {
      appToast.error("Note is required.");
      return;
    }

    startTransition(async () => {
      const result = await postJson("/api/internal/leads/note", {
        leadId,
        note,
      });

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      setNote("");
      appToast.success(result.message ?? "Note added.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        disabled={disabled || isPending}
        rows={4}
        placeholder={
          disabled
            ? "Claim or assign this lead before adding notes."
            : "Add follow-up note..."
        }
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
      />

      <button
        type="submit"
        disabled={disabled || isPending || !note.trim()}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Send className="size-4" />
        {isPending ? "Saving..." : "Add Note"}
      </button>
    </form>
  );
}
