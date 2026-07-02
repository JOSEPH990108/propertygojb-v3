import { PropertyInventoryView } from "@/components/internal/properties/property-inventory-view";
import { requireRole } from "@/lib/auth/guards";
import {
  getPropertyInventory,
  getPropertyInventoryFilterOptions,
} from "@/lib/properties/inventory";

type PropertiesPageProps = {
  searchParams?: Promise<{
    q?: string | string[];
    project?: string | string[];
    status?: string | string[];
    lotType?: string | string[];
  }>;
};

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }

  return value?.trim() ?? "";
}

export default async function AdminPropertiesPage({
  searchParams,
}: PropertiesPageProps) {
  await requireRole(["ADMIN", "SUPER_ADMIN"], "/admin/properties");

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const filters = {
    search: getSearchValue(resolvedSearchParams.q),
    projectId: getSearchValue(resolvedSearchParams.project),
    bookingStatusId: getSearchValue(resolvedSearchParams.status),
    lotTypeId: getSearchValue(resolvedSearchParams.lotType),
  };

  const [inventory, filterOptions] = await Promise.all([
    getPropertyInventory(filters),
    getPropertyInventoryFilterOptions(),
  ]);

  return (
    <PropertyInventoryView
      portal="admin"
      inventory={inventory}
      filterOptions={filterOptions}
      filters={filters}
    />
  );
}
