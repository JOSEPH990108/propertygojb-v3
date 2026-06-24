import Link from "next/link";

import { and, desc, eq, ilike, inArray, isNull, or } from "drizzle-orm";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  MessageCircle,
  Search,
  UserRound,
  UsersRound,
} from "lucide-react";

import { AppStatusBadge } from "@/components/common/app-status-badge";
import { db, schema } from "@/db";
import { requireRole } from "@/lib/auth/guards";
import {
  formatBookingStatus,
  formatDateTime,
  formatMoney,
  getBookingStatusTone,
} from "@/lib/bookings/format";

type AdminCustomersPageProps = {
  searchParams?: Promise<{
    q?: string | string[];
  }>;
};

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }

  return value?.trim() ?? "";
}

function formatLeadStatus(value: string | null) {
  if (!value) {
    return "Unknown";
  }

  return value
    .split("_")
    .map((part) => part.slice(0, 1) + part.slice(1).toLowerCase())
    .join(" ");
}

function getLeadStatusTone(
  value: string | null,
): "success" | "danger" | "warning" | "info" | "neutral" {
  switch (value) {
    case "NEW":
    case "UNCONTACTED":
      return "warning";
    case "ASSIGNED":
    case "CONTACTED":
    case "QUALIFIED":
    case "APPOINTMENT_SET":
      return "success";
    case "NURTURING":
      return "info";
    case "LOST":
    case "SPAM":
    case "CLOSED":
      return "danger";
    default:
      return "neutral";
  }
}

function getCustomerName(customer: {
  fullName: string | null;
  phoneE164: string | null;
  phoneNormalized: string | null;
}) {
  return (
    customer.fullName ??
    customer.phoneE164 ??
    customer.phoneNormalized ??
    "Customer"
  );
}

export default async function AdminCustomersPage({
  searchParams,
}: AdminCustomersPageProps) {
  await requireRole(["ADMIN", "SUPER_ADMIN"], "/admin/customers");

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const search = getSearchValue(resolvedSearchParams.q);
  const searchPattern = `%${search}%`;

  const customers = await db
    .select({
      id: schema.leads.id,
      fullName: schema.leads.fullName,
      phoneNormalized: schema.leads.primaryPhoneNormalized,
      phoneE164: schema.leads.primaryPhoneE164,
      email: schema.leads.email,
      currentStatus: schema.leads.currentStatus,
      firstInquiryAt: schema.leads.firstInquiryAt,
      lastActivityAt: schema.leads.lastActivityAt,
      createdAt: schema.leads.createdAt,
      sourceName: schema.leadSources.name,
      assigneeName: schema.user.name,
      assigneeEmail: schema.user.email,
    })
    .from(schema.leads)
    .leftJoin(schema.leadSources, eq(schema.leads.sourceId, schema.leadSources.id))
    .leftJoin(schema.user, eq(schema.leads.currentAssigneeUserId, schema.user.id))
    .where(
      and(
        isNull(schema.leads.deletedAt),
        search
          ? or(
              ilike(schema.leads.fullName, searchPattern),
              ilike(schema.leads.primaryPhoneNormalized, searchPattern),
              ilike(schema.leads.primaryPhoneE164, searchPattern),
              ilike(schema.leads.email, searchPattern),
              ilike(schema.user.name, searchPattern),
            )
          : undefined,
      ),
    )
    .orderBy(desc(schema.leads.lastActivityAt), desc(schema.leads.createdAt))
    .limit(100);

  const customerIds = customers.map((customer) => customer.id);

  const bookings =
    customerIds.length > 0
      ? await db
          .select({
            id: schema.bookings.id,
            leadId: schema.bookings.leadId,
            bookingCode: schema.bookings.bookingCode,
            status: schema.bookings.status,
            bookingFeeAmount: schema.bookings.bookingFeeAmount,
            bookingFeeCurrency: schema.bookings.bookingFeeCurrency,
            bookingFeePaidAmount: schema.bookings.bookingFeePaidAmount,
            createdAt: schema.bookings.createdAt,
            projectName: schema.projects.name,
            projectDisplayName: schema.projects.displayName,
          })
          .from(schema.bookings)
          .leftJoin(schema.projects, eq(schema.bookings.projectId, schema.projects.id))
          .where(
            and(
              inArray(schema.bookings.leadId, customerIds),
              isNull(schema.bookings.deletedAt),
            ),
          )
          .orderBy(desc(schema.bookings.createdAt))
      : [];

  const bookingsByLeadId = new Map<string, typeof bookings>();

  for (const booking of bookings) {
    const existing = bookingsByLeadId.get(booking.leadId) ?? [];
    existing.push(booking);
    bookingsByLeadId.set(booking.leadId, existing);
  }

  const customersWithBookings = customers.filter(
    (customer) => (bookingsByLeadId.get(customer.id)?.length ?? 0) > 0,
  ).length;

  const qualifiedCustomers = customers.filter((customer) =>
    ["QUALIFIED", "APPOINTMENT_SET", "CLOSED"].includes(
      customer.currentStatus ?? "",
    ),
  ).length;

  return (
    <div className="space-y-8 p-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-blue-600">
              Admin Customer CRM
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              Customers
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
              View customer profiles derived from leads, booking activity, source,
              assignee, and latest interaction history.
            </p>
          </div>

          <form className="flex w-full max-w-md items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <Search className="size-4 text-slate-400" />
            <input
              name="q"
              defaultValue={search}
              placeholder="Search customer, phone, email, agent..."
              className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
            />
          </form>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <UsersRound className="size-6 text-blue-600" />
            <p className="mt-4 text-3xl font-black text-slate-950">
              {customers.length}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Showing customers
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <BriefcaseBusiness className="size-6 text-emerald-600" />
            <p className="mt-4 text-3xl font-black text-slate-950">
              {customersWithBookings}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              With bookings
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <CalendarClock className="size-6 text-amber-600" />
            <p className="mt-4 text-3xl font-black text-slate-950">
              {qualifiedCustomers}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Qualified / active
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        {customers.map((customer) => {
          const customerBookings = bookingsByLeadId.get(customer.id) ?? [];
          const latestBooking = customerBookings[0];
          const customerName = getCustomerName(customer);

          return (
            <article
              key={customer.id}
              className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-200"
            >
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="grid size-11 place-items-center rounded-2xl bg-slate-50 text-slate-600">
                      <UserRound className="size-5" />
                    </div>

                    <div className="min-w-0">
                      <h2 className="truncate text-xl font-black tracking-tight text-slate-950">
                        {customerName}
                      </h2>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {customer.phoneE164 ??
                          customer.phoneNormalized ??
                          "No phone"}{" "}
                        · {customer.email ?? "No email"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <AppStatusBadge tone={getLeadStatusTone(customer.currentStatus)}>
                      {formatLeadStatus(customer.currentStatus)}
                    </AppStatusBadge>
                    <AppStatusBadge tone="neutral">
                      {customer.sourceName ?? "Website enquiry"}
                    </AppStatusBadge>
                    {latestBooking ? (
                      <AppStatusBadge tone={getBookingStatusTone(latestBooking.status)}>
                        {formatBookingStatus(latestBooking.status)}
                      </AppStatusBadge>
                    ) : null}
                  </div>

                  <div className="mt-5 grid gap-4 text-sm md:grid-cols-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                        Assignee
                      </p>
                      <p className="mt-1 font-bold text-slate-800">
                        {customer.assigneeName ?? "Unassigned"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                        Last Activity
                      </p>
                      <p className="mt-1 font-bold text-slate-800">
                        {formatDateTime(customer.lastActivityAt ?? customer.createdAt)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                        Booking Value
                      </p>
                      <p className="mt-1 font-bold text-slate-800">
                        {latestBooking
                          ? `${formatMoney(
                              latestBooking.bookingFeePaidAmount,
                              latestBooking.bookingFeeCurrency,
                            )} paid / ${formatMoney(
                              latestBooking.bookingFeeAmount,
                              latestBooking.bookingFeeCurrency,
                            )}`
                          : "No booking yet"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  {customer.phoneE164 ?? customer.phoneNormalized ? (
                    <a
                      href={`https://wa.me/${String(
                        customer.phoneE164 ?? customer.phoneNormalized,
                      ).replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700"
                    >
                      <MessageCircle className="size-4" />
                      WhatsApp
                    </a>
                  ) : null}

                  {latestBooking ? (
                    <Link
                      href={`/admin/bookings/${latestBooking.id}`}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                    >
                      Booking
                      <ArrowRight className="size-4" />
                    </Link>
                  ) : null}

                  <Link
                    href={`/admin/leads/${customer.id}`}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                  >
                    Lead
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            </article>
          );
        })}

        {customers.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center text-sm font-semibold text-slate-500">
            No customers found.
          </div>
        ) : null}
      </section>
    </div>
  );
}
