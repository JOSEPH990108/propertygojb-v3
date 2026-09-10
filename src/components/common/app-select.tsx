"use client";

import { type ReactNode, useState } from "react";
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
  id?: string;
  ariaLabelledBy?: string;
  /** Id(s) of related hint/error text, forwarded to the trigger button. */
  ariaDescribedBy?: string;
  /** Marks the trigger invalid for assistive tech and the shared destructive input styling. */
  ariaInvalid?: boolean;
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
  /** Closes the popover right after an option is chosen. Defaults to `true`; pass `false` to keep it open. */
  closeOnSelect?: boolean;
  renderValue?: (option: AppSelectOption | undefined) => ReactNode;
  renderOption?: (option: AppSelectOption) => ReactNode;
};

export function AppSelect({
  id,
  ariaLabelledBy,
  ariaDescribedBy,
  ariaInvalid,
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
  closeOnSelect = true,
  renderValue,
  renderOption,
}: AppSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  function handleSelect(optionValue: string) {
    onValueChange(optionValue);

    if (closeOnSelect) {
      setOpen(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid || undefined}
          disabled={disabled}
          type="button"
          variant="outline"
          className={cn(
            "h-12 justify-between rounded-2xl border-border bg-background px-4 font-medium text-foreground shadow-sm hover:bg-accent",
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
          <ChevronsUpDown className="ml-2 size-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className={cn(
          "w-[var(--radix-popover-trigger-width)] rounded-2xl border-border bg-popover/95 p-2 text-popover-foreground shadow-2xl backdrop-blur-xl",
          contentClassName,
        )}
      >
        <Command>
          {searchable ? (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
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
                  onSelect={() => handleSelect(option.value)}
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
                          <p className="truncate text-xs text-muted-foreground">
                            {option.description}
                          </p>
                        ) : null}
                      </div>
                    </>
                  )}

                  <Check
                    className={cn(
                      "ml-auto size-4 text-primary",
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
