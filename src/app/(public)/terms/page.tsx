import { buildPublicPageMetadata } from "@/lib/public/seo";

export const metadata = buildPublicPageMetadata({
  title: "Terms of Use",
  description: "Terms governing use of the PropertyGoJB website and property information.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <div className="bg-background px-4 py-14 text-foreground sm:px-6 lg:px-8">
      <article className="mx-auto max-w-3xl space-y-8">
        <div><p className="text-sm font-black uppercase tracking-[0.22em] text-blue-600">Legal</p><h1 className="mt-3 text-4xl font-black tracking-tight">Terms of Use</h1><p className="mt-3 text-sm text-muted-foreground">Last updated: 30 July 2026</p></div>
        <section><h2 className="text-xl font-black">Property information</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">Project details, pricing, availability, dimensions, and promotional information may change and must be confirmed with the developer or appointed representative before any purchase decision.</p></section>
        <section><h2 className="text-xl font-black">Enquiries and accounts</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">You agree to provide accurate contact details and to keep account credentials secure. Submitting an enquiry does not create a reservation or purchase agreement.</p></section>
        <section><h2 className="text-xl font-black">Acceptable use</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">Do not misuse the service, attempt unauthorized access, submit fraudulent information, scrape protected data, or interfere with normal website operation.</p></section>
        <section><h2 className="text-xl font-black">Limitation</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">PropertyGoJB provides a discovery and enquiry service. Final contractual terms are governed by the relevant booking, sale, developer, and legal documents.</p></section>
      </article>
    </div>
  );
}