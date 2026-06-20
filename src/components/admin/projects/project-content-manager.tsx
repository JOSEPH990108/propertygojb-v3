"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { AppButton } from "@/components/common/app-button";
import { AppSelect } from "@/components/common/app-select";
import { AppStatusBadge } from "@/components/common/app-status-badge";
import { Input } from "@/components/ui/input";
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
  amenities,
  selectedAmenityIds,
  tags,
  selectedTagIds,
  nearbyPlaces,
}: ProjectContentManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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

  return (
    <div className="space-y-8">
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
