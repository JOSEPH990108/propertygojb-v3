import { notFound } from "next/navigation";

import { PropertyUnitDetailView } from "@/components/internal/properties/property-unit-detail-view";
import { requireRole } from "@/lib/auth/guards";
import { getPropertyUnitDetailById } from "@/lib/properties/inventory";

type AdminPropertyUnitDetailPageProps = {
  params: Promise<{
    unitId: string;
  }>;
};

export default async function AdminPropertyUnitDetailPage({
  params,
}: AdminPropertyUnitDetailPageProps) {
  await requireRole(["ADMIN", "SUPER_ADMIN"], "/admin/properties");

  const { unitId } = await params;
  const detail = await getPropertyUnitDetailById(unitId);

  if (!detail) {
    notFound();
  }

  return <PropertyUnitDetailView portal="admin" detail={detail} />;
}
