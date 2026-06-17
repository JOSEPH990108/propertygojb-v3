import { InternalComingSoonPage } from "@/components/internal/shell/internal-coming-soon-page";

export default function NewProjectPage() {
  return (
    <InternalComingSoonPage
      title="Create Project"
      eyebrow="Project Management"
      description="Create project form will be added in the next slice after the project listing is stable."
      icon="projects"
      backHref="/admin/projects"
      backLabel="Back to Projects"
      features={[
        "Project name and slug setup",
        "Developer, status, tenure, and type selection",
        "Location and address setup",
        "Publish and hot deal controls",
      ]}
    />
  );
}
