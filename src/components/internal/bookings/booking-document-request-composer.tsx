"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { CalendarClock, FilePlus2, FileText, UserRound } from "lucide-react";

import { AppSelect, type AppSelectOption } from "@/components/common/app-select";
import { Input } from "@/components/ui/input";
import { postJson } from "@/lib/api/client";
import { appToast } from "@/lib/app-toast";

type DocumentTypeOption = {
  id: string;
  code: string;
  name: string;
  category: string;
  isMandatoryDefault: boolean;
};

type ParticipantOption = {
  id: string;
  fullName: string;
  role: string;
};

type BookingDocumentRequestComposerProps = {
  bookingId: string;
  currentStatus: string;
  documentTypes: DocumentTypeOption[];
  participants: ParticipantOption[];
};

type DocumentRequestResult = {
  documentRequestId: string;
  bookingId: string;
  bookingCode: string;
  status: string;
  message?: string;
};

export function BookingDocumentRequestComposer({
  bookingId,
  currentStatus,
  documentTypes,
  participants,
}: BookingDocumentRequestComposerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [documentTypeId, setDocumentTypeId] = useState(documentTypes[0]?.id ?? "");
  const [participantId, setParticipantId] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [notes, setNotes] = useState("");

  const isInactive = ["REJECTED", "EXPIRED", "CANCELLED"].includes(currentStatus);

  const documentTypeOptions = useMemo<AppSelectOption[]>(
    () =>
      documentTypes.map((documentType) => ({
        value: documentType.id,
        label: documentType.name,
        leading: (
          <span className="grid size-9 place-items-center rounded-2xl bg-blue-50 text-blue-700">
            <FileText className="size-4" />
          </span>
        ),
      })),
    [documentTypes],
  );

  const participantOptions = useMemo<AppSelectOption[]>(
    () => [
      {
        value: "",
        label: "Booking-level document",
        leading: (
          <span className="grid size-9 place-items-center rounded-2xl bg-slate-50 text-slate-600">
            <FileText className="size-4" />
          </span>
        ),
      },
      ...participants.map((participant) => ({
        value: participant.id,
        label: `${participant.fullName} · ${participant.role}`,
        leading: (
          <span className="grid size-9 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
            <UserRound className="size-4" />
          </span>
        ),
      })),
    ],
    [participants],
  );

  const canSubmit =
    !isInactive &&
    !isPending &&
    Boolean(documentTypeId) &&
    documentTypes.length > 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      appToast.error("Please select a document type.");
      return;
    }

    startTransition(async () => {
      const result = await postJson<DocumentRequestResult>(
        "/api/internal/bookings/document-request",
        {
          bookingId,
          documentTypeId,
          participantId,
          dueAt,
          notes,
        },
      );

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      appToast.success(result.message ?? "Document request created.");
      setNotes("");
      router.refresh();
    });
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <FilePlus2 className="h-4 w-4" />
            Admin Document Action
          </div>

          <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">
            Request Document
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Request buyer or booking documents and track them in the document
            center.
          </p>
        </div>
      </div>

      {isInactive ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
          Document request cannot be added because this booking is inactive.
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-5 grid gap-4 xl:grid-cols-[1fr_1fr_14rem] xl:items-start"
        >
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              Document Type
            </label>

            <AppSelect
              value={documentTypeId}
              options={documentTypeOptions}
              onValueChange={setDocumentTypeId}
              disabled={isPending || documentTypes.length === 0}
              placeholder={
                documentTypes.length === 0
                  ? "No active document type"
                  : "Select document"
              }
              triggerClassName="h-14 w-full rounded-2xl bg-white"
              renderValue={(option) => (
                <span className="flex min-w-0 items-center gap-2">
                  {option?.leading}
                  <span className="truncate font-black">
                    {option?.label ?? "Select document"}
                  </span>
                </span>
              )}
              renderOption={(option) => (
                <>
                  {option.leading}
                  <span className="font-bold">{option.label}</span>
                </>
              )}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              Participant
            </label>

            <AppSelect
              value={participantId}
              options={participantOptions}
              onValueChange={setParticipantId}
              disabled={isPending}
              placeholder="Select participant"
              triggerClassName="h-14 w-full rounded-2xl bg-white"
              renderValue={(option) => (
                <span className="flex min-w-0 items-center gap-2">
                  {option?.leading}
                  <span className="truncate font-black">
                    {option?.label ?? "Booking-level document"}
                  </span>
                </span>
              )}
              renderOption={(option) => (
                <>
                  {option.leading}
                  <span className="font-bold">{option.label}</span>
                </>
              )}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              Due Date
            </label>

            <div className="relative">
              <CalendarClock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="date"
                value={dueAt}
                onChange={(event) => setDueAt(event.target.value)}
                disabled={isPending}
                className="h-14 rounded-2xl bg-white pl-11 font-bold"
              />
            </div>
          </div>

          <div className="space-y-2 xl:col-span-3">
            <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              Internal Note
            </label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              disabled={isPending}
              rows={3}
              placeholder="Example: Please collect latest IC copy before loan submission..."
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
            />
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60 xl:col-span-3"
          >
            <FilePlus2 className="size-4" />
            {isPending ? "Requesting..." : "Request Document"}
          </button>
        </form>
      )}
    </section>
  );
}
