import { InternalComingSoonPage } from "@/components/internal/shell/internal-coming-soon-page";

export default function Page() {
  return (
    <InternalComingSoonPage
      title="Booking Management"
      eyebrow="Sales Module"
      description="Track customer booking submissions, documents, and admin verification."
      icon="bookings"
      backHref="/admin"
      backLabel="Back to Admin Dashboard"
      features={[
        "Booking request list",
        "Customer document status",
        "Admin approval workflow",
        "Booking pipeline tracking",
      ]}
    />
  );
}
