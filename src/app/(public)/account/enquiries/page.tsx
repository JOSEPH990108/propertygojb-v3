import Link from "next/link";
import { ArrowUpRight, MessageSquareText } from "lucide-react";

import { formatDateTime } from "@/lib/bookings/format";
import { getCustomerAccountData } from "@/lib/public/account";

export const metadata = { title: "My Enquiries", robots: { index: false, follow: false } };

export default async function CustomerEnquiriesPage() {
  const { inquiries } = await getCustomerAccountData("/account/enquiries");

  return (
    <section className="rounded-2xl border border-border bg-background p-6 shadow-sm sm:p-8">
      <h2 className="text-2xl font-black">Enquiries</h2>
      <p className="mt-2 text-sm text-muted-foreground">Requests submitted through PropertyGoJB.</p>

      <div className="mt-7 space-y-4">
        {inquiries.length ? inquiries.map((inquiry) => (
          <article key={inquiry.id} className="rounded-xl border border-border bg-muted/40 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-black">{inquiry.projectDisplayName ?? inquiry.projectName ?? "Property enquiry"}</p>
                <p className="mt-1 text-xs font-bold text-muted-foreground">{formatDateTime(inquiry.receivedAt)}</p>
              </div>
              {inquiry.projectSlug ? <Link href={`/projects/${inquiry.projectSlug}`} className="inline-flex items-center gap-1 text-sm font-bold text-blue-700">Open project <ArrowUpRight className="size-4" /></Link> : null}
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">{inquiry.messageText ?? "Our team is reviewing this enquiry."}</p>
          </article>
        )) : (
          <div className="rounded-xl border border-dashed border-border p-10 text-center"><MessageSquareText className="mx-auto size-8 text-muted-foreground" /><p className="mt-3 font-black">No enquiries yet</p><Link href="/projects" className="mt-3 inline-block text-sm font-bold text-blue-700">Explore projects</Link></div>
        )}
      </div>
    </section>
  );
}
