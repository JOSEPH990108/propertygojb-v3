"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { Banknote, CheckCircle2, CreditCard, ReceiptText } from "lucide-react";

import { AppSelect, type AppSelectOption } from "@/components/common/app-select";
import { Input } from "@/components/ui/input";
import { postJson } from "@/lib/api/client";
import { appToast } from "@/lib/app-toast";
import { formatMoney } from "@/lib/bookings/format";

type BookingPaymentComposerProps = {
  bookingId: string;
  bookingFeeAmount: string | number | null;
  bookingFeePaidAmount: string | number | null;
  currency: string;
  currentStatus: string;
};

type BookingPaymentResult = {
  bookingId: string;
  bookingCode: string;
  status: string;
  bookingFeePaidAmount: string;
  message?: string;
};

const paymentMethods = [
  {
    value: "BANK_TRANSFER",
    label: "Bank Transfer",
  },
  {
    value: "CASH",
    label: "Cash",
  },
  {
    value: "CARD",
    label: "Card",
  },
  {
    value: "EWALLET",
    label: "E-Wallet",
  },
  {
    value: "OTHER",
    label: "Other",
  },
];

function toNumber(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);
  return Number.isNaN(amount) ? 0 : amount;
}

export function BookingPaymentComposer({
  bookingId,
  bookingFeeAmount,
  bookingFeePaidAmount,
  currency,
  currentStatus,
}: BookingPaymentComposerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const totalFee = toNumber(bookingFeeAmount);
  const paidAmount = toNumber(bookingFeePaidAmount);
  const outstandingAmount = Math.max(totalFee - paidAmount, 0);

  const [amount, setAmount] = useState(
    outstandingAmount > 0 ? outstandingAmount.toFixed(2) : "",
  );
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [referenceNo, setReferenceNo] = useState("");
  const [receivedAt, setReceivedAt] = useState("");
  const [note, setNote] = useState("");
  const [markVerified, setMarkVerified] = useState(true);

  const isInactive = ["REJECTED", "EXPIRED", "CANCELLED"].includes(currentStatus);

  const paymentMethodOptions = useMemo<AppSelectOption[]>(
    () =>
      paymentMethods.map((method) => ({
        value: method.value,
        label: method.label,
        leading: (
          <span className="grid size-8 place-items-center rounded-xl bg-slate-50 text-slate-600">
            <CreditCard className="size-4" />
          </span>
        ),
      })),
    [],
  );

  const canSubmit =
    !isInactive &&
    !isPending &&
    Number(amount) > 0 &&
    Boolean(paymentMethod);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      appToast.error("Please enter a valid payment amount.");
      return;
    }

    startTransition(async () => {
      const result = await postJson<BookingPaymentResult>(
        "/api/internal/bookings/payment",
        {
          bookingId,
          amount: Number(amount),
          paymentMethod,
          referenceNo,
          receivedAt,
          note,
          markVerified,
        },
      );

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      appToast.success(result.message ?? "Payment recorded successfully.");
      router.refresh();
    });
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <Banknote className="h-4 w-4" />
            Admin Payment Action
          </div>

          <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">
            Add Booking Payment
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Record booking fee payment and optionally mark it as verified.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
          <div className="font-black text-slate-950">
            Outstanding: {formatMoney(outstandingAmount, currency)}
          </div>
          <div className="mt-1 text-xs font-semibold text-slate-500">
            Paid {formatMoney(paidAmount, currency)} /{" "}
            {formatMoney(totalFee, currency)}
          </div>
        </div>
      </div>

      {isInactive ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
          Payment cannot be added because this booking is inactive.
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-5 grid gap-4 xl:grid-cols-[14rem_18rem_1fr] xl:items-start"
        >
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              Amount
            </label>
            <div className="relative">
              <ReceiptText className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                disabled={isPending}
                placeholder="0.00"
                className="h-14 rounded-2xl bg-white pl-11 font-bold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              Payment Method
            </label>
            <AppSelect
              value={paymentMethod}
              options={paymentMethodOptions}
              onValueChange={setPaymentMethod}
              disabled={isPending}
              placeholder="Select method"
              triggerClassName="h-14 w-full rounded-2xl bg-white"
              renderValue={(option) => (
                <span className="flex min-w-0 items-center gap-2">
                  {option?.leading}
                  <span className="truncate font-black">
                    {option?.label ?? "Select method"}
                  </span>
                </span>
              )}
              renderOption={(option) => (
                <>
                  {option.leading}
                  <span className="font-bold">{option.label}</span>
                </>
              )}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                Reference No
              </label>
              <Input
                value={referenceNo}
                onChange={(event) => setReferenceNo(event.target.value)}
                disabled={isPending}
                placeholder="Bank ref / receipt no..."
                className="h-14 rounded-2xl bg-white font-bold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                Received At
              </label>
              <Input
                type="datetime-local"
                value={receivedAt}
                onChange={(event) => setReceivedAt(event.target.value)}
                disabled={isPending}
                className="h-14 rounded-2xl bg-white font-bold"
              />
            </div>

            <div className="space-y-2 lg:col-span-2">
              <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                Internal Note
              </label>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                disabled={isPending}
                rows={3}
                placeholder="Optional note about this payment..."
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>

            <label className="inline-flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 lg:col-span-2">
              <input
                type="checkbox"
                checked={markVerified}
                onChange={(event) => setMarkVerified(event.target.checked)}
                disabled={isPending}
                className="size-4 rounded border-slate-300"
              />
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600" />
                Mark payment as verified
              </span>
            </label>

            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60 lg:col-span-2"
            >
              <Banknote className="size-4" />
              {isPending ? "Recording..." : "Record Payment"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
