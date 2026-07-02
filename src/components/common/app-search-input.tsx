"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

type AppSearchInputProps = {
  paramName?: string;
  placeholder?: string;
  initialValue?: string;
  debounceMs?: number;
  resetParams?: string[];
  className?: string;
  inputClassName?: string;
};

export function AppSearchInput({
  paramName = "q",
  placeholder = "Search...",
  initialValue = "",
  debounceMs = 350,
  resetParams = [],
  className,
  inputClassName,
}: AppSearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [value, setValue] = useState(() => {
    return searchParams.get(paramName) ?? initialValue;
  });
  const [isPending, startTransition] = useTransition();

  const resetParamsKey = useMemo(() => resetParams.join("|"), [resetParams]);

  useEffect(() => {
    const currentValue = searchParams.get(paramName) ?? "";

    if (value === currentValue) {
      return;
    }

    const timer = window.setTimeout(() => {
      startTransition(() => {
        const nextParams = new URLSearchParams(searchParams.toString());
        const trimmedValue = value.trim();

        if (trimmedValue) {
          nextParams.set(paramName, trimmedValue);
        } else {
          nextParams.delete(paramName);
        }

        for (const resetParam of resetParamsKey.split("|").filter(Boolean)) {
          nextParams.delete(resetParam);
        }

        const queryString = nextParams.toString();

        router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
          scroll: false,
        });
      });
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [
    debounceMs,
    paramName,
    pathname,
    resetParamsKey,
    router,
    searchParams,
    value,
  ]);

  return (
    <div className={cn("relative w-full", className)}>
      <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className={cn(
          "h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-11 text-sm outline-none transition",
          "focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20",
          isPending ? "opacity-80" : "opacity-100",
          inputClassName,
        )}
      />

      {value ? (
        <button
          type="button"
          onClick={() => setValue("")}
          className="absolute right-4 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
          aria-label="Clear search"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
