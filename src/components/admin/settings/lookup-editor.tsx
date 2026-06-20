"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { AppButton } from "@/components/common/app-button";
import { AppConfirmButton } from "@/components/common/app-confirm-button";
import { AppStatusBadge } from "@/components/common/app-status-badge";
import { Input } from "@/components/ui/input";
import { postJson } from "@/lib/api/client";
import { appToast } from "@/lib/app-toast";

type LookupKind = "code" | "slug";

type LookupItem = {
  id: string;
  code: string;
  slug: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  deletedAt: string | null;
};

type LookupEditorProps = {
  lookupKey: string;
  kind: LookupKind;
  items: LookupItem[];
};

function normalizeCode(value: string) {
  return value.toUpperCase().trim().replace(/\s+/g, "_");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function LookupRow({
  lookupKey,
  kind,
  item,
}: {
  lookupKey: string;
  kind: LookupKind;
  item: LookupItem;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [code, setCode] = useState(item.code);
  const [slug, setSlug] = useState(item.slug);
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description ?? "");
  const [color, setColor] = useState(item.color ?? "");
  const [icon, setIcon] = useState(item.icon ?? "");
  const [sortOrder, setSortOrder] = useState(String(item.sortOrder));

  const isDeleted = Boolean(item.deletedAt);

  function postAction(payload: Record<string, unknown>, successMessage: string) {
    startTransition(async () => {
      const result = await postJson(`/api/admin/settings/lookups/${lookupKey}`, payload);

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      appToast.success(successMessage);
      router.refresh();
    });
  }

  function handleUpdate() {
    if (kind === "code") {
      postAction(
        {
          action: "update",
          id: item.id,
          code,
          name,
          description,
          color,
          icon,
          sortOrder: Number(sortOrder) || 0,
        },
        "Lookup item updated.",
      );
      return;
    }

    postAction(
      {
        action: "update",
        id: item.id,
        slug,
        name,
        description,
      },
      "Lookup item updated.",
    );
  }

  function handleToggleActive() {
    postAction(
      {
        action: "toggle-active",
        id: item.id,
        isActive: !item.isActive,
      },
      item.isActive ? "Lookup item disabled." : "Lookup item enabled.",
    );
  }

  function handleSoftDelete() {
    postAction(
      {
        action: "soft-delete",
        id: item.id,
      },
      "Lookup item deleted.",
    );
  }

  function handleRestore() {
    postAction(
      {
        action: "restore",
        id: item.id,
      },
      "Lookup item restored.",
    );
  }

  function handlePermanentDelete() {
    postAction(
      {
        action: "permanent-delete",
        id: item.id,
      },
      "Lookup item permanently deleted.",
    );
  }

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr_1.6fr_0.7fr_0.7fr_auto] xl:items-end">
        {kind === "code" ? (
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Code
            </span>
            <Input
              value={code}
              disabled={isDeleted}
              onChange={(event) => setCode(normalizeCode(event.target.value))}
              className="h-11 rounded-xl"
            />
          </label>
        ) : (
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Slug
            </span>
            <Input
              value={slug}
              disabled={isDeleted}
              onChange={(event) => setSlug(slugify(event.target.value))}
              className="h-11 rounded-xl"
            />
          </label>
        )}

        <label className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Name
          </span>
          <Input
            value={name}
            disabled={isDeleted}
            onChange={(event) => {
              setName(event.target.value);
              if (kind === "slug") {
                setSlug(slugify(event.target.value));
              }
            }}
            className="h-11 rounded-xl"
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Description
          </span>
          <Input
            value={description}
            disabled={isDeleted}
            onChange={(event) => setDescription(event.target.value)}
            className="h-11 rounded-xl"
          />
        </label>

        {kind === "code" ? (
          <>
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Color
              </span>
              <Input
                value={color}
                disabled={isDeleted}
                onChange={(event) => setColor(event.target.value)}
                placeholder="#2563eb"
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
                disabled={isDeleted}
                onChange={(event) => setSortOrder(event.target.value)}
                className="h-11 rounded-xl"
              />
            </label>
          </>
        ) : (
          <>
            <div className="hidden xl:block" />
            <div className="hidden xl:block" />
          </>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {isDeleted ? (
            <AppStatusBadge tone="danger">Deleted</AppStatusBadge>
          ) : (
            <AppStatusBadge tone={item.isActive ? "success" : "warning"}>
              {item.isActive ? "Active" : "Inactive"}
            </AppStatusBadge>
          )}

          {!isDeleted ? (
            <>
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
                onClick={handleToggleActive}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {item.isActive ? "Disable" : "Enable"}
              </button>

              <AppConfirmButton
                disabled={isPending}
                title="Delete lookup item?"
                description="This will soft delete the lookup item and disable it from normal usage. You can restore it later."
                confirmText="Delete Item"
                cancelText="Keep Item"
                tone="danger"
                onConfirm={handleSoftDelete}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-red-200 bg-white px-4 text-sm font-bold text-red-600 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Delete
              </AppConfirmButton>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={isPending}
                onClick={handleRestore}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-emerald-200 bg-white px-4 text-sm font-bold text-emerald-600 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Restore
              </button>

              <AppConfirmButton
                disabled={isPending}
                title="Permanently delete lookup item?"
                description="This action cannot be undone. It may also fail if this lookup item is already used by projects, units, bookings, or other records."
                confirmText="Permanent Delete"
                cancelText="Cancel"
                tone="danger"
                onConfirm={handlePermanentDelete}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-red-300 bg-red-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Permanent Delete
              </AppConfirmButton>
            </>
          )}
        </div>
      </div>

      {kind === "code" ? (
        <div className="mt-3 hidden">
          <Input value={icon} onChange={(event) => setIcon(event.target.value)} />
        </div>
      ) : null}
    </div>
  );
}

export function LookupEditor({ lookupKey, kind, items }: LookupEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [code, setCode] = useState("");
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("");
  const [icon] = useState("");
  const [sortOrder, setSortOrder] = useState("0");

  function handleCreate() {
    startTransition(async () => {
      const payload =
        kind === "code"
          ? {
              action: "create",
              code,
              name,
              description,
              color,
              icon,
              sortOrder: Number(sortOrder) || 0,
              isActive: true,
            }
          : {
              action: "create",
              slug,
              name,
              description,
              isActive: true,
            };

      const result = await postJson(
        `/api/admin/settings/lookups/${lookupKey}`,
        payload,
      );

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      setCode("");
      setSlug("");
      setName("");
      setDescription("");
      setColor("");
      setSortOrder("0");

      appToast.success("Lookup item created.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black tracking-tight text-slate-950">
          Create New Item
        </h2>

        <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_1.2fr_1.6fr_0.7fr_0.7fr_auto] xl:items-end">
          {kind === "code" ? (
            <label className="space-y-2">
              <span className="text-sm font-bold text-slate-700">Code</span>
              <Input
                value={code}
                onChange={(event) => setCode(normalizeCode(event.target.value))}
                placeholder="COMING_SOON"
                className="h-11 rounded-xl"
              />
            </label>
          ) : (
            <label className="space-y-2">
              <span className="text-sm font-bold text-slate-700">Slug</span>
              <Input
                value={slug}
                onChange={(event) => setSlug(slugify(event.target.value))}
                placeholder="swimming-pool"
                className="h-11 rounded-xl"
              />
            </label>
          )}

          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-700">Name</span>
            <Input
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (kind === "slug") {
                  setSlug(slugify(event.target.value));
                }
              }}
              placeholder={kind === "code" ? "Coming Soon" : "Swimming Pool"}
              className="h-11 rounded-xl"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-700">
              Description
            </span>
            <Input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional description"
              className="h-11 rounded-xl"
            />
          </label>

          {kind === "code" ? (
            <>
              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-700">Color</span>
                <Input
                  value={color}
                  onChange={(event) => setColor(event.target.value)}
                  placeholder="#2563eb"
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
            </>
          ) : (
            <>
              <div className="hidden xl:block" />
              <div className="hidden xl:block" />
            </>
          )}

          <AppButton
            type="button"
            disabled={isPending || !name.trim() || (kind === "code" && !code.trim())}
            onClick={handleCreate}
            className="h-11 rounded-xl px-5 text-sm"
          >
            {isPending ? "Creating..." : "Create"}
          </AppButton>
        </div>
      </section>

      <section className="space-y-3">
        {items.map((item) => (
          <LookupRow
            key={item.id}
            lookupKey={lookupKey}
            kind={kind}
            item={item}
          />
        ))}

        {items.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-sm font-bold text-slate-700">
              No lookup items found.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Create the first item above.
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
