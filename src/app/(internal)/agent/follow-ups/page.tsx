import { CustomerFollowUpCenter } from "@/components/internal/customers/customer-follow-up-center";
import { requireRole } from "@/lib/auth/guards";
import {
  getCustomerFollowUps,
  type CustomerFollowUpFilter,
} from "@/lib/customers/follow-ups";

type FollowUpsPageProps = {
  searchParams?: Promise<{
    q?: string | string[];
    filter?: string | string[];
  }>;
};

const followUpFilters: CustomerFollowUpFilter[] = [
  "all",
  "pending",
  "overdue",
  "completed",
  "today",
  "week",
];

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }

  return value?.trim() ?? "";
}

function getFilterValue(value: string | string[] | undefined): CustomerFollowUpFilter {
  const rawValue = getSearchValue(value);

  if (followUpFilters.includes(rawValue as CustomerFollowUpFilter)) {
    return rawValue as CustomerFollowUpFilter;
  }

  return "all";
}

export default async function AgentFollowUpsPage({
  searchParams,
}: FollowUpsPageProps) {
  const authContext = await requireRole(["AGENT", "SUPER_ADMIN"], "/agent/follow-ups");

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const search = getSearchValue(resolvedSearchParams.q);
  const filter = getFilterValue(resolvedSearchParams.filter);

  const currentUser = authContext.user as { id?: unknown };
  const currentUserId = typeof currentUser.id === "string" ? currentUser.id : "";
  const canSeeAll =
    authContext.roleCode === "SUPER_ADMIN" || authContext.roleCode === "ADMIN";

  const data = await getCustomerFollowUps({
    portal: "agent",
    currentUserId,
    canSeeAll,
    search,
    filter,
  });

  return (
    <CustomerFollowUpCenter
      portal="agent"
      data={data}
      search={search}
      filter={filter}
    />
  );
}
