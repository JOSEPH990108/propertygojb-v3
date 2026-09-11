"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { AppButton } from "@/components/common/app-button";
import { AppSelect } from "@/components/common/app-select";
import { AppStatusBadge } from "@/components/common/app-status-badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { postJson } from "@/lib/api/client";
import { appToast } from "@/lib/app-toast";
import { appConfirm } from "@/lib/app-confirm";

type SelectOption = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

type NearbyPlaceItem = {
  id: string;
  name: string;
  category: string;
  distanceKm: string | null;
  sortOrder: number;
};

type ProjectContentManagerProps = {
  projectId: string;
  currentTime: string;
  marketingContent: {
    metaTitle: string | null;
    metaDescription: string | null;
    canonicalUrl: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
    heroVideoUrl: string | null;
    ogImageFileId: string | null;
    isPublished: boolean;
    publishedAt: string | null;
    highlights: string[];
    faqs: { question: string; answer: string }[];
  };
  mediaItems: {
    fileId: string;
    url: string;
    caption: string | null;
  }[];
  amenities: SelectOption[];
  selectedAmenityIds: string[];
  tags: SelectOption[];
  selectedTagIds: string[];
  nearbyPlaces: NearbyPlaceItem[];
};

const nearbyCategoryOptions = [
  { value: "SCHOOL", label: "School" },
  { value: "MALL", label: "Mall" },
  { value: "HOSPITAL", label: "Hospital" },
  { value: "HIGHWAY", label: "Highway" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "GROCERY", label: "Grocery" },
  { value: "PARK", label: "Park" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "OTHER", label: "Other" },
];

function optionList(options: SelectOption[]) {
  return options.map((option) => ({
    value: option.id,
    label: option.name,
  }));
}

function NearbyRow({
  projectId,
  item,
}: {
  projectId: string;
  item: NearbyPlaceItem;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState(item.category);
  const [distanceKm, setDistanceKm] = useState(item.distanceKm ?? "");
  const [sortOrder, setSortOrder] = useState(String(item.sortOrder));

  function handleUpdate() {
    startTransition(async () => {
      const result = await postJson(`/api/admin/projects/${projectId}/content`, {
        action: "update-nearby",
        nearbyId: item.id,
        name,
        category,
        distanceKm,
        sortOrder,
      });

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      appToast.success("Nearby place updated.");
      router.refresh();
    });
  }

  async function handleRemove() {
    const confirmed = await appConfirm({
      title: "Remove nearby place?",
      description:
        "This will remove the nearby place from this project content.",
      confirmText: "Remove Nearby Place",
      cancelText: "Keep Nearby Place",
      tone: "danger",
    });

    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      const result = await postJson(`/api/admin/projects/${projectId}/content`, {
        action: "remove-nearby",
        nearbyId: item.id,
      });

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      appToast.success("Nearby place removed.");
      router.refresh();
    });
  }

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_0.7fr_0.5fr_auto] lg:items-end">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nearby place"
          className="h-11 rounded-xl"
        />

        <AppSelect
          value={category}
          onValueChange={setCategory}
          placeholder="Category"
          options={nearbyCategoryOptions}
          triggerClassName="h-11 w-full justify-between rounded-xl border-slate-200 bg-white text-sm font-semibold"
          contentClassName="min-w-[var(--radix-select-trigger-width)] rounded-2xl"
        />

        <Input
          type="number"
          min={0}
          step="0.1"
          value={distanceKm}
          onChange={(event) => setDistanceKm(event.target.value)}
          placeholder="Distance km"
          className="h-11 rounded-xl"
        />

        <Input
          type="number"
          min={0}
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.value)}
          placeholder="Order"
          className="h-11 rounded-xl"
        />

        <div className="flex gap-2">
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
      </div>
    </div>
  );
}

export function ProjectContentManager({
  projectId,
  currentTime,
  marketingContent,
  mediaItems,
  amenities,
  selectedAmenityIds,
  tags,
  selectedTagIds,
  nearbyPlaces,
}: ProjectContentManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [metaTitle, setMetaTitle] = useState(marketingContent.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(marketingContent.metaDescription ?? "");
  const [canonicalUrl, setCanonicalUrl] = useState(marketingContent.canonicalUrl ?? "");
  const [ogTitle, setOgTitle] = useState(marketingContent.ogTitle ?? "");
  const [ogDescription, setOgDescription] = useState(marketingContent.ogDescription ?? "");
  const [heroVideoUrl, setHeroVideoUrl] = useState(marketingContent.heroVideoUrl ?? "");
  const [ogImageFileId, setOgImageFileId] = useState(marketingContent.ogImageFileId ?? "");
  const [publicationMode, setPublicationMode] = useState<"draft" | "live" | "scheduled">(
    !marketingContent.isPublished
      ? "draft"
      : marketingContent.publishedAt && new Date(marketingContent.publishedAt).getTime() > new Date(currentTime).getTime()
        ? "scheduled"
        : "live",
  );
  const [publishedAt, setPublishedAt] = useState(() => {
    if (!marketingContent.publishedAt) return "";
    const date = new Date(marketingContent.publishedAt);
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return localDate.toISOString().slice(0, 16);
  });
  const minimumPublishedAt = (() => {
    const date = new Date(new Date(currentTime).getTime() + 60_000);
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return localDate.toISOString().slice(0, 16);
  })();
  const [highlightsText, setHighlightsText] = useState(marketingContent.highlights.join("\n"));
  const [faqsText, setFaqsText] = useState(
    marketingContent.faqs.map((faq) => `${faq.question} | ${faq.answer}`).join("\n"),
  );

  const [amenityId, setAmenityId] = useState(amenities[0]?.id ?? "");
  const [newAmenityName, setNewAmenityName] = useState("");
  const [newAmenityDescription, setNewAmenityDescription] = useState("");

  const [tagId, setTagId] = useState(tags[0]?.id ?? "");
  const [newTagName, setNewTagName] = useState("");
  const [newTagDescription, setNewTagDescription] = useState("");

  const [nearbyName, setNearbyName] = useState("");
  const [nearbyCategory, setNearbyCategory] = useState("MALL");
  const [nearbyDistanceKm, setNearbyDistanceKm] = useState("");
  const [nearbySortOrder, setNearbySortOrder] = useState("0");

  const selectedAmenities = amenities.filter((item) =>
    selectedAmenityIds.includes(item.id),
  );
  const availableAmenities = amenities.filter(
    (item) => !selectedAmenityIds.includes(item.id),
  );

  const selectedTags = tags.filter((item) => selectedTagIds.includes(item.id));
  const availableTags = tags.filter((item) => !selectedTagIds.includes(item.id));

  function postContent(payload: Record<string, unknown>, successMessage: string) {
    startTransition(async () => {
      const result = await postJson(`/api/admin/projects/${projectId}/content`, payload);

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      appToast.success(successMessage);
      router.refresh();
    });
  }

  function handleCreateNearby() {
    postContent(
      {
        action: "create-nearby",
        name: nearbyName,
        category: nearbyCategory,
        distanceKm: nearbyDistanceKm,
        sortOrder: nearbySortOrder,
      },
      "Nearby place created.",
    );

    setNearbyName("");
    setNearbyDistanceKm("");
    setNearbySortOrder("0");
  }

  function handleCreateAmenity() {
    postContent(
      {
        action: "create-amenity",
        name: newAmenityName,
        description: newAmenityDescription,
      },
      "Amenity created and attached.",
    );

    setNewAmenityName("");
    setNewAmenityDescription("");
  }

  function handleCreateTag() {
    postContent(
      {
        action: "create-tag",
        name: newTagName,
        description: newTagDescription,
      },
      "Tag created and attached.",
    );

    setNewTagName("");
    setNewTagDescription("");
  }

  function handleUpdateMarketing() {
    const highlights = highlightsText
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
    const faqs = faqsText
      .split("\n")
      .map((item) => item.split("|", 2).map((part) => part.trim()))
      .filter(([question, answer]) => Boolean(question && answer))
      .map(([question, answer]) => ({ question, answer }));

    postContent(
      {
        action: "update-marketing",
        metaTitle,
        metaDescription,
        canonicalUrl,
        ogTitle,
        ogDescription,
        heroVideoUrl,
        highlights,
        faqs,
      },
      "Marketing content updated.",
    );
  }

  function handleUpdatePublication() {
    if (publicationMode === "scheduled" && !publishedAt) {
      appToast.error("Choose a publication date and time.");
      return;
    }

    postContent(
      {
        action: "update-publication",
        isPublished: publicationMode !== "draft",
        publishedAt:
          publicationMode === "scheduled" ? new Date(publishedAt).toISOString() : null,
      },
      publicationMode === "draft"
        ? "Project moved to draft."
        : publicationMode === "scheduled"
          ? "Project publication scheduled."
          : "Project published.",
    );
  }

  function handleUpdateOgImage(fileId: string | null) {
    postContent(
      { action: "set-og-image", fileId },
      fileId ? "Social image selected." : "Social image fallback restored.",
    );
    setOgImageFileId(fileId ?? "");
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-950">Publication</h2>
            <p className="mt-1 text-sm text-slate-500">Control when this project enters the public catalog, sitemap, and project routes.</p>
          </div>
          <AppStatusBadge tone={publicationMode === "live" ? "success" : publicationMode === "scheduled" ? "warning" : "neutral"}>
            {publicationMode === "live" ? "Live" : publicationMode === "scheduled" ? "Scheduled" : "Draft"}
          </AppStatusBadge>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {([
            { value: "draft", label: "Draft", text: "Hidden from public routes" },
            { value: "live", label: "Publish now", text: "Visible immediately" },
            { value: "scheduled", label: "Schedule", text: "Visible at a future time" },
          ] as const).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setPublicationMode(option.value)}
              className={`min-h-24 rounded-xl border p-4 text-left transition ${publicationMode === option.value ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 bg-white hover:border-blue-300"}`}
            >
              <span className="block font-black text-slate-950">{option.label}</span>
              <span className="mt-1 block text-sm text-slate-500">{option.text}</span>
            </button>
          ))}
        </div>

        {publicationMode === "scheduled" ? (
          <label className="mt-5 block max-w-sm space-y-2">
            <span className="text-sm font-bold text-slate-700">Publication date and time</span>
            <Input
              type="datetime-local"
              value={publishedAt}
              min={minimumPublishedAt}
              onChange={(event) => setPublishedAt(event.target.value)}
              className="h-11 rounded-xl"
            />
          </label>
        ) : null}

        <AppButton type="button" disabled={isPending} onClick={handleUpdatePublication} className="mt-5 h-11 rounded-xl px-6 text-sm">
          {isPending ? "Saving..." : "Save publication settings"}
        </AppButton>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-950">
              SEO & Marketing Content
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Empty metadata fields automatically fall back to the project name and catalog details.
            </p>
          </div>
          <AppStatusBadge tone="info">Public website</AppStatusBadge>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-700">SEO title ({metaTitle.length}/70)</span>
            <Input value={metaTitle} maxLength={70} onChange={(event) => setMetaTitle(event.target.value)} placeholder="Project name in Johor Bahru" className="h-11 rounded-xl" />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-700">Canonical URL</span>
            <Input type="url" value={canonicalUrl} onChange={(event) => setCanonicalUrl(event.target.value)} placeholder="https://propertygojb.com/projects/project-name" className="h-11 rounded-xl" />
          </label>
          <label className="space-y-2 lg:col-span-2">
            <span className="text-sm font-bold text-slate-700">SEO description ({metaDescription.length}/180)</span>
            <Textarea value={metaDescription} maxLength={180} onChange={(event) => setMetaDescription(event.target.value)} placeholder="Concise search-result description" className="min-h-24 rounded-xl" />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-700">Social title ({ogTitle.length}/100)</span>
            <Input value={ogTitle} maxLength={100} onChange={(event) => setOgTitle(event.target.value)} placeholder="Optional social sharing title" className="h-11 rounded-xl" />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-700">Hero video URL</span>
            <Input type="url" value={heroVideoUrl} onChange={(event) => setHeroVideoUrl(event.target.value)} placeholder="HTTPS .mp4 or .webm URL" className="h-11 rounded-xl" />
          </label>
          <label className="space-y-2 lg:col-span-2">
            <span className="text-sm font-bold text-slate-700">Social description ({ogDescription.length}/300)</span>
            <Textarea value={ogDescription} maxLength={300} onChange={(event) => setOgDescription(event.target.value)} placeholder="Optional Open Graph description" className="min-h-24 rounded-xl" />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-700">Highlights</span>
            <Textarea value={highlightsText} onChange={(event) => setHighlightsText(event.target.value)} placeholder={"One highlight per line\nFreehold title\nNear transport"} className="min-h-36 rounded-xl" />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-700">FAQs</span>
            <Textarea value={faqsText} onChange={(event) => setFaqsText(event.target.value)} placeholder={"One FAQ per line: Question | Answer"} className="min-h-36 rounded-xl" />
          </label>
        </div>

        <AppButton type="button" disabled={isPending} onClick={handleUpdateMarketing} className="mt-6 h-11 rounded-xl px-6 text-sm">
          {isPending ? "Saving..." : "Save SEO & Marketing Content"}
        </AppButton>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-950">Social Sharing Image</h2>
            <p className="mt-1 text-sm text-slate-500">Select an image from Project Media. Without a selection, the first project image is used.</p>
          </div>
          <AppStatusBadge tone={ogImageFileId ? "success" : "neutral"}>{ogImageFileId ? "Custom image" : "Automatic fallback"}</AppStatusBadge>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {mediaItems.map((item) => (
            <button
              key={item.fileId}
              type="button"
              onClick={() => handleUpdateOgImage(item.fileId)}
              className={`overflow-hidden rounded-xl border text-left transition ${ogImageFileId === item.fileId ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200 hover:border-blue-300"}`}
            >
              <span className="relative block aspect-[1.91/1] bg-slate-100">
                <Image src={item.url} alt={item.caption ?? "Project social image"} fill unoptimized sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />
              </span>
              <span className="block truncate px-3 py-3 text-sm font-bold text-slate-700">{item.caption ?? "Project image"}</span>
            </button>
          ))}
        </div>

        {mediaItems.length === 0 ? (
          <p className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-semibold text-slate-600">Add a validated HTTPS image under Project Media before selecting a custom social image.</p>
        ) : null}

        {ogImageFileId ? (
          <AppButton type="button" appVariant="outline" disabled={isPending} onClick={() => handleUpdateOgImage(null)} className="mt-5 h-11 rounded-xl px-5 text-sm">
            Use automatic fallback
          </AppButton>
        ) : null}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-slate-950">
            Amenities
          </h2>

          <div className="mt-5 flex flex-wrap gap-2">
            {selectedAmenities.map((amenity) => (
              <button
                key={amenity.id}
                type="button"
                disabled={isPending}
                onClick={() =>
                  postContent(
                    { action: "detach-amenity", amenityId: amenity.id },
                    "Amenity detached.",
                  )
                }
                className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
              >
                {amenity.name} ×
              </button>
            ))}

            {selectedAmenities.length === 0 ? (
              <AppStatusBadge tone="neutral">No amenities attached</AppStatusBadge>
            ) : null}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
            <AppSelect
              value={amenityId}
              onValueChange={setAmenityId}
              placeholder="Select amenity"
              options={optionList(availableAmenities)}
              triggerClassName="h-11 w-full justify-between rounded-xl border-slate-200 bg-white text-sm font-semibold"
              contentClassName="min-w-[var(--radix-select-trigger-width)] rounded-2xl"
            />

            <AppButton
              type="button"
              disabled={isPending || !amenityId}
              onClick={() =>
                postContent(
                  { action: "attach-amenity", amenityId },
                  "Amenity attached.",
                )
              }
              className="h-11 rounded-xl px-5 text-sm"
            >
              Attach
            </AppButton>
          </div>

          <div className="mt-6 grid gap-3">
            <Input
              value={newAmenityName}
              onChange={(event) => setNewAmenityName(event.target.value)}
              placeholder="Create new amenity e.g. Swimming Pool"
              className="h-11 rounded-xl"
            />
            <Input
              value={newAmenityDescription}
              onChange={(event) => setNewAmenityDescription(event.target.value)}
              placeholder="Optional description"
              className="h-11 rounded-xl"
            />
            <AppButton
              type="button"
              disabled={isPending || !newAmenityName.trim()}
              onClick={handleCreateAmenity}
              className="h-11 rounded-xl text-sm"
            >
              Create & Attach Amenity
            </AppButton>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-slate-950">
            Tags
          </h2>

          <div className="mt-5 flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                disabled={isPending}
                onClick={() =>
                  postContent(
                    { action: "detach-tag", tagId: tag.id },
                    "Tag detached.",
                  )
                }
                className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
              >
                {tag.name} ×
              </button>
            ))}

            {selectedTags.length === 0 ? (
              <AppStatusBadge tone="neutral">No tags attached</AppStatusBadge>
            ) : null}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
            <AppSelect
              value={tagId}
              onValueChange={setTagId}
              placeholder="Select tag"
              options={optionList(availableTags)}
              triggerClassName="h-11 w-full justify-between rounded-xl border-slate-200 bg-white text-sm font-semibold"
              contentClassName="min-w-[var(--radix-select-trigger-width)] rounded-2xl"
            />

            <AppButton
              type="button"
              disabled={isPending || !tagId}
              onClick={() =>
                postContent({ action: "attach-tag", tagId }, "Tag attached.")
              }
              className="h-11 rounded-xl px-5 text-sm"
            >
              Attach
            </AppButton>
          </div>

          <div className="mt-6 grid gap-3">
            <Input
              value={newTagName}
              onChange={(event) => setNewTagName(event.target.value)}
              placeholder="Create new tag e.g. Freehold"
              className="h-11 rounded-xl"
            />
            <Input
              value={newTagDescription}
              onChange={(event) => setNewTagDescription(event.target.value)}
              placeholder="Optional description"
              className="h-11 rounded-xl"
            />
            <AppButton
              type="button"
              disabled={isPending || !newTagName.trim()}
              onClick={handleCreateTag}
              className="h-11 rounded-xl text-sm"
            >
              Create & Attach Tag
            </AppButton>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black tracking-tight text-slate-950">
          Nearby Places
        </h2>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr_0.7fr_0.5fr_auto] lg:items-end">
          <Input
            value={nearbyName}
            onChange={(event) => setNearbyName(event.target.value)}
            placeholder="Paradigm Mall Johor Bahru"
            className="h-11 rounded-xl"
          />

          <AppSelect
            value={nearbyCategory}
            onValueChange={setNearbyCategory}
            placeholder="Category"
            options={nearbyCategoryOptions}
            triggerClassName="h-11 w-full justify-between rounded-xl border-slate-200 bg-white text-sm font-semibold"
            contentClassName="min-w-[var(--radix-select-trigger-width)] rounded-2xl"
          />

          <Input
            type="number"
            min={0}
            step="0.1"
            value={nearbyDistanceKm}
            onChange={(event) => setNearbyDistanceKm(event.target.value)}
            placeholder="Distance km"
            className="h-11 rounded-xl"
          />

          <Input
            type="number"
            min={0}
            value={nearbySortOrder}
            onChange={(event) => setNearbySortOrder(event.target.value)}
            placeholder="Order"
            className="h-11 rounded-xl"
          />

          <AppButton
            type="button"
            disabled={isPending || !nearbyName.trim()}
            onClick={handleCreateNearby}
            className="h-11 rounded-xl px-5 text-sm"
          >
            Add Nearby
          </AppButton>
        </div>

        <div className="mt-6 space-y-3">
          {nearbyPlaces.map((item) => (
            <NearbyRow key={item.id} projectId={projectId} item={item} />
          ))}

          {nearbyPlaces.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="text-sm font-bold text-slate-700">
                No nearby places found.
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
