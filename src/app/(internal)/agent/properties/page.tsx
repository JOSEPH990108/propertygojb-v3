import { PropertyInventoryView } from "@/components/internal/properties/property-inventory-view";
import { requireRole } from "@/lib/auth/guards";
import { getPropertyInventory } from "@/lib/properties/inventory";

type AgentPropertiesPageProps = {
  searchParams?: Promise<{
    q?: string | string[];
  }>;
};

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }

  return value?.trim() ?? "";
}

export default async function AgentPropertiesPage({
  searchParams,
}: AgentPropertiesPageProps) {
  await requireRole(["AGENT", "SUPER_ADMIN"], "/agent/properties");

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const search = getSearchValue(resolvedSearchParams.q);

  const inventory = await getPropertyInventory({ search });

  return (
    <PropertyInventoryView
      portal="agent"
      inventory={inventory}
      search={search}
    />
  );
}
