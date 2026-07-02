"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { AppButton } from "@/components/common/app-button";
import { AppSelect } from "@/components/common/app-select";
import { AppStatusBadge } from "@/components/common/app-status-badge";
import { Input } from "@/components/ui/input";
import { postJson } from "@/lib/api/client";
import { appToast } from "@/lib/app-toast";

type CategoryItem = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
};

type PropertyTypeItem = {
  id: string;
  categoryId: string | null;
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
};

type PropertyClassificationManagerProps = {
  categories: CategoryItem[];
  propertyTypes: PropertyTypeItem[];
};

function normalizeCode(value: string) {
  return value.toUpperCase().trim().replace(/\s+/g, "_");
}

function CategoryRow({ category }: { category: CategoryItem }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [code, setCode] = useState(category.code);
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description ?? "");
  const [sortOrder, setSortOrder] = useState(String(category.sortOrder));

  function saveCategory() {
    startTransition(async () => {
      const result = await postJson("/api/admin/settings/property-types", {
        action: "update-category",
        id: category.id,
        code,
        name,
        description,
        sortOrder: Number(sortOrder) || 0,
      });

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      appToast.success("Category updated.");
      router.refresh();
    });
  }

  function toggleCategory() {
    startTransition(async () => {
      const result = await postJson("/api/admin/settings/property-types", {
        action: "toggle-category",
        id: category.id,
        isActive: !category.isActive,
      });

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      appToast.success(category.isActive ? "Category disabled." : "Category enabled.");
      router.refresh();
    });
  }

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr_1.6fr_0.6fr_auto] lg:items-end">
        <label className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Category Code
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
          <AppStatusBadge tone={category.isActive ? "success" : "danger"}>
            {category.isActive ? "Active" : "Inactive"}
          </AppStatusBadge>

          <AppButton
            type="button"
            disabled={isPending}
            onClick={saveCategory}
            className="h-10 rounded-xl px-4 text-sm"
          >
            Save
          </AppButton>

          <button
            type="button"
            disabled={isPending}
            onClick={toggleCategory}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {category.isActive ? "Disable" : "Enable"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PropertyTypeRow({
  item,
  categories,
}: {
  item: PropertyTypeItem;
  categories: CategoryItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [categoryId, setCategoryId] = useState(item.categoryId ?? "");
  const [code, setCode] = useState(item.code);
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description ?? "");
  const [sortOrder, setSortOrder] = useState(String(item.sortOrder));

  function saveType() {
    startTransition(async () => {
      const result = await postJson("/api/admin/settings/property-types", {
        action: "update-type",
        id: item.id,
        categoryId,
        code,
        name,
        description,
        sortOrder: Number(sortOrder) || 0,
      });

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      appToast.success("Property type updated.");
      router.refresh();
    });
  }

  function toggleType() {
    startTransition(async () => {
      const result = await postJson("/api/admin/settings/property-types", {
        action: "toggle-type",
        id: item.id,
        isActive: !item.isActive,
      });

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      appToast.success(item.isActive ? "Property type disabled." : "Property type enabled.");
      router.refresh();
    });
  }

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr_1.1fr_1.6fr_0.6fr_auto] xl:items-end">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Category
          </span>
          <AppSelect
            value={categoryId}
            onValueChange={setCategoryId}
            placeholder="Select category"
            options={categories.map((category) => ({
              value: category.id,
              label: `${category.name} (${category.code})`,
            }))}
            triggerClassName="h-11 w-full justify-between rounded-xl border-slate-200 bg-white text-sm font-semibold"
            contentClassName="min-w-[var(--radix-select-trigger-width)] rounded-2xl"
          />
        </div>

        <label className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Type Code
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
            disabled={isPending || !categoryId}
            onClick={saveType}
            className="h-10 rounded-xl px-4 text-sm"
          >
            Save
          </AppButton>

          <button
            type="button"
            disabled={isPending}
            onClick={toggleType}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {item.isActive ? "Disable" : "Enable"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PropertyClassificationManager({
  categories,
  propertyTypes,
}: PropertyClassificationManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [categoryCode, setCategoryCode] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categorySortOrder, setCategorySortOrder] = useState("0");

  const [typeCategoryId, setTypeCategoryId] = useState(categories[0]?.id ?? "");
  const [typeCode, setTypeCode] = useState("");
  const [typeName, setTypeName] = useState("");
  const [typeDescription, setTypeDescription] = useState("");
  const [typeSortOrder, setTypeSortOrder] = useState("0");

  const groupedPropertyTypes = useMemo(() => {
    return categories.map((category) => ({
      category,
      types: propertyTypes.filter((item) => item.categoryId === category.id),
    }));
  }, [categories, propertyTypes]);

  function createCategory() {
    startTransition(async () => {
      const result = await postJson("/api/admin/settings/property-types", {
        action: "create-category",
        code: categoryCode,
        name: categoryName,
        description: categoryDescription,
        sortOrder: Number(categorySortOrder) || 0,
      });

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      setCategoryCode("");
      setCategoryName("");
      setCategoryDescription("");
      setCategorySortOrder("0");

      appToast.success("Category created.");
      router.refresh();
    });
  }

  function createType() {
    startTransition(async () => {
      const result = await postJson("/api/admin/settings/property-types", {
        action: "create-type",
        categoryId: typeCategoryId,
        code: typeCode,
        name: typeName,
        description: typeDescription,
        sortOrder: Number(typeSortOrder) || 0,
      });

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      setTypeCode("");
      setTypeName("");
      setTypeDescription("");
      setTypeSortOrder("0");

      appToast.success("Property type created.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-2">
        <div className="flex h-full flex-col rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-slate-950">
            Create Category
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Example: HIGH_RISE, LANDED, COMMERCIAL.
          </p>

          <div className="mt-6 flex flex-1 flex-col gap-4">
            <Input
              value={categoryCode}
              onChange={(event) => setCategoryCode(normalizeCode(event.target.value))}
              placeholder="HIGH_RISE"
              className="h-11 rounded-xl"
            />
            <Input
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              placeholder="High Rise"
              className="h-11 rounded-xl"
            />
            <Input
              value={categoryDescription}
              onChange={(event) => setCategoryDescription(event.target.value)}
              placeholder="Optional description"
              className="h-11 rounded-xl"
            />
            <Input
              type="number"
              min={0}
              value={categorySortOrder}
              onChange={(event) => setCategorySortOrder(event.target.value)}
              className="h-11 rounded-xl"
            />

            <AppButton
              type="button"
              disabled={isPending || !categoryCode.trim() || !categoryName.trim()}
              onClick={createCategory}
              className="mt-auto h-11 rounded-xl"
            >
              Create Category
            </AppButton>
          </div>
        </div>

        <div className="flex h-full flex-col rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-slate-950">
            Create Property Type
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Example: High Rise → Condo, Apartment, Flat.
          </p>

          <div className="mt-6 flex flex-1 flex-col gap-4">
            <AppSelect
              value={typeCategoryId}
              onValueChange={setTypeCategoryId}
              placeholder="Select category"
              options={categories.map((category) => ({
                value: category.id,
                label: `${category.name} (${category.code})`,
              }))}
              triggerClassName="h-11 w-full justify-between rounded-xl border-slate-200 bg-white text-sm font-semibold"
              contentClassName="min-w-[var(--radix-select-trigger-width)] rounded-2xl"
            />
            <Input
              value={typeCode}
              onChange={(event) => setTypeCode(normalizeCode(event.target.value))}
              placeholder="CONDO"
              className="h-11 rounded-xl"
            />
            <Input
              value={typeName}
              onChange={(event) => setTypeName(event.target.value)}
              placeholder="Condo"
              className="h-11 rounded-xl"
            />
            <Input
              value={typeDescription}
              onChange={(event) => setTypeDescription(event.target.value)}
              placeholder="Optional description"
              className="h-11 rounded-xl"
            />
            <Input
              type="number"
              min={0}
              value={typeSortOrder}
              onChange={(event) => setTypeSortOrder(event.target.value)}
              className="h-11 rounded-xl"
            />

            <AppButton
              type="button"
              disabled={isPending || !typeCategoryId || !typeCode.trim() || !typeName.trim()}
              onClick={createType}
              className="mt-auto h-11 rounded-xl"
            >
              Create Property Type
            </AppButton>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-black tracking-tight text-slate-950">
          Categories
        </h2>

        {categories.map((category) => (
          <CategoryRow key={category.id} category={category} />
        ))}
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-black tracking-tight text-slate-950">
          Property Types by Category
        </h2>

        {groupedPropertyTypes.map(({ category, types }) => (
          <div
            key={category.id}
            className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-950">
                  {category.name}
                </h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {category.code}
                </p>
              </div>

              <AppStatusBadge tone={category.isActive ? "success" : "danger"}>
                {types.length} Type(s)
              </AppStatusBadge>
            </div>

            <div className="mt-5 space-y-3">
              {types.map((item) => (
                <PropertyTypeRow
                  key={item.id}
                  item={item}
                  categories={categories}
                />
              ))}

              {types.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
                  <p className="text-sm font-bold text-slate-700">
                    No property types under this category.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
