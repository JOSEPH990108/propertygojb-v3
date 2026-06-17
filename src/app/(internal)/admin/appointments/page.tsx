import { InternalComingSoonPage } from "@/components/internal/shell/internal-coming-soon-page";

export default function Page() {
  return (
    <InternalComingSoonPage
      title="Appointment Management"
      eyebrow="Sales Module"
      description="Manage viewing appointments, follow-up meetings, and agent schedules."
      icon="appointments"
      backHref="/admin"
      backLabel="Back to Admin Dashboard"
      features={[
        "Viewing appointment list",
        "Agent appointment assignment",
        "Customer follow-up schedule",
        "Calendar-ready structure",
      ]}
    />
  );
}
