import { notFound } from "next/navigation";

import { BookingDetailView } from "@/components/internal/bookings/booking-detail-view";
import { requireRole } from "@/lib/auth/guards";
import { getBookingDetailById } from "@/lib/bookings/queries";

type AdminBookingDetailPageProps = {
  params: Promise<{
    bookingId: string;
  }>;
};

export default async function AdminBookingDetailPage({
  params,
}: AdminBookingDetailPageProps) {
  await requireRole(["ADMIN", "SUPER_ADMIN"], "/admin/bookings");

  const { bookingId } = await params;
  const detail = await getBookingDetailById(bookingId);

  if (!detail) {
    notFound();
  }

  return (
    <BookingDetailView
      detail={detail}
      backHref="/admin/bookings"
      portalLabel="Admin"
    />
  );
}
