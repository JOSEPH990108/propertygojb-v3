import { PublicEnquiryPage } from "@/components/public/public-enquiry-page";
import { getPublicProjectCatalog } from "@/lib/public/projects";
import { buildPublicPageMetadata } from "@/lib/public/seo";

export const metadata = buildPublicPageMetadata({
  title: "Contact",
  description:
    "Contact PropertyGoJB for project advice, brochure requests, and availability updates.",
  path: "/contact",
});

export default async function ContactPage() {
  const projects = await getPublicProjectCatalog();

  return (
    <PublicEnquiryPage
      eyebrow="Contact PropertyGoJB"
      title="Talk to our team about the right project fit."
      description="Send us your details and we will follow up with the latest project availability, floor plans, and pricing guidance."
      callout="We help buyers compare launches, shortlist options by budget, and move quickly when a suitable unit becomes available."
      formTitle="Send a general enquiry"
      formDescription="Choose a project if you already have one in mind, or ask us to recommend the best match for your budget and location."
      projectOptions={projects}
    />
  );
}
