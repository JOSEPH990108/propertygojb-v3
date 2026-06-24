import type { ReactNode } from "react";

import Link from "next/link";

import {
  ArrowLeft,
  Banknote,
  CalendarClock,
  ClipboardList,
  CreditCard,
  History,
  Home,
  UserRound,
  UsersRound,
} from "lucide-react";

import { AppStatusBadge } from "@/components/common/app-status-badge";
import { BookingStatusActionPanel } from "@/components/internal/bookings/booking-status-action-panel";
import {
  formatBookingStatus,
  formatDateTime,
  formatMoney,
  getBookingStatusTone,
  getPaymentStatusTone,
} from "@/lib/bookings/format";
import type { getBookingDetailById } from "@/lib/bookings/queries";

type BookingDetail = NonNullable<
  Awaited<ReturnType<typeof getBookingDetailById>>
>;

type BookingDetailViewProps = {
  detail: BookingDetail;
  backHref: string;
  portalLabel: "Admin" | "Agent";
};

function getProjectName(booking: BookingDetail["booking"]) {
  return (
    booking.projectDisplayName ?? booking.projectName ?? "Project not linked"
  );
}

function getCustomerName(booking: BookingDetail["booking"]) {
  return booking.customerName ?? booking.customerPhone ?? "Customer not linked";
}

function getUnitLabel(unit: BookingDetail["units"][number]) {
  if (!unit.unitNo) {
    return "Unit not linked";
  }

  const meta = [unit.floor ? `Floor ${unit.floor}` : null, unit.stack]
    .filter(Boolean)
    .join(" · ");

  return meta ? `${unit.unitNo} (${meta})` : unit.unitNo;
}

function InfoCard({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-700">
          {icon}
        </div>
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      </div>

      {children}
    </section>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-slate-900">{value}</div>
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
      {children}
    </div>
  );
}

function JsonPreview({ value }: { value: unknown }) {
  if (!value || typeof value !== "object") {
    return null;
  }

  return (
    <pre className="mt-3 max-h-64 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs leading-5 text-slate-100">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export function BookingDetailView({
  detail,
  backHref,
  portalLabel,
}: BookingDetailViewProps) {
  const { booking, units, participants, payments, statusHistory, activities } =
    detail;

  const timestampItems = [
    { label: "Created", value: booking.createdAt },
    { label: "Updated", value: booking.updatedAt },
    { label: "Fee Due", value: booking.bookingFeeDueAt },
    { label: "Submitted", value: booking.submittedAt },
    { label: "Approved", value: booking.approvedAt },
    { label: "Rejected", value: booking.rejectedAt },
    { label: "Expired", value: booking.expiredAt },
    { label: "Cancelled", value: booking.cancelledAt },
  ];

  return (
    <div className="space-y-8 p-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {portalLabel} bookings
        </Link>

        <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <ClipboardList className="h-4 w-4" />
              {portalLabel} Booking Detail
            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              {booking.bookingCode}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Read-only booking overview for customer, project, reserved unit,
              payment records, status history, and internal activity timeline.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <AppStatusBadge tone={getBookingStatusTone(booking.status)}>
              {formatBookingStatus(booking.status)}
            </AppStatusBadge>
            <AppStatusBadge tone="neutral">
              {booking.bookingChannel}
            </AppStatusBadge>
          </div>
        </div>
      </section>

      {portalLabel === "Admin" ? (
        <BookingStatusActionPanel
          bookingId={booking.id}
          currentStatus={booking.status}
        />
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-700">
            <Banknote className="h-5 w-5" />
          </div>
          <div className="mt-4 text-2xl font-semibold text-slate-950">
            {formatMoney(booking.bookingFeeAmount, booking.bookingFeeCurrency)}
          </div>
          <div className="mt-1 text-sm text-slate-500">Booking fee amount</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-700">
            <CreditCard className="h-5 w-5" />
          </div>
          <div className="mt-4 text-2xl font-semibold text-slate-950">
            {formatMoney(
              booking.bookingFeePaidAmount,
              booking.bookingFeeCurrency,
            )}
          </div>
          <div className="mt-1 text-sm text-slate-500">Booking fee paid</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-700">
            <Home className="h-5 w-5" />
          </div>
          <div className="mt-4 text-2xl font-semibold text-slate-950">
            {units.length}
          </div>
          <div className="mt-1 text-sm text-slate-500">Reserved units</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-700">
            <UsersRound className="h-5 w-5" />
          </div>
          <div className="mt-4 text-2xl font-semibold text-slate-950">
            {participants.length}
          </div>
          <div className="mt-1 text-sm text-slate-500">Participants</div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <InfoCard icon={<UserRound className="h-5 w-5" />} title="Customer">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Name" value={getCustomerName(booking)} />
            <Field label="Phone" value={booking.customerPhone ?? "-"} />
            <Field label="Email" value={booking.customerEmail ?? "-"} />
            <Field label="Lead ID" value={booking.leadId} />
          </div>
        </InfoCard>

        <InfoCard icon={<Home className="h-5 w-5" />} title="Project">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Project" value={getProjectName(booking)} />
            <Field label="Slug" value={booking.projectSlug ?? "-"} />
            <Field label="Address" value={booking.projectAddress ?? "-"} />
            <Field label="Project ID" value={booking.projectId} />
          </div>
        </InfoCard>

        <InfoCard icon={<UserRound className="h-5 w-5" />} title="Assigned Agent">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Name" value={booking.agentName ?? "Unassigned"} />
            <Field label="Email" value={booking.agentEmail ?? "-"} />
            <Field
              label="Agent User ID"
              value={booking.assignedAgentUserId ?? "-"}
            />
            <Field
              label="Submitted By"
              value={booking.submittedByUserId ?? "-"}
            />
          </div>
        </InfoCard>

        <InfoCard
          icon={<CalendarClock className="h-5 w-5" />}
          title="Important Dates"
        >
          <div className="grid gap-5 md:grid-cols-2">
            {timestampItems.map((item) => (
              <Field
                key={item.label}
                label={item.label}
                value={formatDateTime(item.value)}
              />
            ))}
          </div>
        </InfoCard>
      </section>

      <InfoCard icon={<Home className="h-5 w-5" />} title="Reserved Unit">
        {units.length > 0 ? (
          <div className="grid gap-4">
            {units.map((unit) => (
              <div
                key={unit.id}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="font-semibold text-slate-950">
                      {getUnitLabel(unit)}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      {unit.streetName ?? "-"} · {unit.facing ?? "Facing -"}
                    </div>
                  </div>

                  <div className="text-left md:text-right">
                    <div className="font-semibold text-slate-950">
                      {formatMoney(unit.finalPrice ?? unit.basePrice)}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Reserved:{" "}
                      {formatMoney(
                        unit.reservedPrice,
                        booking.bookingFeeCurrency,
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 text-sm md:grid-cols-4">
                  <Field
                    label="Built Up"
                    value={unit.builtUpSqft ? `${unit.builtUpSqft} sqft` : "-"}
                  />
                  <Field
                    label="Land Area"
                    value={unit.landAreaSqft ? `${unit.landAreaSqft} sqft` : "-"}
                  />
                  <Field label="Dimension" value={unit.dimensionText ?? "-"} />
                  <Field label="Car Park" value={unit.carparkCount} />
                  <Field
                    label="Reservation Start"
                    value={formatDateTime(unit.reservationStartedAt)}
                  />
                  <Field
                    label="Reservation Expiry"
                    value={formatDateTime(unit.reservationExpiresAt)}
                  />
                  <Field
                    label="Released"
                    value={formatDateTime(unit.releasedAt)}
                  />
                  <Field
                    label="Release Reason"
                    value={unit.releaseReason ?? "-"}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>No reserved unit linked to this booking yet.</EmptyState>
        )}
      </InfoCard>

      <InfoCard icon={<UsersRound className="h-5 w-5" />} title="Participants">
        {participants.length > 0 ? (
          <div className="grid gap-4">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="font-semibold text-slate-950">
                      {participant.fullName}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      {participant.phoneE164 ?? "-"} ·{" "}
                      {participant.email ?? "-"}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <AppStatusBadge tone="neutral">
                      {participant.role}
                    </AppStatusBadge>
                    {participant.isPrimaryContact ? (
                      <AppStatusBadge tone="info">Primary</AppStatusBadge>
                    ) : null}
                    {participant.isSignatory ? (
                      <AppStatusBadge tone="success">Signatory</AppStatusBadge>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 grid gap-4 text-sm md:grid-cols-4">
                  <Field
                    label="Nationality"
                    value={participant.nationality ?? "-"}
                  />
                  <Field
                    label="Identity Type"
                    value={participant.identityType ?? "-"}
                  />
                  <Field
                    label="Identity No"
                    value={participant.identityNoMasked ?? "-"}
                  />
                  <Field
                    label="Order"
                    value={participant.participantOrder}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>No participant record found.</EmptyState>
        )}
      </InfoCard>

      <InfoCard icon={<CreditCard className="h-5 w-5" />} title="Payments">
        {payments.length > 0 ? (
          <div className="grid gap-4">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="font-semibold text-slate-950">
                      {payment.paymentType}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      {payment.paymentMethod ?? "Payment method -"} · Ref:{" "}
                      {payment.referenceNo ?? "-"}
                    </div>
                  </div>

                  <div className="text-left md:text-right">
                    <div className="font-semibold text-slate-950">
                      {formatMoney(payment.amount, payment.currency)}
                    </div>
                    <div className="mt-2">
                      <AppStatusBadge
                        tone={getPaymentStatusTone(payment.paymentStatus)}
                      >
                        {formatBookingStatus(payment.paymentStatus)}
                      </AppStatusBadge>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 text-sm md:grid-cols-4">
                  <Field
                    label="Received"
                    value={formatDateTime(payment.receivedAt)}
                  />
                  <Field
                    label="Verified"
                    value={formatDateTime(payment.verifiedAt)}
                  />
                  <Field label="Proof File" value={payment.proofFileId ?? "-"} />
                  <Field
                    label="Reason"
                    value={
                      payment.rejectionReason ??
                      payment.reasonNote ??
                      payment.reasonCode ??
                      "-"
                    }
                  />
                </div>

                <JsonPreview value={payment.metadata} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>No payment record found.</EmptyState>
        )}
      </InfoCard>

      <section className="grid gap-6 xl:grid-cols-2">
        <InfoCard icon={<History className="h-5 w-5" />} title="Status History">
          {statusHistory.length > 0 ? (
            <div className="space-y-4">
              {statusHistory.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <AppStatusBadge tone={getBookingStatusTone(item.fromStatus)}>
                      {formatBookingStatus(item.fromStatus)}
                    </AppStatusBadge>
                    <span className="text-sm text-slate-400">→</span>
                    <AppStatusBadge tone={getBookingStatusTone(item.toStatus)}>
                      {formatBookingStatus(item.toStatus)}
                    </AppStatusBadge>
                  </div>

                  <div className="mt-3 text-sm text-slate-500">
                    {formatDateTime(item.changedAt)} ·{" "}
                    {item.sourceEventType ?? "Manual"}
                  </div>

                  {item.reasonCode || item.reasonNote ? (
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {item.reasonCode ? `${item.reasonCode}: ` : ""}
                      {item.reasonNote}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>No status history yet.</EmptyState>
          )}
        </InfoCard>

        <InfoCard
          icon={<ClipboardList className="h-5 w-5" />}
          title="Activity Timeline"
        >
          {activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="font-semibold text-slate-950">
                        {activity.title ?? activity.activityType}
                      </div>
                      <div className="mt-1 text-sm text-slate-500">
                        {activity.activityType} ·{" "}
                        {formatDateTime(activity.activityAt)}
                      </div>
                    </div>

                    <AppStatusBadge tone="neutral">
                      {activity.visibilityScope}
                    </AppStatusBadge>
                  </div>

                  {activity.body ? (
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {activity.body}
                    </p>
                  ) : null}

                  <JsonPreview value={activity.metadata} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>No booking activity yet.</EmptyState>
          )}
        </InfoCard>
      </section>

      {booking.rejectionReason || booking.cancellationReason ? (
        <InfoCard
          icon={<ClipboardList className="h-5 w-5" />}
          title="Exception Notes"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="Rejection Reason"
              value={booking.rejectionReason ?? "-"}
            />
            <Field
              label="Cancellation Reason"
              value={booking.cancellationReason ?? "-"}
            />
          </div>
        </InfoCard>
      ) : null}

      <InfoCard icon={<ClipboardList className="h-5 w-5" />} title="Metadata">
        <JsonPreview value={booking.metadata} />
        {!booking.metadata ? (
          <EmptyState>No booking metadata available.</EmptyState>
        ) : null}
      </InfoCard>
    </div>
  );
}
