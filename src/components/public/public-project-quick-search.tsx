"use client";

import { FormEvent, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

import { AppSelect, type AppSelectOption } from "@/components/common/app-select";

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
      className="grid gap-3 rounded-[2rem] border border-white/20 bg-white/10 p-3 shadow-2xl backdrop-blur-xl md:grid-cols-[1.5fr_1fr_auto]"
    >
      <label className="relative block">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search project, developer, area..."
          className="h-14 w-full rounded-2xl border border-border bg-background px-11 pr-4 text-sm font-semibold text-foreground outline-none transition placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
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

      <button
        type="submit"
        className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 text-sm font-black text-white shadow-[0_18px_40px_-18px_rgba(37,99,235,0.95)] transition hover:bg-blue-700"
      >
        Search Projects
      </button>
    </form>
  );
}
