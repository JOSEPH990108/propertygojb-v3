import { InternalComingSoonPage } from "@/components/internal/shell/internal-coming-soon-page";

export default function Page() {
  return (
    <InternalComingSoonPage
      title="System Settings"
      eyebrow="Admin Module"
      description="Configure platform settings, lookup values, and internal preferences."
      icon="settings"
      backHref="/admin"
      backLabel="Back to Admin Dashboard"
      features={[
        "System configuration",
        "Lookup value management",
        "Portal preference settings",
        "Future integration settings",
      ]}
    />
  );
}
