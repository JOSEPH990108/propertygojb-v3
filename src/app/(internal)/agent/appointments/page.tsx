import { InternalComingSoonPage } from "@/components/internal/shell/internal-coming-soon-page";

export default function Page() {
  return (
    <InternalComingSoonPage
      title="My Appointments"
      eyebrow="Agent Module"
      description="Manage viewing appointments and customer follow-up schedules."
      icon="appointments"
      backHref="/agent"
      backLabel="Back to Agent Dashboard"
      features={[
        "Upcoming appointment list",
        "Customer viewing schedule",
        "Follow-up reminders",
        "Calendar-ready structure",
      ]}
    />
  );
}
