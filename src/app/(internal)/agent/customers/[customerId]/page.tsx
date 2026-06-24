import Link from "next/link";
import { notFound } from "next/navigation";

import { and, desc, eq, isNull } from "drizzle-orm";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarClock,
  ClipboardList,
  Mail,
  MessageCircle,
  Phone,
  UserRound,
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

type AgentCustomerDetailPageProps = {
  params: Promise<{
    customerId: string;
  }>;
};

type ActivityMetadata = {
  appointmentStatus?: string;
  projectName?: string;
  locationText?: string | null;
  durationMinutes?: number;
  note?: string | null;
  bookingId?: string;
  bookingCode?: string;
  unitNo?: string | null;
};

function getMetadata(value: unknown): ActivityMetadata {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as ActivityMetadata;
}

function formatStatus(value: string | null) {
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

function getWhatsappHref(phoneNumber: string, customerName: string) {
  const digits = phoneNumber.replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  return `https://wa.me/${digits}?text=${encodeURIComponent(
    `Hi ${customerName}, following up on your property enquiry. May I assist you further?`,
  )}`;
}

export default async function AgentCustomerDetailPage({
  params,
}: AgentCustomerDetailPageProps) {
  const authContext = await requireRole(["AGENT", "SUPER_ADMIN"], "/agent/customers");

  const { customerId } = await params;

  const customerRows = await db
    .select({
      id: schema.leads.id,
      fullName: schema.leads.fullName,
      phoneNormalized: schema.leads.primaryPhoneNormalized,
      phoneE164: schema.leads.primaryPhoneE164,
      email: schema.leads.email,
      currentStatus: schema.leads.currentStatus,
      currentAssigneeUserId: schema.leads.currentAssigneeUserId,
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
    .where(and(eq(schema.leads.id, customerId), isNull(schema.leads.deletedAt)))
    .limit(1);

  const customer = customerRows[0];

  if (!customer) {
    notFound();
  }

  const currentUser = authContext.user as { id?: unknown };
  const currentUserId = typeof currentUser.id === "string" ? currentUser.id : "";
  const canSeeAll = authContext.roleCode === "SUPER_ADMIN";

  if (!canSeeAll && customer.currentAssigneeUserId !== currentUserId) {
    notFound();
  }

  const [inquiries, bookings, activities] = await Promise.all([
    db
      .select({
        id: schema.inquiries.id,
        messageText: schema.inquiries.messageText,
        receivedAt: schema.inquiries.receivedAt,
        requesterName: schema.inquiries.requesterName,
        requesterPhoneNormalized: schema.inquiries.requesterPhoneNormalized,
        requesterEmail: schema.inquiries.requesterEmail,
        projectId: schema.inquiries.projectId,
        projectName: schema.projects.name,
        projectDisplayName: schema.projects.displayName,
        projectSlug: schema.projects.slug,
      })
      .from(schema.inquiries)
      .leftJoin(schema.projects, eq(schema.inquiries.projectId, schema.projects.id))
      .where(and(eq(schema.inquiries.leadId, customerId), isNull(schema.inquiries.deletedAt)))
      .orderBy(desc(schema.inquiries.receivedAt)),

    db
      .select({
        id: schema.bookings.id,
        bookingCode: schema.bookings.bookingCode,
        status: schema.bookings.status,
        bookingFeeAmount: schema.bookings.bookingFeeAmount,
        bookingFeeCurrency: schema.bookings.bookingFeeCurrency,
        bookingFeePaidAmount: schema.bookings.bookingFeePaidAmount,
        submittedAt: schema.bookings.submittedAt,
        approvedAt: schema.bookings.approvedAt,
        createdAt: schema.bookings.createdAt,
        projectName: schema.projects.name,
        projectDisplayName: schema.projects.displayName,
        unitNo: schema.units.unitNo,
      })
      .from(schema.bookings)
      .leftJoin(schema.projects, eq(schema.bookings.projectId, schema.projects.id))
      .leftJoin(
        schema.bookingUnits,
        eq(schema.bookings.id, schema.bookingUnits.bookingId),
      )
      .leftJoin(schema.units, eq(schema.bookingUnits.unitId, schema.units.id))
      .where(and(eq(schema.bookings.leadId, customerId), isNull(schema.bookings.deletedAt)))
      .orderBy(desc(schema.bookings.createdAt)),

    db
      .select({
        id: schema.leadActivities.id,
        activityType: schema.leadActivities.activityType,
        title: schema.leadActivities.title,
        body: schema.leadActivities.body,
        dueAt: schema.leadActivities.dueAt,
        completedAt: schema.leadActivities.completedAt,
        createdAt: schema.leadActivities.createdAt,
        metadata: schema.leadActivities.metadata,
      })
      .from(schema.leadActivities)
      .where(and(eq(schema.leadActivities.leadId, customerId), isNull(schema.leadActivities.deletedAt)))
      .orderBy(desc(schema.leadActivities.createdAt))
      .limit(80),
  ]);

  const customerName = getCustomerName(customer);
  const phone = customer.phoneE164 ?? customer.phoneNormalized ?? "";
  const whatsappHref = getWhatsappHref(phone, customerName);

  const appointmentCount = activities.filter(
    (activity) => activity.activityType === "VIEWING_APPOINTMENT",
  ).length;

  const latestBooking = bookings[0];

  return (
    <div className="space-y-8 p-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <Link
          href="/agent/customers"
          className="inline-flex items-center gap-2 text-sm font-black text-slate-500 transition hover:text-emerald-700"
        >
          <ArrowLeft className="size-4" />
          Back to My Customers
        </Link>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-emerald-600">
              My Customer Detail
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              {customerName}
            </h1>

            <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-slate-500">
              <span className="inline-flex items-center gap-2">
                <Phone className="size-4" />
                {phone || "-"}
              </span>
              <span className="inline-flex items-center gap-2">
                <Mail className="size-4" />
                {customer.email || "-"}
              </span>
              <span className="inline-flex items-center gap-2">
                <CalendarClock className="size-4" />
                {formatDateTime(customer.firstInquiryAt ?? customer.createdAt)}
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <AppStatusBadge tone={getLeadStatusTone(customer.currentStatus)}>
                {formatStatus(customer.currentStatus)}
              </AppStatusBadge>
              <AppStatusBadge tone="neutral">
                {customer.sourceName ?? "Website enquiry"}
              </AppStatusBadge>
              {latestBooking ? (
                <AppStatusBadge tone={getBookingStatusTone(latestBooking.status)}>
                  Latest booking: {formatBookingStatus(latestBooking.status)}
                </AppStatusBadge>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700"
              >
                <MessageCircle className="size-4" />
                WhatsApp
              </a>
            ) : null}

            <Link
              href={`/agent/leads/${customer.id}`}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            >
              Open Lead
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <UserRound className="size-6 text-emerald-600" />
            <p className="mt-4 text-3xl font-black text-slate-950">
              {inquiries.length}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Enquiries
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <BriefcaseBusiness className="size-6 text-emerald-600" />
            <p className="mt-4 text-3xl font-black text-slate-950">
              {bookings.length}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Bookings
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <CalendarClock className="size-6 text-amber-600" />
            <p className="mt-4 text-3xl font-black text-slate-950">
              {appointmentCount}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Appointments
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <ClipboardList className="size-6 text-slate-600" />
            <p className="mt-4 text-lg font-black text-slate-950">
              {customer.assigneeName ?? "Unassigned"}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Current Assignee
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1fr_0.9fr]">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-slate-950">
            Booking History
          </h2>

          <div className="mt-5 space-y-4">
            {bookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/agent/bookings/${booking.id}`}
                className="block rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-emerald-200 hover:bg-white"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-black text-slate-950">
                      {booking.bookingCode}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {booking.projectDisplayName ??
                        booking.projectName ??
                        "Project"}{" "}
                      · Unit {booking.unitNo ?? "-"}
                    </p>
                  </div>

                  <AppStatusBadge tone={getBookingStatusTone(booking.status)}>
                    {formatBookingStatus(booking.status)}
                  </AppStatusBadge>
                </div>

                <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      Fee
                    </p>
                    <p className="mt-1 font-bold text-slate-800">
                      {formatMoney(
                        booking.bookingFeeAmount,
                        booking.bookingFeeCurrency,
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      Paid
                    </p>
                    <p className="mt-1 font-bold text-slate-800">
                      {formatMoney(
                        booking.bookingFeePaidAmount,
                        booking.bookingFeeCurrency,
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      Created
                    </p>
                    <p className="mt-1 font-bold text-slate-800">
                      {formatDateTime(booking.submittedAt ?? booking.createdAt)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}

            {bookings.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm font-semibold text-slate-500">
                No booking history yet.
              </p>
            ) : null}
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-slate-950">
            Inquiry History
          </h2>

          <div className="mt-5 space-y-4">
            {inquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <p className="font-black text-slate-950">
                  {inquiry.projectDisplayName ??
                    inquiry.projectName ??
                    "Project enquiry"}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {formatDateTime(inquiry.receivedAt)}
                </p>
                {inquiry.messageText ? (
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {inquiry.messageText}
                  </p>
                ) : null}
              </div>
            ))}

            {inquiries.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm font-semibold text-slate-500">
                No inquiry history found.
              </p>
            ) : null}
          </div>
        </section>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black tracking-tight text-slate-950">
          Activity Timeline
        </h2>

        <div className="mt-5 space-y-4">
          {activities.map((activity) => {
            const metadata = getMetadata(activity.metadata);

            return (
              <div
                key={activity.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-black text-slate-950">
                      {activity.title ?? formatStatus(activity.activityType)}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {activity.activityType} · {formatDateTime(activity.createdAt)}
                    </p>
                  </div>

                  {metadata.appointmentStatus ? (
                    <AppStatusBadge tone="neutral">
                      {formatStatus(metadata.appointmentStatus)}
                    </AppStatusBadge>
                  ) : null}
                </div>

                {activity.body ? (
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {activity.body}
                  </p>
                ) : null}

                {metadata.projectName || metadata.unitNo ? (
                  <p className="mt-3 text-xs font-bold text-slate-500">
                    {metadata.projectName ?? ""}{" "}
                    {metadata.unitNo ? `· Unit ${metadata.unitNo}` : ""}
                  </p>
                ) : null}
              </div>
            );
          })}

          {activities.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm font-semibold text-slate-500">
              No activity yet.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
