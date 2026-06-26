import type { ReactNode } from "react";

import Link from "next/link";

import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Home,
  Layers3,
  Ruler,
  Tags,
} from "lucide-react";

import { AppStatusBadge } from "@/components/common/app-status-badge";
import {
  formatBookingStatus,
  formatDateTime,
  formatMoney,
  getBookingStatusTone,
} from "@/lib/bookings/format";
import type { PropertyUnitDetail } from "@/lib/properties/inventory";

type PropertyUnitDetailViewProps = {
  portal: "admin" | "agent";
  detail: NonNullable<PropertyUnitDetail>;
};

function getStatusTone(
  statusCode: string,
): "success" | "danger" | "warning" | "info" | "neutral" {
  switch (statusCode) {
    case "AVAILABLE":
    case "READY":
    case "OPEN":
      return "success";
    case "RESERVED":
    case "BOOKED":
    case "PENDING":
      return "warning";
    case "SOLD":
    case "COMPLETED":
      return "danger";
    default:
      return "neutral";
  }
}

function getProjectName(unit: {
  projectDisplayName: string | null;
  projectName: string;
}) {
  return unit.projectDisplayName ?? unit.projectName;
}

function getCustomerName(booking: {
  customerName: string | null;
  customerPhone: string | null;
}) {
  return booking.customerName ?? booking.customerPhone ?? "Customer";
}

function formatSqft(value: string | number | null) {
  if (!value) {
    return "-";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return String(value);
  }

  return `${number.toLocaleString("en-MY")} sqft`;
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
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-2xl bg-slate-50 text-slate-700">
          {icon}
        </div>
        <h2 className="text-xl font-black tracking-tight text-slate-950">
          {title}
        </h2>
      </div>

      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <div className="mt-1 text-sm font-bold text-slate-800">{value}</div>
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm font-semibold text-slate-500">
      {children}
    </div>
  );
}

export function PropertyUnitDetailView({
  portal,
  detail,
}: PropertyUnitDetailViewProps) {
  const { unit, relatedBookings } = detail;
  const accent = portal === "admin" ? "blue" : "emerald";

  return (
    <div className="space-y-8 p-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <Link
          href={`/${portal}/properties`}
          className={`inline-flex items-center gap-2 text-sm font-black text-slate-500 transition ${
            accent === "blue" ? "hover:text-blue-700" : "hover:text-emerald-700"
          }`}
        >
          <ArrowLeft className="size-4" />
          Back to Properties
        </Link>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p
              className={`text-sm font-black uppercase tracking-[0.28em] ${
                accent === "blue" ? "text-blue-600" : "text-emerald-600"
              }`}
            >
              Unit Detail
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              {unit.unitNo}
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
              {getProjectName(unit)} · {unit.projectSlug}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <AppStatusBadge tone={getStatusTone(unit.bookingStatusCode)}>
                {unit.bookingStatusName}
              </AppStatusBadge>

              <AppStatusBadge tone="neutral">{unit.lotTypeName}</AppStatusBadge>

              {unit.isPublished ? (
                <AppStatusBadge tone="success">Project Published</AppStatusBadge>
              ) : (
                <AppStatusBadge tone="neutral">Project Draft</AppStatusBadge>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/${portal}/projects/${unit.projectId}`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-black text-white shadow-sm transition hover:bg-slate-800"
            >
              Open Project
              <ArrowRight className="size-4" />
            </Link>

            <Link
              href={`/${portal}/bookings`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            >
              Bookings
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <Home className="size-6 text-blue-600" />
            <p className="mt-4 text-lg font-black text-slate-950">
              {unit.unitNo}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">Unit</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <Ruler className="size-6 text-emerald-600" />
            <p className="mt-4 text-lg font-black text-slate-950">
              {formatSqft(unit.builtUpSqft)}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Built-up
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <Tags className="size-6 text-amber-600" />
            <p className="mt-4 text-lg font-black text-slate-950">
              {formatMoney(unit.finalPrice ?? unit.basePrice, "MYR")}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">Price</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <BriefcaseBusiness className="size-6 text-slate-600" />
            <p className="mt-4 text-lg font-black text-slate-950">
              {relatedBookings.length}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Related bookings
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-2">
        <InfoCard icon={<Building2 className="size-5" />} title="Project">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Project" value={getProjectName(unit)} />
            <Field label="Slug" value={unit.projectSlug} />
            <Field label="Declared Units" value={unit.projectTotalUnits} />
            <Field
              label="Published"
              value={unit.isPublished ? "Yes" : "No"}
            />
          </div>
        </InfoCard>

        <InfoCard icon={<Layers3 className="size-5" />} title="Layout">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Layout Code" value={unit.layoutCode ?? "-"} />
            <Field label="Layout Name" value={unit.layoutName ?? "-"} />
            <Field label="Bedrooms" value={unit.bedrooms ?? "-"} />
            <Field label="Bathrooms" value={unit.bathrooms ?? "-"} />
          </div>
        </InfoCard>

        <InfoCard icon={<Ruler className="size-5" />} title="Unit Specs">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Floor" value={unit.floor ?? "-"} />
            <Field label="Stack" value={unit.stack ?? "-"} />
            <Field label="Street" value={unit.streetName ?? "-"} />
            <Field label="Facing" value={unit.facing ?? "-"} />
            <Field label="Built-up" value={formatSqft(unit.builtUpSqft)} />
            <Field label="Land Area" value={formatSqft(unit.landAreaSqft)} />
            <Field label="Dimension" value={unit.dimensionText ?? "-"} />
            <Field label="Carpark" value={unit.carparkCount} />
          </div>
        </InfoCard>

        <InfoCard icon={<Tags className="size-5" />} title="Pricing & Status">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Base Price" value={formatMoney(unit.basePrice, "MYR")} />
            <Field
              label="Final Price"
              value={formatMoney(unit.finalPrice ?? unit.basePrice, "MYR")}
            />
            <Field label="Lot Type" value={unit.lotTypeName} />
            <Field
              label="Booking Status"
              value={
                <AppStatusBadge tone={getStatusTone(unit.bookingStatusCode)}>
                  {unit.bookingStatusName}
                </AppStatusBadge>
              }
            />
            <Field label="Created" value={formatDateTime(unit.createdAt)} />
            <Field label="Updated" value={formatDateTime(unit.updatedAt)} />
          </div>
        </InfoCard>
      </section>

      <InfoCard
        icon={<BriefcaseBusiness className="size-5" />}
        title="Related Bookings"
      >
        {relatedBookings.length > 0 ? (
          <div className="space-y-4">
            {relatedBookings.map((booking) => (
              <Link
                key={booking.bookingId}
                href={`/${portal}/bookings/${booking.bookingId}`}
                className="block rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300 hover:bg-white"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-black text-slate-950">
                      {booking.bookingCode}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {getCustomerName(booking)}
                    </p>
                  </div>

                  <AppStatusBadge tone={getBookingStatusTone(booking.status)}>
                    {formatBookingStatus(booking.status)}
                  </AppStatusBadge>
                </div>

                <div className="mt-4 grid gap-4 text-sm md:grid-cols-3">
                  <Field
                    label="Booking Fee"
                    value={formatMoney(
                      booking.bookingFeeAmount,
                      booking.bookingFeeCurrency,
                    )}
                  />
                  <Field
                    label="Paid"
                    value={formatMoney(
                      booking.bookingFeePaidAmount,
                      booking.bookingFeeCurrency,
                    )}
                  />
                  <Field label="Created" value={formatDateTime(booking.createdAt)} />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState>No booking linked to this unit yet.</EmptyState>
        )}
      </InfoCard>
    </div>
  );
}
