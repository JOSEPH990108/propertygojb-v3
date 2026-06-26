import { notFound } from "next/navigation";

import { PropertyUnitDetailView } from "@/components/internal/properties/property-unit-detail-view";
import { requireRole } from "@/lib/auth/guards";
import { getPropertyUnitDetailById } from "@/lib/properties/inventory";

type AgentPropertyUnitDetailPageProps = {
  params: Promise<{
    unitId: string;
  }>;
};

export default async function AgentPropertyUnitDetailPage({
  params,
}: AgentPropertyUnitDetailPageProps) {
  await requireRole(["AGENT", "SUPER_ADMIN"], "/agent/properties");

  const { unitId } = await params;
  const detail = await getPropertyUnitDetailById(unitId);

  if (!detail) {
    notFound();
  }

  return <PropertyUnitDetailView portal="agent" detail={detail} />;
}
