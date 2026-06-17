"use client";

import type { ReactNode } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type AppSelectOption = {
  value: string;
  label: string;
  description?: string;
  leading?: ReactNode;
};

type AppSelectProps = {
  value: string;
  options: AppSelectOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  disabled?: boolean;
  renderValue?: (option: AppSelectOption | undefined) => ReactNode;
  renderOption?: (option: AppSelectOption) => ReactNode;
};

export function AppSelect({
  value,
  options,
  onValueChange,
  placeholder = "Select option",
  searchable = false,
  searchPlaceholder = "Search...",
  className,
  triggerClassName,
  contentClassName,
  disabled,
  renderValue,
  renderOption,
}: AppSelectProps) {
  const selected = options.find((option) => option.value === value);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          disabled={disabled}
          type="button"
          variant="outline"
          className={cn(
            "h-12 justify-between rounded-2xl border-slate-200 bg-white/80 px-4 font-medium text-slate-900 shadow-sm hover:bg-white",
            triggerClassName,
            className,
          )}
        >
          <span className="min-w-0 truncate">
            {renderValue
              ? renderValue(selected)
              : selected
                ? selected.label
                : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 text-slate-400" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className={cn(
          "w-[var(--radix-popover-trigger-width)] min-w-64 rounded-2xl border-slate-200 bg-white/95 p-2 shadow-2xl backdrop-blur-xl",
          contentClassName,
  disabled,
        )}
      >
        <Command>
          {searchable ? (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <CommandInput
                placeholder={searchPlaceholder}
                className="h-10 pl-9"
              />
            </div>
          ) : null}

          <CommandList>
            <CommandEmpty>No result found.</CommandEmpty>

            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.label} ${option.value} ${option.description ?? ""}`}
                  onSelect={() => onValueChange(option.value)}
                  className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3"
                >
                  {renderOption ? (
                    renderOption(option)
                  ) : (
                    <>
                      {option.leading ? (
                        <span className="shrink-0">{option.leading}</span>
                      ) : null}

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{option.label}</p>
                        {option.description ? (
                          <p className="truncate text-xs text-slate-500">
                            {option.description}
                          </p>
                        ) : null}
                      </div>
                    </>
                  )}

                  <Check
                    className={cn(
                      "ml-auto size-4 text-blue-600",
                      value === option.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
