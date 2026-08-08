import { buildPublicPageMetadata } from "@/lib/public/seo";

export const metadata = buildPublicPageMetadata({
  title: "Privacy Policy",
  description: "How PropertyGoJB collects, uses, and protects personal information.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <div className="bg-background px-4 py-14 text-foreground sm:px-6 lg:px-8">
      <article className="mx-auto max-w-3xl space-y-8">
        <div><p className="text-sm font-black uppercase tracking-[0.22em] text-blue-600">Legal</p><h1 className="mt-3 text-4xl font-black tracking-tight">Privacy Policy</h1><p className="mt-3 text-sm text-muted-foreground">Last updated: 30 July 2026</p></div>
        <section><h2 className="text-xl font-black">Information we collect</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">We collect details you submit through registration, enquiry, viewing, and booking workflows. With your consent, we also collect campaign attribution and analytics information such as referral source, device events, and advertising click identifiers.</p></section>
        <section><h2 className="text-xl font-black">How we use information</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">Information is used to respond to requests, manage property enquiries and bookings, improve the website, measure marketing performance, prevent abuse, and maintain meaningful operational audit records.</p></section>
        <section><h2 className="text-xl font-black">Cookies and advertising</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">Essential storage supports authentication and preferences. Google, Meta, and TikTok measurement scripts load only when configured and after marketing consent is granted. You can reopen Privacy choices in the footer at any time.</p></section>
        <section><h2 className="text-xl font-black">Retention and access</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">Records are retained only as needed for service delivery, legal obligations, security, and legitimate business operations. Contact PropertyGoJB to request access, correction, or deletion where applicable.</p></section>
      </article>
    </div>
  );
}
