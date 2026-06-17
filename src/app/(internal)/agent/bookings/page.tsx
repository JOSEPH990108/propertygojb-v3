import { InternalComingSoonPage } from "@/components/internal/shell/internal-coming-soon-page";

export default function Page() {
  return (
    <InternalComingSoonPage
      title="My Bookings"
      eyebrow="Agent Module"
      description="Track bookings connected to your customers and assigned projects."
      icon="bookings"
      backHref="/agent"
      backLabel="Back to Agent Dashboard"
      features={[
        "Assigned booking list",
        "Customer booking status",
        "Document progress summary",
        "Admin verification updates",
      ]}
    />
  );
}
