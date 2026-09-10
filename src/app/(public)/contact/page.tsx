import { ContactEnquiryExperience } from "@/components/public/contact/contact-enquiry-experience";
import { getPublicAreaNames } from "@/lib/public/areas";
import { getPublicProjectCatalog } from "@/lib/public/projects";
import { buildPublicPageMetadata } from "@/lib/public/seo";

export const metadata = buildPublicPageMetadata({
  title: "Contact",
  description:
    "Contact PropertyGoJB for project advice, brochure requests, and availability updates.",
  path: "/contact",
});

export default async function ContactPage() {
  const [projects, areaOptions] = await Promise.all([
    getPublicProjectCatalog(),
    getPublicAreaNames(),
  ]);

  const projectOptions = projects.map((project) => ({
    id: project.id,
    name: project.name,
    displayName: project.displayName,
  }));

  return (
    <ContactEnquiryExperience
      eyebrow="A Considered Beginning"
      title="Let's find the right property for you."
      description="Already have a project in mind? Great. Not sure yet? Tell us what you're looking for and we'll help you narrow it down."
      projects={projectOptions}
      areaOptions={areaOptions}
    />
  );
}
