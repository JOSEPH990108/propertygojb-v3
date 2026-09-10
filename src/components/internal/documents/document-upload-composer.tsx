"use client";

import { FormEvent, useRef, useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { FileUp, UploadCloud } from "lucide-react";

import { AppStatusBadge } from "@/components/common/app-status-badge";
import { appToast } from "@/lib/app-toast";

type DocumentUploadComposerProps = {
  requestId: string;
  requestStatus: string;
  latestSubmissionStatus?: string | null;
};

type UploadResponse = {
  ok?: boolean;
  message?: string;
};

function formatStatus(value: string | null | undefined) {
  if (!value) {
    return "Unknown";
  }

  return value
    .split("_")
    .map((part) => part.slice(0, 1) + part.slice(1).toLowerCase())
    .join(" ");
}

function getStatusTone(
  value: string | null | undefined,
): "success" | "danger" | "warning" | "info" | "neutral" {
  switch (value) {
    case "VERIFIED":
      return "success";
    case "REJECTED":
      return "danger";
    case "REQUESTED":
    case "SUBMITTED":
    case "UNDER_REVIEW":
      return "warning";
    case "WAIVED":
    case "REPLACED":
      return "info";
    default:
      return "neutral";
  }
}

export function DocumentUploadComposer({
  requestId,
  requestStatus,
  latestSubmissionStatus,
}: DocumentUploadComposerProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");

  const isClosed = ["VERIFIED", "WAIVED"].includes(requestStatus);
  const canSubmit = !isClosed && !isPending && Boolean(file);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      appToast.error("Please choose a document file.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("requestId", requestId);
      formData.append("file", file);
      formData.append("notes", notes);

      const response = await fetch("/api/internal/documents/upload", {
        method: "POST",
        body: formData,
      });

      const result = (await response.json().catch(() => ({}))) as UploadResponse;

      if (!response.ok || result.ok === false) {
        appToast.error(result.message ?? "Failed to upload document.");
        return;
      }

      appToast.success(result.message ?? "Document uploaded successfully.");
      setFile(null);
      setNotes("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      router.refresh();
    });
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <FileUp className="h-4 w-4" />
            Document Upload
          </div>

          <h2 className="mt-3 text-xl font-black tracking-tight text-slate-950">
            Upload Document
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Admin can upload any document. Agent can upload documents only for
            assigned bookings. Admin will verify or reject after upload.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AppStatusBadge tone={getStatusTone(requestStatus)}>
            Request: {formatStatus(requestStatus)}
          </AppStatusBadge>
          {latestSubmissionStatus ? (
            <AppStatusBadge tone={getStatusTone(latestSubmissionStatus)}>
              Latest: {formatStatus(latestSubmissionStatus)}
            </AppStatusBadge>
          ) : (
            <AppStatusBadge tone="neutral">No Submission</AppStatusBadge>
          )}
        </div>
      </div>

      {isClosed ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
          This document request is closed and cannot be uploaded.
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-5 grid gap-4 xl:grid-cols-[1fr_1fr_auto] xl:items-start"
        >
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              File
            </label>

            <input
              ref={fileInputRef}
              type="file"
              disabled={isPending}
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="block h-14 w-full cursor-pointer rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 file:mr-4 file:h-full file:border-0 file:bg-slate-950 file:px-5 file:text-sm file:font-black file:text-white hover:file:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-50"
            />

            {file ? (
              <p className="text-xs font-bold text-slate-500">
                Selected: {file.name}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              Upload Note
            </label>

            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              disabled={isPending}
              rows={3}
              placeholder="Optional note, e.g. latest IC copy from buyer..."
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
            />
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60 xl:mt-7"
          >
            <UploadCloud className="size-4" />
            {isPending ? "Uploading..." : "Upload"}
          </button>
        </form>
      )}
    </section>
  );
}
