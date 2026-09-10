"use client";

import { FormEvent, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

import { AppButton } from "@/components/common/app-button";
import {
  AppSelect,
  type AppSelectOption,
} from "@/components/common/app-select";

type PublicProjectQuickSearchProps = {
  regionOptions: { value: string; label: string; description?: string }[];
  initialQuery?: string;
  initialRegionId?: string;
};

export function PublicProjectQuickSearch({
  regionOptions,
  initialQuery = "",
  initialRegionId = "",
}: PublicProjectQuickSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [regionId, setRegionId] = useState(initialRegionId);

  const regionSelectOptions = useMemo<AppSelectOption[]>(
    () => [
      { value: "", label: "All Locations" },
      ...regionOptions.map((option) => ({
        value: option.value,
        label: option.label,
        description: option.description,
      })),
    ],
    [regionOptions],
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const params = new URLSearchParams();

    if (query.trim()) {
      params.set("q", query.trim());
    }

    if (regionId) {
      params.set("regionId", regionId);
    }

    const queryString = params.toString();
    router.push(queryString ? `/projects?${queryString}` : "/projects");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-3 rounded-none border border-border bg-card p-3 text-card-foreground shadow-xl md:grid-cols-[1.5fr_1fr_auto]"
    >
      <label className="relative block">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search project, developer, area..."
          className="h-14 w-full rounded-2xl border border-border bg-background px-11 pr-4 text-sm font-semibold text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
      </label>

      <AppSelect
        value={regionId}
        options={regionSelectOptions}
        onValueChange={setRegionId}
        placeholder="Choose location"
        searchable
        triggerClassName="h-14 w-full rounded-2xl border-border bg-background px-4 text-left text-sm font-semibold text-foreground shadow-none hover:bg-muted"
        contentClassName="min-w-[var(--radix-select-trigger-width)] rounded-2xl"
        renderValue={(option) => option?.label ?? "All Locations"}
      />

      <AppButton type="submit" appSize="lg" className="rounded-2xl px-6">
        Search Projects
      </AppButton>
    </form>
  );
}
