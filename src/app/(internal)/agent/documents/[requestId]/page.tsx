import { notFound } from "next/navigation";

import { DocumentDetailView } from "@/components/internal/documents/document-detail-view";
import { requireRole } from "@/lib/auth/guards";
import { getDocumentRequestDetailById } from "@/lib/documents/queries";

type AgentDocumentDetailPageProps = {
  params: Promise<{
    requestId: string;
  }>;
};

export default async function AgentDocumentDetailPage({
  params,
}: AgentDocumentDetailPageProps) {
  const authContext = await requireRole(["AGENT", "SUPER_ADMIN"], "/agent/documents");
  const currentUser = authContext.user as { id?: unknown };
  const currentUserId = typeof currentUser.id === "string" ? currentUser.id : "";
  const canSeeAll = authContext.roleCode === "SUPER_ADMIN";

  const { requestId } = await params;
  const detail = await getDocumentRequestDetailById(requestId);

  if (!detail) {
    notFound();
  }

  if (!canSeeAll && detail.request.assignedAgentUserId !== currentUserId) {
    notFound();
  }

  return <DocumentDetailView detail={detail} portal="agent" />;
}
