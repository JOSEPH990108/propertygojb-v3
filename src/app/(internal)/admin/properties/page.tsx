import { InternalComingSoonPage } from "@/components/internal/shell/internal-coming-soon-page";

export default function Page() {
  return (
    <InternalComingSoonPage
      title="Property Inventory"
      eyebrow="Admin Module"
      description="Manage property units, availability, pricing, and inventory status."
      icon="properties"
      backHref="/admin"
      backLabel="Back to Admin Dashboard"
      features={[
        "Unit number and property type",
        "Price, size, and availability status",
        "Booking availability control",
        "Connect units to project pages",
      ]}
    />
  );
}
