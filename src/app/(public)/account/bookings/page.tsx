import Link from "next/link";
import { ArrowUpRight, CalendarCheck } from "lucide-react";

import { AppStatusBadge } from "@/components/common/app-status-badge";
import { formatBookingStatus, formatDateTime, formatMoney, getBookingStatusTone } from "@/lib/bookings/format";
import { getCustomerAccountData } from "@/lib/public/account";

export const metadata = { title: "My Bookings", robots: { index: false, follow: false } };

export default async function CustomerBookingsPage() {
  const { bookings } = await getCustomerAccountData("/account/bookings");

  return (
    <section className="rounded-2xl border border-border bg-background p-6 shadow-sm sm:p-8">
      <h2 className="text-2xl font-black">Bookings</h2>
      <p className="mt-2 text-sm text-muted-foreground">Reservation and payment progress for your selected properties.</p>

      <div className="mt-7 space-y-4">
        {bookings.length ? bookings.map((booking) => (
          <article key={booking.id} className="rounded-xl border border-border bg-muted/40 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div><p className="font-black">{booking.bookingCode}</p><p className="mt-1 text-sm text-muted-foreground">{booking.projectDisplayName ?? booking.projectName ?? "Project"}{booking.unitNo ? ` · Unit ${booking.unitNo}` : ""}</p></div>
              <AppStatusBadge tone={getBookingStatusTone(booking.status)}>{formatBookingStatus(booking.status)}</AppStatusBadge>
            </div>
            <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
              <div><p className="text-muted-foreground">Created</p><p className="mt-1 font-bold">{formatDateTime(booking.submittedAt ?? booking.createdAt)}</p></div>
              <div><p className="text-muted-foreground">Booking fee</p><p className="mt-1 font-bold">{formatMoney(booking.bookingFeeAmount, booking.bookingFeeCurrency)}</p></div>
              <div><p className="text-muted-foreground">Paid</p><p className="mt-1 font-bold">{formatMoney(booking.bookingFeePaidAmount, booking.bookingFeeCurrency)}</p></div>
            </div>
            {booking.projectSlug ? <Link href={`/projects/${booking.projectSlug}`} className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-blue-700">View project <ArrowUpRight className="size-4" /></Link> : null}
          </article>
        )) : (
          <div className="rounded-xl border border-dashed border-border p-10 text-center"><CalendarCheck className="mx-auto size-8 text-muted-foreground" /><p className="mt-3 font-black">No bookings yet</p><p className="mt-2 text-sm text-muted-foreground">Confirmed reservations will appear here.</p></div>
        )}
      </div>
    </section>
  );
}
