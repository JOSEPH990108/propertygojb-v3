import { notFound } from "next/navigation";

import { BookingDetailView } from "@/components/internal/bookings/booking-detail-view";
import { requireRole } from "@/lib/auth/guards";
import { getBookingDetailById } from "@/lib/bookings/queries";

type AgentBookingDetailPageProps = {
  params: Promise<{
    bookingId: string;
  }>;
};

export default async function AgentBookingDetailPage({
  params,
}: AgentBookingDetailPageProps) {
  const authContext = await requireRole(["AGENT", "SUPER_ADMIN"], "/agent/bookings");
  const currentUser = authContext.user as { id?: unknown };
  const currentUserId = typeof currentUser.id === "string" ? currentUser.id : "";
  const canSeeAll = authContext.roleCode === "SUPER_ADMIN";

  const { bookingId } = await params;
  const detail = await getBookingDetailById(bookingId);

  if (!detail) {
    notFound();
  }

  if (!canSeeAll && detail.booking.assignedAgentUserId !== currentUserId) {
    notFound();
  }

  return (
    <BookingDetailView
      detail={detail}
      backHref="/agent/bookings"
      portalLabel="Agent"
    />
  );
}
