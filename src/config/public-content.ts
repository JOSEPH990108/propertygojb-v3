/**
 * Static presentation copy belongs here. Projects, units, pricing, enquiries,
 * and bookings remain database-backed and must not be duplicated as mock data.
 */
export const publicContent = {
  home: {
    benefits: [
      {
        title: "Verified project data",
        description: "Browse projects, layouts, and unit availability sourced from the live catalog.",
        icon: "verified",
      },
      {
        title: "Fast response team",
        description: "WhatsApp-first enquiry flow so buyers get quick answers and brochure details.",
        icon: "support",
      },
      {
        title: "Buyer-focused guidance",
        description: "Help with project matching, price positioning, and location selection.",
        icon: "guidance",
      },
    ],
    journeySteps: [
      "Search projects by location and type.",
      "Open a project detail page for layout and price insight.",
      "Submit the public enquiry form or WhatsApp us.",
      "Receive follow-up on pricing, brochure, and viewing options.",
    ],
  },
  about: {
    principles: [
      { icon: "search", title: "Catalog clarity", text: "Search by location and type, then compare layouts and availability." },
      { icon: "catalog", title: "Connected records", text: "Published project information comes from the shared operational catalog." },
      { icon: "support", title: "Guided follow-up", text: "Every enquiry creates a meaningful CRM activity for the team to action." },
      { icon: "scale", title: "Built to scale", text: "Reusable content, SEO, and account foundations support future markets and campaigns." },
    ],
  },
} as const;
