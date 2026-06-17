import { InternalComingSoonPage } from "@/components/internal/shell/internal-coming-soon-page";

export default function Page() {
  return (
    <InternalComingSoonPage
      title="Project Management"
      eyebrow="Admin Module"
      description="Create, edit, and manage property projects for the public showcase and internal sales workflow."
      icon="projects"
      backHref="/admin"
      backLabel="Back to Admin Dashboard"
      features={[
        "Project listing and project status",
        "Project location, gallery, and brochure setup",
        "Project public visibility control",
        "Connect projects to units, leads, and bookings",
      ]}
    />
  );
}
