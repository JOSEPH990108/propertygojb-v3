"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { AppButton } from "@/components/common/app-button";
import { AppStatusBadge } from "@/components/common/app-status-badge";
import { Input } from "@/components/ui/input";
import { postJson } from "@/lib/api/client";
import { appToast } from "@/lib/app-toast";

type LookupItem = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
};

type LookupEditorProps = {
  lookupKey: string;
  items: LookupItem[];
};

function normalizeCode(value: string) {
  return value.toUpperCase().trim().replace(/\s+/g, "_");
}

function LookupRow({
  lookupKey,
  item,
}: {
  lookupKey: string;
  item: LookupItem;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [code, setCode] = useState(item.code);
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description ?? "");
  const [color, setColor] = useState(item.color ?? "");
  const [icon, setIcon] = useState(item.icon ?? "");
  const [sortOrder, setSortOrder] = useState(String(item.sortOrder));

  function handleUpdate() {
    startTransition(async () => {
      const result = await postJson(`/api/admin/settings/lookups/${lookupKey}`, {
        action: "update",
        id: item.id,
        code,
        name,
        description,
        color,
        icon,
        sortOrder: Number(sortOrder) || 0,
      });

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      appToast.success("Lookup item updated.");
      router.refresh();
    });
  }

  function handleToggleActive() {
    startTransition(async () => {
      const result = await postJson(`/api/admin/settings/lookups/${lookupKey}`, {
        action: "toggle-active",
        id: item.id,
        isActive: !item.isActive,
      });

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      appToast.success(item.isActive ? "Lookup item disabled." : "Lookup item enabled.");
      router.refresh();
    });
  }

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr_1.6fr_0.8fr_0.8fr_0.6fr_auto] xl:items-end">
        <label className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Code
          </span>
          <Input
            value={code}
            onChange={(event) => setCode(normalizeCode(event.target.value))}
            className="h-11 rounded-xl"
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Name
          </span>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-11 rounded-xl"
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Description
          </span>
          <Input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="h-11 rounded-xl"
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Color
          </span>
          <Input
            value={color}
            onChange={(event) => setColor(event.target.value)}
            placeholder="#2563eb"
            className="h-11 rounded-xl"
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Icon
          </span>
          <Input
            value={icon}
            onChange={(event) => setIcon(event.target.value)}
            placeholder="home"
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
          <AppStatusBadge tone={item.isActive ? "success" : "danger"}>
            {item.isActive ? "Active" : "Inactive"}
          </AppStatusBadge>

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
        </div>
      </div>
    </div>
  );
}

export function LookupEditor({ lookupKey, items }: LookupEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("");
  const [icon, setIcon] = useState("");
  const [sortOrder, setSortOrder] = useState("0");

  function handleCreate() {
    startTransition(async () => {
      const result = await postJson(`/api/admin/settings/lookups/${lookupKey}`, {
        action: "create",
        code,
        name,
        description,
        color,
        icon,
        sortOrder: Number(sortOrder) || 0,
        isActive: true,
      });

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      setCode("");
      setName("");
      setDescription("");
      setColor("");
      setIcon("");
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
        <p className="mt-1 text-sm text-slate-500">
          Add a new lookup value. Use uppercase snake case for codes.
        </p>

        <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_1.2fr_1.6fr_0.8fr_0.8fr_0.6fr_auto] xl:items-end">
          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-700">Code</span>
            <Input
              value={code}
              onChange={(event) => setCode(normalizeCode(event.target.value))}
              placeholder="COMING_SOON"
              className="h-11 rounded-xl"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-700">Name</span>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Coming Soon"
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
            <span className="text-sm font-bold text-slate-700">Icon</span>
            <Input
              value={icon}
              onChange={(event) => setIcon(event.target.value)}
              placeholder="home"
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
            disabled={isPending || !code.trim() || !name.trim()}
            onClick={handleCreate}
            className="h-11 rounded-xl px-5 text-sm"
          >
            {isPending ? "Creating..." : "Create"}
          </AppButton>
        </div>
      </section>

      <section className="space-y-3">
        {items.map((item) => (
          <LookupRow key={item.id} lookupKey={lookupKey} item={item} />
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
