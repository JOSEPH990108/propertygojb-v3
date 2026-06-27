import { and, asc, desc, eq, ilike, isNull, or } from "drizzle-orm";

import { db, schema } from "@/db";

export type CustomerFollowUpPortal = "admin" | "agent";

type GetCustomerFollowUpsOptions = {
  portal: CustomerFollowUpPortal;
  currentUserId: string;
  canSeeAll: boolean;
  search?: string;
};

export async function getCustomerFollowUps({
  portal,
  currentUserId,
  canSeeAll,
  search = "",
}: GetCustomerFollowUpsOptions) {
  const searchValue = search.trim();
  const searchPattern = `%${searchValue}%`;

  const rows = await db
    .select({
      activityId: schema.leadActivities.id,
      leadId: schema.leadActivities.leadId,
      title: schema.leadActivities.title,
      body: schema.leadActivities.body,
      dueAt: schema.leadActivities.dueAt,
      completedAt: schema.leadActivities.completedAt,
      createdAt: schema.leadActivities.createdAt,

      customerName: schema.leads.fullName,
      customerPhone: schema.leads.primaryPhoneE164,
      customerEmail: schema.leads.email,
      currentAssigneeUserId: schema.leads.currentAssigneeUserId,

      assigneeName: schema.user.name,
      assigneeEmail: schema.user.email,
    })
    .from(schema.leadActivities)
    .innerJoin(schema.leads, eq(schema.leadActivities.leadId, schema.leads.id))
    .leftJoin(schema.user, eq(schema.leads.currentAssigneeUserId, schema.user.id))
    .where(
      and(
        eq(schema.leadActivities.activityType, "CUSTOMER_FOLLOW_UP"),
        isNull(schema.leads.deletedAt),
        canSeeAll ? undefined : eq(schema.leads.currentAssigneeUserId, currentUserId),
        searchValue
          ? or(
              ilike(schema.leads.fullName, searchPattern),
              ilike(schema.leads.primaryPhoneE164, searchPattern),
              ilike(schema.leads.email, searchPattern),
              ilike(schema.leadActivities.body, searchPattern),
              ilike(schema.user.name, searchPattern),
            )
          : undefined,
      ),
    )
    .orderBy(
      asc(schema.leadActivities.completedAt),
      asc(schema.leadActivities.dueAt),
      desc(schema.leadActivities.createdAt),
    )
    .limit(500);

  const now = new Date();

  const followUps = rows.map((row) => {
    const dueAt = row.dueAt ? new Date(row.dueAt) : null;
    const isCompleted = Boolean(row.completedAt);
    const isOverdue = Boolean(dueAt && !isCompleted && dueAt < now);

    return {
      ...row,
      portal,
      customerName:
        row.customerName ?? row.customerPhone ?? row.customerEmail ?? "Customer",
      isCompleted,
      isOverdue,
    };
  });

  return {
    followUps,
    metrics: {
      total: followUps.length,
      pending: followUps.filter((item) => !item.isCompleted).length,
      overdue: followUps.filter((item) => item.isOverdue).length,
      completed: followUps.filter((item) => item.isCompleted).length,
    },
  };
}

export type CustomerFollowUps = Awaited<ReturnType<typeof getCustomerFollowUps>>;
