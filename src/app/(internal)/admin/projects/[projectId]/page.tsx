import { InternalComingSoonPage } from "@/components/internal/shell/internal-coming-soon-page";

export default function ProjectDetailPage() {
  return (
    <InternalComingSoonPage
      title="Project Details"
      eyebrow="Project Management"
      description="Project detail and edit view will be connected in the next CRUD slice."
      icon="projects"
      backHref="/admin/projects"
      backLabel="Back to Projects"
      features={[
        "Project overview details",
        "Edit project information",
        "Manage phases, layouts, media, and nearby places",
        "Publish status and public page preview",
      ]}
    />
  );
}
