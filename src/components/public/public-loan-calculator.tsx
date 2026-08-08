"use client";

import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";

import { AppSelect, type AppSelectOption } from "@/components/common/app-select";

type PublicLoanCalculatorLayout = {
  id: string;
  code: string;
  name: string | null;
  builtUpSqft: string;
  bedrooms: number;
  bathrooms: number;
  hasBalcony: boolean;
  priceFrom: number | null;
  availableUnitCount: number;
};

type PublicLoanCalculatorProps = {
  layouts: PublicLoanCalculatorLayout[];
};

type LayoutSelectOption = AppSelectOption & {
  layout: PublicLoanCalculatorLayout;
};

function formatMyr(value: number | null) {
  if (!value || !Number.isFinite(value) || value <= 0) {
    return "Contact for price";
  }

  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  }).format(value);
}

function calculateMonthlyInstallment(principal: number, annualRate: number, tenureYears: number) {
  const months = tenureYears * 12;

  if (principal <= 0 || months <= 0) {
    return 0;
  }

  const monthlyRate = annualRate / 12 / 100;

  if (monthlyRate === 0) {
    return principal / months;
  }

  return (principal * monthlyRate) / (1 - (1 + monthlyRate) ** -months);
}

export function PublicLoanCalculator({ layouts }: PublicLoanCalculatorProps) {
  const selectableLayouts = layouts.filter((layout) => layout.priceFrom && layout.priceFrom > 0);
  const defaultLayout = selectableLayouts[0] ?? layouts[0] ?? null;

  const [selectedLayoutId, setSelectedLayoutId] = useState(defaultLayout?.id ?? "");
  const [downPaymentPercent, setDownPaymentPercent] = useState("10");
  const [annualRate, setAnnualRate] = useState("4.5");
  const [tenureYears, setTenureYears] = useState("35");

  const selectedLayout = layouts.find((layout) => layout.id === selectedLayoutId) ?? defaultLayout;
  const selectedPrice = selectedLayout?.priceFrom ?? 0;
  const parsedDownPaymentPercent = Number(downPaymentPercent);
  const parsedAnnualRate = Number(annualRate);
  const parsedTenureYears = Number(tenureYears);
  const downPayment = (selectedPrice * (Number.isFinite(parsedDownPaymentPercent) ? parsedDownPaymentPercent : 0)) / 100;
  const loanAmount = Math.max(selectedPrice - downPayment, 0);
  const monthlyInstallment = calculateMonthlyInstallment(
    loanAmount,
    Number.isFinite(parsedAnnualRate) ? parsedAnnualRate : 0,
    Number.isFinite(parsedTenureYears) ? parsedTenureYears : 0,
  );

  const layoutOptions = useMemo<LayoutSelectOption[]>(
    () =>
      layouts.map((layout) => ({
        value: layout.id,
        label: `${layout.code} - ${layout.name ?? layout.code}`,
        description: `${formatMyr(layout.priceFrom)} · ${layout.bedrooms} Bedroom · ${layout.bathrooms} Bathroom`,
        layout,
      })),
    [layouts],
  );

  const summaryItems = useMemo(
    () => [
      {
        label: "SPA price",
        value: formatMyr(selectedPrice),
      },
      {
        label: "Loan amount",
        value: formatMyr(loanAmount),
      },
      {
        label: "Estimated monthly",
        value: formatMyr(monthlyInstallment),
      },
    ],
    [loanAmount, monthlyInstallment, selectedPrice],
  );

  return (
    <div className="space-y-6 rounded-[1.75rem] border border-blue-200/60 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-5 shadow-[0_18px_50px_-32px_rgba(15,23,42,0.45)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-700">
            Loan calculator
          </p>
          <h3 className="mt-2 text-xl font-black tracking-tight text-foreground">
            Estimate your monthly installment
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Choose a layout and adjust the down payment, interest rate, and tenure to preview the monthly commitment.
          </p>
        </div>

        <div className="rounded-2xl bg-blue-600 p-3 text-white shadow-lg shadow-blue-500/25">
          <Calculator className="size-5" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <label className="space-y-2 text-sm font-semibold text-foreground sm:col-span-2 xl:col-span-3">
          <span className="block text-xs font-black uppercase tracking-[0.22em] text-muted-foreground">
            Select layout
          </span>
          <AppSelect
            value={selectedLayout?.id ?? ""}
            onValueChange={setSelectedLayoutId}
            options={layoutOptions}
            placeholder="Choose layout"
            searchable
            searchPlaceholder="Search layout"
            triggerClassName="h-12 w-full justify-between rounded-2xl border-border bg-background px-4 text-left text-sm font-semibold text-foreground shadow-sm"
            contentClassName="min-w-[var(--radix-popover-trigger-width)] rounded-2xl"
            renderValue={(option) => option?.label ?? "Choose layout"}
            renderOption={(option) => {
              const layoutOption = option as LayoutSelectOption;

              return (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{layoutOption.label}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {layoutOption.layout.builtUpSqft} sqft · {formatMyr(layoutOption.layout.priceFrom)}
                    </p>
                  </div>
                </>
              );
            }}
          />
        </label>

        <label className="space-y-2 text-sm font-semibold text-foreground">
          <span className="block text-xs font-black uppercase tracking-[0.22em] text-muted-foreground">
            Down payment
          </span>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="90"
              step="1"
              value={downPaymentPercent}
              onChange={(event) => setDownPaymentPercent(event.target.value)}
              className="h-12 w-full rounded-2xl border border-border bg-background px-4 pr-12 text-sm font-semibold text-foreground outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
            />
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-black text-blue-700">
              %
            </span>
          </div>
        </label>

        <label className="space-y-2 text-sm font-semibold text-foreground">
          <span className="block text-xs font-black uppercase tracking-[0.22em] text-muted-foreground">
            Interest rate
          </span>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="20"
              step="0.1"
              value={annualRate}
              onChange={(event) => setAnnualRate(event.target.value)}
              className="h-12 w-full rounded-2xl border border-border bg-background px-4 pr-12 text-sm font-semibold text-foreground outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
            />
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-black text-blue-700">
              p.a.
            </span>
          </div>
        </label>

        <label className="space-y-2 text-sm font-semibold text-foreground">
          <span className="block text-xs font-black uppercase tracking-[0.22em] text-muted-foreground">
            Tenure
          </span>
          <div className="relative">
            <input
              type="number"
              min="1"
              max="40"
              step="1"
              value={tenureYears}
              onChange={(event) => setTenureYears(event.target.value)}
              className="h-12 w-full rounded-2xl border border-border bg-background px-4 pr-14 text-sm font-semibold text-foreground outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
            />
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-black text-blue-700">
              years
            </span>
          </div>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {summaryItems.map((item) => (
          <div key={item.label} className="rounded-2xl border border-white/80 bg-white px-4 py-3 shadow-sm">
            <p className="text-[0.7rem] font-black uppercase tracking-[0.22em] text-muted-foreground">
              {item.label}
            </p>
            <p className="mt-2 text-lg font-black tracking-tight text-foreground">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
        <span className="rounded-full bg-blue-600 px-3 py-1 font-black text-white">
          {selectedLayout?.code ?? "Layout"}
        </span>
        <span>
          {selectedLayout?.bedrooms ?? 0} Bedroom · {selectedLayout?.bathrooms ?? 0} Bathroom · {selectedLayout?.hasBalcony ? "Balcony" : "No balcony"}
        </span>
      </div>

      {selectedLayout?.availableUnitCount ? (
        <p className="text-xs font-semibold text-muted-foreground">
          {selectedLayout.availableUnitCount} available unit{selectedLayout.availableUnitCount > 1 ? "s" : ""} in this layout.
        </p>
      ) : null}
    </div>
  );
}
