import { InternalComingSoonPage } from "@/components/internal/shell/internal-coming-soon-page";

export default function Page() {
  return (
    <InternalComingSoonPage
      title="Customer Management"
      eyebrow="Admin Module"
      description="Manage customer profiles and connect them with leads, bookings, and documents."
      icon="customers"
      backHref="/admin"
      backLabel="Back to Admin Dashboard"
      features={[
        "Customer profile list",
        "Customer contact details",
        "Lead and booking history",
        "Document readiness summary",
      ]}
    />
  );
}
