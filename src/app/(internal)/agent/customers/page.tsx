import { InternalComingSoonPage } from "@/components/internal/shell/internal-coming-soon-page";

export default function Page() {
  return (
    <InternalComingSoonPage
      title="My Customers"
      eyebrow="Agent Module"
      description="View customers connected to your assigned leads and bookings."
      icon="customers"
      backHref="/agent"
      backLabel="Back to Agent Dashboard"
      features={[
        "Customer profile list",
        "Customer contact details",
        "Lead and booking connection",
        "Follow-up readiness",
      ]}
    />
  );
}
