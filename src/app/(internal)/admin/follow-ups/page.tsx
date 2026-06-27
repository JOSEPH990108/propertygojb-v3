import { CustomerFollowUpCenter } from "@/components/internal/customers/customer-follow-up-center";
import { requireRole } from "@/lib/auth/guards";
import { getCustomerFollowUps } from "@/lib/customers/follow-ups";

type FollowUpsPageProps = {
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

export default async function AdminFollowUpsPage({
  searchParams,
}: FollowUpsPageProps) {
  const authContext = await requireRole(["ADMIN", "SUPER_ADMIN"], "/admin/follow-ups");

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const search = getSearchValue(resolvedSearchParams.q);

  const currentUser = authContext.user as { id?: unknown };
  const currentUserId = typeof currentUser.id === "string" ? currentUser.id : "";
  const canSeeAll =
    authContext.roleCode === "SUPER_ADMIN" || authContext.roleCode === "ADMIN";

  const data = await getCustomerFollowUps({
    portal: "admin",
    currentUserId,
    canSeeAll,
    search,
  });

  return <CustomerFollowUpCenter portal="admin" data={data} search={search} />;
}
