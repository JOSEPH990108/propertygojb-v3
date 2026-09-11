import { CalendarClock, Clock3, MapPin } from "lucide-react";

import { AppStatusBadge } from "@/components/common/app-status-badge";
import {
  formatAppointmentStatus,
  getAppointmentStatusTone,
} from "@/lib/appointments/format";
import { formatDateTime } from "@/lib/bookings/format";
import { getCustomerAccountData } from "@/lib/public/account";

export const metadata = {
  title: "My Viewings",
  robots: { index: false, follow: false },
};

export default async function CustomerViewingsPage() {
  const { viewings } = await getCustomerAccountData("/account/viewings");

  return (
    <section className="rounded-2xl border border-border bg-background p-6 shadow-sm sm:p-8">
      <h2 className="text-2xl font-black">Viewings</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Preferred requests and confirmed property viewing appointments.
      </p>

      <div className="mt-7 space-y-4">
        {viewings.length ? (
          viewings.map((viewing) => (
            <article key={viewing.id} className="rounded-xl border border-border bg-muted/40 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-black">{viewing.projectName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {viewing.status === "REQUESTED"
                      ? "Preferred time awaiting staff confirmation"
                      : "Appointment schedule"}
                  </p>
                </div>
                <AppStatusBadge tone={getAppointmentStatusTone(viewing.status)}>
                  {formatAppointmentStatus(viewing.status)}
                </AppStatusBadge>
              </div>

              <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <p className="flex items-center gap-2 text-muted-foreground"><CalendarClock className="size-4" /> Date and time</p>
                  <p className="mt-1 font-bold">{formatDateTime(viewing.preferredAt)}</p>
                </div>
                <div>
                  <p className="flex items-center gap-2 text-muted-foreground"><Clock3 className="size-4" /> Duration</p>
                  <p className="mt-1 font-bold">{viewing.durationMinutes} minutes</p>
                </div>
                <div>
                  <p className="flex items-center gap-2 text-muted-foreground"><MapPin className="size-4" /> Location</p>
                  <p className="mt-1 font-bold">{viewing.locationText ?? "To be confirmed"}</p>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <CalendarClock className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 font-black">No viewing requests yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Preferred and confirmed viewing times will appear here.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
