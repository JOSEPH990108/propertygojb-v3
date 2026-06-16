import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../schema";

type DB = PostgresJsDatabase<typeof schema>;

export async function seedWhatsAppRoutingRules(db: DB) {
  const generalQueue = await db.query.whatsappAgentQueues.findFirst({
    where: (table, { eq }) => eq(table.code, "GENERAL"),
  });

  const whatsappSource = await db.query.leadSources.findFirst({
    where: (table, { eq }) => eq(table.code, "WHATSAPP_INBOUND"),
  });

  if (!generalQueue || !whatsappSource) {
    return;
  }

  await db
    .insert(schema.whatsappAssignmentRules)
    .values({
      name: "Phase1B WhatsApp Default Round Robin",
      priority: 100,
      isActive: true,
      triggerChannel: "WHATSAPP",
      matchSourceId: whatsappSource.id,
      queueId: generalQueue.id,
      fallbackQueueId: generalQueue.id,
      stopProcessingAfterMatch: true,
    })
    .onConflictDoUpdate({
      target: schema.whatsappAssignmentRules.name,
      set: {
        priority: 100,
        isActive: true,
        triggerChannel: "WHATSAPP",
        matchSourceId: whatsappSource.id,
        queueId: generalQueue.id,
        fallbackQueueId: generalQueue.id,
        stopProcessingAfterMatch: true,
      },
    });
}
