import { and, asc, desc, eq, ilike, isNull, or } from "drizzle-orm";

import { db, schema } from "@/db";

export type CustomerFollowUpPortal = "admin" | "agent";

export type CustomerFollowUpFilter =
  | "all"
  | "pending"
  | "overdue"
  | "completed"
  | "today"
  | "week";

type GetCustomerFollowUpsOptions = {
  portal: CustomerFollowUpPortal;
  currentUserId: string;
  canSeeAll: boolean;
  search?: string;
  filter?: CustomerFollowUpFilter;
};

function getDateWindow(now: Date) {
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(todayStart.getDate() + 1);

  const weekEnd = new Date(todayStart);
  weekEnd.setDate(todayStart.getDate() + 7);

  return {
    todayStart,
    tomorrowStart,
    weekEnd,
  };
}

export async function getCustomerFollowUps({
  portal,
  currentUserId,
  canSeeAll,
  search = "",
  filter = "all",
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
  const { todayStart, tomorrowStart, weekEnd } = getDateWindow(now);

  const allFollowUps = rows.map((row) => {
    const dueAt = row.dueAt ? new Date(row.dueAt) : null;
    const isCompleted = Boolean(row.completedAt);
    const isOverdue = Boolean(dueAt && !isCompleted && dueAt < now);
    const isDueToday = Boolean(
      dueAt && !isCompleted && dueAt >= todayStart && dueAt < tomorrowStart,
    );
    const isDueThisWeek = Boolean(
      dueAt && !isCompleted && dueAt >= todayStart && dueAt < weekEnd,
    );

    return {
      ...row,
      portal,
      customerName:
        row.customerName ?? row.customerPhone ?? row.customerEmail ?? "Customer",
      isCompleted,
      isOverdue,
      isDueToday,
      isDueThisWeek,
    };
  });

  const followUps = allFollowUps.filter((item) => {
    if (filter === "pending") {
      return !item.isCompleted;
    }

    if (filter === "overdue") {
      return item.isOverdue;
    }

    if (filter === "completed") {
      return item.isCompleted;
    }

    if (filter === "today") {
      return item.isDueToday;
    }

    if (filter === "week") {
      return item.isDueThisWeek;
    }

    return true;
  });

  return {
    followUps,
    metrics: {
      total: allFollowUps.length,
      pending: allFollowUps.filter((item) => !item.isCompleted).length,
      overdue: allFollowUps.filter((item) => item.isOverdue).length,
      completed: allFollowUps.filter((item) => item.isCompleted).length,
      today: allFollowUps.filter((item) => item.isDueToday).length,
      week: allFollowUps.filter((item) => item.isDueThisWeek).length,
    },
  };
}

export type CustomerFollowUps = Awaited<ReturnType<typeof getCustomerFollowUps>>;
