import Link from "next/link";
import { ArrowRight, CalendarCheck, CalendarClock, MessageSquareText, UserRound } from "lucide-react";

import { AppStatusBadge } from "@/components/common/app-status-badge";
import { formatBookingStatus, formatDateTime, getBookingStatusTone } from "@/lib/bookings/format";
import { getCustomerAccountData } from "@/lib/public/account";

export const metadata = { title: "My Account", robots: { index: false, follow: false } };

export default async function AccountOverviewPage() {
  const { user, lead, inquiries, bookings, viewings } = await getCustomerAccountData("/account");
  const latestBooking = bookings[0];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
        <div className="bg-slate-950 p-6 text-white sm:p-8">
          <p className="text-sm font-bold text-blue-200">Welcome back</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">{user.name}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            Review your enquiries and booking progress in one place. Your latest activity is synchronized with our property team.
          </p>
        </div>

        <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-background p-5">
            <MessageSquareText className="size-5 text-blue-600" />
            <p className="mt-3 text-3xl font-black">{inquiries.length}</p>
            <p className="text-sm text-muted-foreground">Enquiries</p>
          </div>
          <div className="bg-background p-5">
            <CalendarClock className="size-5 text-blue-600" />
            <p className="mt-3 text-3xl font-black">{viewings.length}</p>
            <p className="text-sm text-muted-foreground">Viewings</p>
          </div>
          <div className="bg-background p-5">
            <CalendarCheck className="size-5 text-emerald-600" />
            <p className="mt-3 text-3xl font-black">{bookings.length}</p>
            <p className="text-sm text-muted-foreground">Bookings</p>
          </div>
          <div className="bg-background p-5">
            <UserRound className="size-5 text-amber-600" />
            <p className="mt-3 text-lg font-black">{lead?.currentStatus ?? "No enquiry yet"}</p>
            <p className="text-sm text-muted-foreground">Current journey status</p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-background p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-black">Latest enquiry</h2>
            <Link href="/account/enquiries" className="inline-flex items-center gap-1 text-sm font-bold text-blue-700">
              View all <ArrowRight className="size-4" />
            </Link>
          </div>
          {inquiries[0] ? (
            <div className="mt-5 rounded-xl bg-muted p-4">
              <p className="font-black">{inquiries[0].projectDisplayName ?? inquiries[0].projectName ?? "Property enquiry"}</p>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{inquiries[0].messageText ?? "Our team is reviewing your request."}</p>
              <p className="mt-3 text-xs font-bold text-muted-foreground">{formatDateTime(inquiries[0].receivedAt)}</p>
            </div>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">No enquiries yet. Browse projects to start your shortlist.</p>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-background p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-black">Latest booking</h2>
            <Link href="/account/bookings" className="inline-flex items-center gap-1 text-sm font-bold text-blue-700">
              View all <ArrowRight className="size-4" />
            </Link>
          </div>
          {latestBooking ? (
            <div className="mt-5 rounded-xl bg-muted p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black">{latestBooking.bookingCode}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{latestBooking.projectDisplayName ?? latestBooking.projectName ?? "Project"}</p>
                </div>
                <AppStatusBadge tone={getBookingStatusTone(latestBooking.status)}>{formatBookingStatus(latestBooking.status)}</AppStatusBadge>
              </div>
            </div>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">No bookings yet. Your confirmed reservations will appear here.</p>
          )}
        </section>
      </div>
    </div>
  );
}
