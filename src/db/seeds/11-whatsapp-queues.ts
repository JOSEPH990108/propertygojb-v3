import { inArray } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../schema";

type DB = PostgresJsDatabase<typeof schema>;

export async function seedWhatsAppQueues(db: DB) {
  const queueSeeds = [
    {
      code: "GENERAL",
      name: "General Queue",
      description: "Default queue for inbound leads",
      assignmentStrategy: "ROUND_ROBIN" as const,
    },
    {
      code: "PROJECT_FIXED_OWNER",
      name: "Project Fixed Owner Queue",
      description: "Queue for project-specific direct ownership",
      assignmentStrategy: "FIXED_OWNER" as const,
    },
  ];

  for (const queueSeed of queueSeeds) {
    await db
      .insert(schema.whatsappAgentQueues)
      .values(queueSeed)
      .onConflictDoUpdate({
        target: schema.whatsappAgentQueues.code,
        set: {
          name: queueSeed.name,
          description: queueSeed.description,
          assignmentStrategy: queueSeed.assignmentStrategy,
          isActive: true,
        },
      });
  }

  const generalQueue = await db.query.whatsappAgentQueues.findFirst({
    where: (table, { eq }) => eq(table.code, "GENERAL"),
  });

  if (!generalQueue) {
    return;
  }

  const routingRoles = await db.query.roles.findMany({
    where: (table, { inArray: inArrayOp }) =>
      inArrayOp(table.code, ["SUPER_ADMIN", "ADMIN", "AGENT"]),
  });

  const routingRoleIds = routingRoles.map((role) => role.id);

  if (routingRoleIds.length === 0) {
    return;
  }

  const routingUsers = await db.query.user.findMany({
    where: (table) => inArray(table.roleId, routingRoleIds),
  });

  for (const [idx, routingUser] of routingUsers.entries()) {
    await db
      .insert(schema.whatsappAgentQueueMembers)
      .values({
        queueId: generalQueue.id,
        userId: routingUser.id,
        isActive: true,
        weight: 1,
        sortOrder: idx,
      })
      .onConflictDoUpdate({
        target: [
          schema.whatsappAgentQueueMembers.queueId,
          schema.whatsappAgentQueueMembers.userId,
        ],
        set: {
          isActive: true,
          sortOrder: idx,
        },
      });
  }
}
