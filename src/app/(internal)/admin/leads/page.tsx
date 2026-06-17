import { InternalComingSoonPage } from "@/components/internal/shell/internal-coming-soon-page";

export default function Page() {
  return (
    <InternalComingSoonPage
      title="Lead Management"
      eyebrow="CRM Module"
      description="Review incoming leads, assign agents, and prepare WhatsApp routing flow."
      icon="leads"
      backHref="/admin"
      backLabel="Back to Admin Dashboard"
      features={[
        "Lead inbox and lead source tracking",
        "Agent assignment and ownership",
        "Lead status pipeline",
        "WhatsApp routing history",
      ]}
    />
  );
}
