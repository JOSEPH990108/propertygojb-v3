import Link from "next/link";

import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Search,
} from "lucide-react";

import { CustomerFollowUpCompleteButton } from "@/components/internal/customers/customer-follow-up-complete-button";
import { formatDateTime } from "@/lib/bookings/format";
import type {
  CustomerFollowUpPortal,
  CustomerFollowUps,
} from "@/lib/customers/follow-ups";

type CustomerFollowUpCenterProps = {
  portal: CustomerFollowUpPortal;
  data: CustomerFollowUps;
  search: string;
};

function getCustomerHref(portal: CustomerFollowUpPortal, leadId: string) {
  return `/${portal}/customers/${leadId}`;
}

function getStatusLabel(item: CustomerFollowUps["followUps"][number]) {
  if (item.isCompleted) {
    return "Completed";
  }

  if (item.isOverdue) {
    return "Overdue";
  }

  return "Pending";
}

function getStatusClassName(item: CustomerFollowUps["followUps"][number]) {
  if (item.isCompleted) {
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  }

  if (item.isOverdue) {
    return "border-rose-100 bg-rose-50 text-rose-700";
  }

  return "border-amber-100 bg-amber-50 text-amber-700";
}

export function CustomerFollowUpCenter({
  portal,
  data,
  search,
}: CustomerFollowUpCenterProps) {
  const accent = portal === "admin" ? "blue" : "emerald";

  return (
    <main className="space-y-6 p-6">
      <section
        className={`overflow-hidden rounded-[2rem] border p-6 shadow-sm ${
          accent === "blue"
            ? "border-blue-100 bg-blue-50/70"
            : "border-emerald-100 bg-emerald-50/70"
        }`}
      >
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p
              className={`text-sm font-black uppercase tracking-[0.28em] ${
                accent === "blue" ? "text-blue-600" : "text-emerald-600"
              }`}
            >
              {portal === "admin" ? "Admin Follow-Ups" : "Agent Follow-Ups"}
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              Customer Follow-Up Center
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
              Track customer follow-up tasks created from customer detail pages.
              Complete tasks after WhatsApp, call, viewing, or booking follow-up.
            </p>
          </div>

          <form className="flex w-full max-w-md items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
            <Search className="size-4 text-slate-400" />
            <input
              name="q"
              defaultValue={search}
              placeholder="Search customer, phone, note, agent..."
              className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
            />
          </form>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
            <CalendarClock className="size-4" />
            Total
          </div>
          <p className="mt-3 text-3xl font-black text-slate-950">
            {data.metrics.total}
          </p>
        </div>

        <div className="rounded-[2rem] border border-amber-100 bg-amber-50 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-amber-700">
            <Clock3 className="size-4" />
            Pending
          </div>
          <p className="mt-3 text-3xl font-black text-amber-900">
            {data.metrics.pending}
          </p>
        </div>

        <div className="rounded-[2rem] border border-rose-100 bg-rose-50 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-rose-700">
            <AlertTriangle className="size-4" />
            Overdue
          </div>
          <p className="mt-3 text-3xl font-black text-rose-900">
            {data.metrics.overdue}
          </p>
        </div>

        <div className="rounded-[2rem] border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-700">
            <CheckCircle2 className="size-4" />
            Completed
          </div>
          <p className="mt-3 text-3xl font-black text-emerald-900">
            {data.metrics.completed}
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <h2 className="text-xl font-black tracking-tight text-slate-950">
            Follow-Up Tasks
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Pending tasks are sorted by due date first.
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {data.followUps.length === 0 ? (
            <div className="p-8 text-center text-sm font-semibold text-slate-500">
              No follow-up tasks found.
            </div>
          ) : (
            data.followUps.map((item) => (
              <div
                key={item.activityId}
                className="grid gap-4 p-5 xl:grid-cols-[1.1fr_1fr_auto] xl:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={getCustomerHref(portal, item.leadId)}
                      className="font-black text-slate-950 hover:underline"
                    >
                      {item.customerName}
                    </Link>

                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-black ${getStatusClassName(item)}`}
                    >
                      {getStatusLabel(item)}
                    </span>
                  </div>

                  <p className="mt-2 text-sm font-semibold text-slate-500">
                    {item.customerPhone ?? item.customerEmail ?? "No contact"}
                  </p>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                    {item.body ?? "No note."}
                  </p>
                </div>

                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-black text-slate-500">Due:</span>{" "}
                    <span className="font-bold text-slate-800">
                      {formatDateTime(item.dueAt)}
                    </span>
                  </p>

                  <p>
                    <span className="font-black text-slate-500">Agent:</span>{" "}
                    <span className="font-bold text-slate-800">
                      {item.assigneeName ?? "Unassigned"}
                    </span>
                  </p>

                  {item.completedAt ? (
                    <p>
                      <span className="font-black text-slate-500">
                        Completed:
                      </span>{" "}
                      <span className="font-bold text-slate-800">
                        {formatDateTime(item.completedAt)}
                      </span>
                    </p>
                  ) : null}
                </div>

                <div className="flex justify-start xl:justify-end">
                  {item.isCompleted ? (
                    <span className="inline-flex h-10 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 px-4 text-xs font-black text-emerald-700">
                      Completed
                    </span>
                  ) : (
                    <CustomerFollowUpCompleteButton
                      activityId={item.activityId}
                    />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
