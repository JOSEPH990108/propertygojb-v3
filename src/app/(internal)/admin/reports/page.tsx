import { InternalComingSoonPage } from "@/components/internal/shell/internal-coming-soon-page";

export default function Page() {
  return (
    <InternalComingSoonPage
      title="Reports & Analytics"
      eyebrow="Admin Module"
      description="View future sales, lead, booking, and agent performance reports."
      icon="reports"
      backHref="/admin"
      backLabel="Back to Admin Dashboard"
      features={[
        "Lead performance overview",
        "Booking conversion reports",
        "Agent activity summary",
        "Project sales analytics",
      ]}
    />
  );
}
