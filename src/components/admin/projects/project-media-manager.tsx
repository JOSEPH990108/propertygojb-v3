"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { AppButton } from "@/components/common/app-button";
import { AppSelect } from "@/components/common/app-select";
import { AppStatusBadge } from "@/components/common/app-status-badge";
import { Input } from "@/components/ui/input";
import { postJson } from "@/lib/api/client";
import { appToast } from "@/lib/app-toast";
import { appConfirm } from "@/lib/app-confirm";

type MediaTypeOption = {
  id: string;
  name: string;
  code: string;
};

type ProjectMediaItem = {
  id: string;
  fileId: string;
  url: string | null;
  key: string;
  mimeType: string | null;
  mediaTypeId: string | null;
  mediaTypeName: string | null;
  caption: string | null;
  sortOrder: number;
};

type ProjectMediaManagerProps = {
  projectId: string;
  mediaTypes: MediaTypeOption[];
  mediaItems: ProjectMediaItem[];
};

function mediaTypeOptions(mediaTypes: MediaTypeOption[]) {
  return [
    {
      value: "__none__",
      label: "No media type",
    },
    ...mediaTypes.map((mediaType) => ({
      value: mediaType.id,
      label: `${mediaType.name} (${mediaType.code})`,
    })),
  ];
}

function ProjectMediaRow({
  projectId,
  item,
  mediaTypes,
}: {
  projectId: string;
  item: ProjectMediaItem;
  mediaTypes: MediaTypeOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [mediaTypeId, setMediaTypeId] = useState(
    item.mediaTypeId ?? "__none__",
  );
  const [caption, setCaption] = useState(item.caption ?? "");
  const [sortOrder, setSortOrder] = useState(String(item.sortOrder));

  const imageUrl = item.url ?? item.key;

  function handleUpdate() {
    startTransition(async () => {
      const result = await postJson(`/api/admin/projects/${projectId}/media`, {
        action: "update",
        mediaId: item.id,
        mediaTypeId,
        caption,
        sortOrder: Number(sortOrder) || 0,
      });

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      appToast.success("Project media updated.");
      router.refresh();
    });
  }

  async function handleRemove() {
    const confirmed = await appConfirm({
      title: "Remove project media?",
      description:
        "This will remove the media from this project. The file record will remain in the system.",
      confirmText: "Remove Media",
      cancelText: "Keep Media",
      tone: "danger",
    });

    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      const result = await postJson(`/api/admin/projects/${projectId}/media`, {
        action: "remove",
        mediaId: item.id,
      });

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      appToast.success("Project media removed.");
      router.refresh();
    });
  }

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
        <div className="relative min-h-56 bg-slate-100">
          <Image
            src={imageUrl}
            alt={caption || "Project media"}
            fill
            unoptimized
            sizes="280px"
            className="object-cover"
          />
        </div>

        <div className="grid gap-4 p-5 xl:grid-cols-[1fr_1.3fr_0.5fr_auto] xl:items-end">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Media Type
            </span>
            <AppSelect
              value={mediaTypeId}
              onValueChange={setMediaTypeId}
              placeholder="Select media type"
              options={mediaTypeOptions(mediaTypes)}
              triggerClassName="h-11 w-full justify-between rounded-xl border-slate-200 bg-white text-sm font-semibold"
              contentClassName="min-w-[var(--radix-select-trigger-width)] rounded-2xl"
            />
          </div>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Caption
            </span>
            <Input
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              className="h-11 rounded-xl"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Order
            </span>
            <Input
              type="number"
              min={0}
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              className="h-11 rounded-xl"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            {item.mediaTypeName ? (
              <AppStatusBadge tone="info">{item.mediaTypeName}</AppStatusBadge>
            ) : null}

            <AppButton
              type="button"
              disabled={isPending}
              onClick={handleUpdate}
              className="h-10 rounded-xl px-4 text-sm"
            >
              Save
            </AppButton>

            <button
              type="button"
              disabled={isPending}
              onClick={handleRemove}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-red-200 bg-white px-4 text-sm font-bold text-red-600 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Remove
            </button>
          </div>

          <p className="break-all text-xs font-medium text-slate-400 xl:col-span-4">
            {imageUrl}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ProjectMediaManager({
  projectId,
  mediaTypes,
  mediaItems,
}: ProjectMediaManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [url, setUrl] = useState("");
  const [mediaTypeId, setMediaTypeId] = useState(
    mediaTypes[0]?.id ?? "__none__",
  );
  const [caption, setCaption] = useState("");
  const [sortOrder, setSortOrder] = useState("0");

  function handleCreate() {
    startTransition(async () => {
      const result = await postJson(`/api/admin/projects/${projectId}/media`, {
        action: "create",
        url,
        mediaTypeId,
        caption,
        sortOrder: Number(sortOrder) || 0,
      });

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      setUrl("");
      setCaption("");
      setSortOrder("0");

      appToast.success("Project media added.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black tracking-tight text-slate-950">
          Add Media
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Add a public HTTPS JPG, PNG, WebP, or GIF URL. Binary uploads require the future R2/S3 storage integration.
        </p>

        <div className="mt-6 grid gap-4 xl:grid-cols-[1.8fr_1fr_1.2fr_0.5fr_auto] xl:items-end">
          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-700">Image URL</span>
            <Input
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com/project-image.jpg"
              className="h-11 rounded-xl"
            />
          </label>

          <div className="space-y-2">
            <span className="text-sm font-bold text-slate-700">Media Type</span>
            <AppSelect
              value={mediaTypeId}
              onValueChange={setMediaTypeId}
              placeholder="Select media type"
              options={mediaTypeOptions(mediaTypes)}
              triggerClassName="h-11 w-full justify-between rounded-xl border-slate-200 bg-white text-sm font-semibold"
              contentClassName="min-w-[var(--radix-select-trigger-width)] rounded-2xl"
            />
          </div>

          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-700">Caption</span>
            <Input
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              placeholder="Facade / Living Room / Site Plan"
              className="h-11 rounded-xl"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-700">Order</span>
            <Input
              type="number"
              min={0}
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              className="h-11 rounded-xl"
            />
          </label>

          <AppButton
            type="button"
            disabled={isPending || !url.trim()}
            onClick={handleCreate}
            className="h-11 rounded-xl px-5 text-sm"
          >
            {isPending ? "Adding..." : "Add Media"}
          </AppButton>
        </div>
      </section>

      <section className="space-y-4">
        {mediaItems.map((item) => (
          <ProjectMediaRow
            key={item.id}
            projectId={projectId}
            item={item}
            mediaTypes={mediaTypes}
          />
        ))}

        {mediaItems.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-sm font-bold text-slate-700">
              No project media found.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Add the first project image above.
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
