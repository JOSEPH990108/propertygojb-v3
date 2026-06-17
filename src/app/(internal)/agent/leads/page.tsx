import { InternalComingSoonPage } from "@/components/internal/shell/internal-coming-soon-page";

export default function Page() {
  return (
    <InternalComingSoonPage
      title="My Leads"
      eyebrow="Agent Module"
      description="View and manage leads assigned to your agent account."
      icon="leads"
      backHref="/agent"
      backLabel="Back to Agent Dashboard"
      features={[
        "Assigned lead list",
        "Lead contact details",
        "Lead follow-up status",
        "WhatsApp action tracking",
      ]}
    />
  );
}
