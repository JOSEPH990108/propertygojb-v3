"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState, useTransition } from "react";

import { AppButton } from "@/components/common/app-button";
import { AppSelect } from "@/components/common/app-select";
import { AppStatusBadge } from "@/components/common/app-status-badge";
import { Input } from "@/components/ui/input";
import { postJson } from "@/lib/api/client";
import { appToast } from "@/lib/app-toast";

type SelectOption = {
  id: string;
  name: string;
  code?: string | null;
  parentId?: string | null;
};

type ProjectEditValue = {
  id: string;
  name: string;
  displayName: string | null;
  legalName: string | null;
  slug: string;
  developerId: string;
  propertyCategoryId: string | null;
  propertyTypeId: string | null;
  projectStatusId: string | null;
  tenureTypeId: string;
  titleTypeId: string | null;
  regionId: string | null;
  areaId: string | null;
  address: string | null;
  totalUnits: number;
  launchYear: number | null;
  isHotDeal: boolean;
  isPublished: boolean;
};

type ProjectEditFormProps = {
  project: ProjectEditValue;
  developers: SelectOption[];
  projectStatuses: SelectOption[];
  propertyCategories: SelectOption[];
  propertyTypes: SelectOption[];
  tenureTypes: SelectOption[];
  titleTypes: SelectOption[];
  regions: SelectOption[];
  areas: SelectOption[];
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = "Select option",
  required,
  disabled,
  helperText,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <span className="text-sm font-bold text-slate-700">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>

      <AppSelect
        value={value}
        onValueChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        options={options.map((option) => ({
          value: option.id,
          label: option.code ? `${option.name} (${option.code})` : option.name,
        }))}
        triggerClassName="h-12 w-full justify-between rounded-2xl border-slate-200 bg-white px-4 text-left text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
        contentClassName="min-w-[var(--radix-select-trigger-width)] rounded-2xl"
      />

      {helperText ? (
        <p className="text-xs font-medium text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}

export function ProjectEditForm({
  project,
  developers,
  projectStatuses,
  propertyCategories,
  propertyTypes,
  tenureTypes,
  titleTypes,
  regions,
  areas,
}: ProjectEditFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [displayName, setDisplayName] = useState(
    project.displayName ?? project.name,
  );
  const [legalName, setLegalName] = useState(project.legalName ?? "");
  const [slug, setSlug] = useState(project.slug);
  const [developerId, setDeveloperId] = useState(project.developerId);
  const [projectStatusId, setProjectStatusId] = useState(
    project.projectStatusId ?? "",
  );
  const [propertyCategoryId, setPropertyCategoryId] = useState(
    project.propertyCategoryId ?? "",
  );
  const [propertyTypeId, setPropertyTypeId] = useState(
    project.propertyTypeId ?? "",
  );
  const [tenureTypeId, setTenureTypeId] = useState(project.tenureTypeId);
  const [titleTypeId, setTitleTypeId] = useState(project.titleTypeId ?? "");
  const [regionId, setRegionId] = useState(project.regionId ?? "");
  const [areaId, setAreaId] = useState(project.areaId ?? "");
  const [address, setAddress] = useState(project.address ?? "");
  const [totalUnits, setTotalUnits] = useState(String(project.totalUnits ?? 0));
  const [launchYear, setLaunchYear] = useState(
    project.launchYear ? String(project.launchYear) : "",
  );
  const [isHotDeal, setIsHotDeal] = useState(project.isHotDeal);
  const [isPublished, setIsPublished] = useState(project.isPublished);

  const filteredPropertyTypes = useMemo(() => {
    if (!propertyCategoryId) {
      return [];
    }

    return propertyTypes.filter(
      (propertyType) => propertyType.parentId === propertyCategoryId,
    );
  }, [propertyCategoryId, propertyTypes]);

  const filteredAreas = useMemo(() => {
    if (!regionId) {
      return [];
    }

    return areas.filter((area) => area.parentId === regionId);
  }, [areas, regionId]);

  const canSubmit = Boolean(
    displayName.trim() && slug.trim() && developerId && tenureTypeId,
  );

  function handleGenerateSlug() {
    setSlug(slugify(displayName));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const result = await postJson<{ projectId: string; slug: string }>(
        `/api/admin/projects/${project.id}`,
        {
          displayName,
          legalName,
          slug,
          developerId,
          propertyCategoryId,
          propertyTypeId,
          projectStatusId,
          tenureTypeId,
          titleTypeId,
          regionId,
          areaId,
          address,
          totalUnits: Number(totalUnits) || 0,
          launchYear: launchYear ? Number(launchYear) : null,
          isHotDeal,
          isPublished,
        },
      );

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      appToast.success("Project updated successfully.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-950">
              Basic Information
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Update project identity and catalog information.
            </p>
          </div>

          <AppStatusBadge tone={isPublished ? "success" : "warning"}>
            {isPublished ? "Published" : "Draft"}
          </AppStatusBadge>
        </div>

        <div className="mt-6 grid gap-x-6 gap-y-5 lg:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-700">
              Project Display Name <span className="text-red-500">*</span>
            </span>
            <Input
              value={displayName}
              required
              onChange={(event) => setDisplayName(event.target.value)}
              className="h-12 rounded-2xl"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-700">
              Legal Name
            </span>
            <Input
              value={legalName}
              onChange={(event) => setLegalName(event.target.value)}
              className="h-12 rounded-2xl"
            />
          </label>

          <label className="space-y-2 lg:col-span-2">
            <span className="text-sm font-bold text-slate-700">
              Public Slug <span className="text-red-500">*</span>
            </span>

            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <Input
                value={slug}
                required
                onChange={(event) => setSlug(slugify(event.target.value))}
                className="h-12 rounded-2xl"
              />

              <AppButton
                type="button"
                variant="secondary"
                onClick={handleGenerateSlug}
                className="h-12 rounded-2xl px-6"
              >
                Generate
              </AppButton>
            </div>

            <p className="text-xs text-slate-500">
              Public URL will be /projects/{slug || "your-project-slug"}
            </p>
          </label>

          <SelectField
            label="Developer"
            required
            value={developerId}
            onChange={setDeveloperId}
            options={developers}
          />

          <SelectField
            label="Project Status"
            value={projectStatusId}
            onChange={setProjectStatusId}
            options={projectStatuses}
          />

          <SelectField
            label="Property Category"
            value={propertyCategoryId}
            onChange={(nextValue) => {
              setPropertyCategoryId(nextValue);
              setPropertyTypeId("");
            }}
            options={propertyCategories}
            helperText="Property type will be filtered by selected category."
          />

          <SelectField
            label="Property Type"
            value={propertyTypeId}
            onChange={setPropertyTypeId}
            options={filteredPropertyTypes}
            placeholder={
              propertyCategoryId
                ? "Select property type"
                : "Select category first"
            }
            disabled={!propertyCategoryId}
            helperText={
              propertyCategoryId
                ? `${filteredPropertyTypes.length} type(s) available.`
                : "Property type depends on category."
            }
          />

          <SelectField
            label="Tenure Type"
            required
            value={tenureTypeId}
            onChange={setTenureTypeId}
            options={tenureTypes}
          />

          <SelectField
            label="Title Type"
            value={titleTypeId}
            onChange={setTitleTypeId}
            options={titleTypes}
          />
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black tracking-tight text-slate-950">
          Location & Launch
        </h2>

        <div className="mt-6 grid gap-x-6 gap-y-5 lg:grid-cols-2">
          <SelectField
            label="Region"
            value={regionId}
            onChange={(nextValue) => {
              setRegionId(nextValue);
              setAreaId("");
            }}
            options={regions}
            helperText="Area will be filtered by selected region."
          />

          <SelectField
            label="Area"
            value={areaId}
            onChange={setAreaId}
            options={filteredAreas}
            placeholder={regionId ? "Select area" : "Select region first"}
            disabled={!regionId}
            helperText={
              regionId
                ? `${filteredAreas.length} area(s) available.`
                : "Area depends on region."
            }
          />

          <label className="space-y-2 lg:col-span-2">
            <span className="text-sm font-bold text-slate-700">Address</span>
            <textarea
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-700">
              Total Units
            </span>
            <Input
              type="number"
              min={0}
              value={totalUnits}
              onChange={(event) => setTotalUnits(event.target.value)}
              className="h-12 rounded-2xl"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-700">
              Launch Year
            </span>
            <Input
              type="number"
              min={1900}
              max={2100}
              value={launchYear}
              onChange={(event) => setLaunchYear(event.target.value)}
              className="h-12 rounded-2xl"
            />
          </label>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black tracking-tight text-slate-950">
          Visibility Controls
        </h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="font-bold text-slate-950">Hot Deal</p>
              <p className="mt-1 text-sm text-slate-500">
                Highlight this project as a hot deal.
              </p>
            </div>

            <input
              type="checkbox"
              checked={isHotDeal}
              onChange={(event) => setIsHotDeal(event.target.checked)}
              className="size-5"
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="font-bold text-slate-950">Published</p>
              <p className="mt-1 text-sm text-slate-500">
                Make project visible to public project listing.
              </p>
            </div>

            <input
              type="checkbox"
              checked={isPublished}
              onChange={(event) => setIsPublished(event.target.checked)}
              className="size-5"
            />
          </label>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <AppButton
          type="button"
          variant="secondary"
          onClick={() => router.push("/admin/projects")}
          className="h-12 rounded-2xl px-6"
        >
          Back to Projects
        </AppButton>

        <AppButton
          type="submit"
          disabled={!canSubmit || isPending}
          className="h-12 rounded-2xl px-6"
        >
          {isPending ? "Saving..." : "Save Changes"}
        </AppButton>
      </div>
    </form>
  );
}
