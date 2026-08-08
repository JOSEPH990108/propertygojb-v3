import { PublicEnquiryPage } from "@/components/public/public-enquiry-page";
import { getPublicProjectCatalog } from "@/lib/public/projects";
import { buildPublicPageMetadata } from "@/lib/public/seo";

export const metadata = buildPublicPageMetadata({
  title: "Book Viewing",
  description:
    "Book a viewing with PropertyGoJB and get matched with a suitable project or unit.",
  path: "/book-viewing",
});

export default async function BookViewingPage() {
  const projects = await getPublicProjectCatalog();

  return (
    <PublicEnquiryPage
      eyebrow="Book a Viewing"
      title="Arrange a site visit at a time that works for you."
      description="We will confirm the project, explain the latest pricing, and coordinate the best viewing slot for you."
      callout="If you are comparing several launches, we can also help you narrow the shortlist before the appointment."
      formTitle="Request a viewing"
      formDescription="Tell us which project you want to view, or leave it open and we will recommend one based on your budget and preferred area."
      projectOptions={projects}
      submitLabel="Request Viewing"
      tone="blue"
      viewingRequest
    />
  );
}
