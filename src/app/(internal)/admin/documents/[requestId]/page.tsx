import { notFound } from "next/navigation";

import { DocumentDetailView } from "@/components/internal/documents/document-detail-view";
import { requireRole } from "@/lib/auth/guards";
import { getDocumentRequestDetailById } from "@/lib/documents/queries";

type AdminDocumentDetailPageProps = {
  params: Promise<{
    requestId: string;
  }>;
};

export default async function AdminDocumentDetailPage({
  params,
}: AdminDocumentDetailPageProps) {
  await requireRole(["ADMIN", "SUPER_ADMIN"], "/admin/documents");

  const { requestId } = await params;
  const detail = await getDocumentRequestDetailById(requestId);

  if (!detail) {
    notFound();
  }

  return <DocumentDetailView detail={detail} portal="admin" />;
}
