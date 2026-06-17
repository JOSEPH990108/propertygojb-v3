import { InternalComingSoonPage } from "@/components/internal/shell/internal-coming-soon-page";

export default function Page() {
  return (
    <InternalComingSoonPage
      title="Customer Documents"
      eyebrow="Agent Module"
      description="Monitor uploaded customer documents and booking document readiness."
      icon="documents"
      backHref="/agent"
      backLabel="Back to Agent Dashboard"
      features={[
        "Document checklist",
        "Upload status tracking",
        "Missing document alerts",
        "Admin review status",
      ]}
    />
  );
}
