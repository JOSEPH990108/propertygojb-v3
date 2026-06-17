import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../schema";

type DB = PostgresJsDatabase<typeof schema>;

const defaultBusinessHours = {
  timezone: "Asia/Kuala_Lumpur",
  days: ["MON", "TUE", "WED", "THU", "FRI"],
  start: "09:00",
  end: "18:00",
};

export async function seedLeadSources(db: DB) {
  const baselineSources = [
    {
      code: "WEB_FORM",
      name: "Web Form",
      channel: "WEB_FORM",
      assignmentSlaMinutes: 30,
      firstResponseSlaMinutes: 240,
      businessHoursJson: defaultBusinessHours,
    },
    {
      code: "WHATSAPP_INBOUND",
      name: "WhatsApp Inbound",
      channel: "WHATSAPP_INBOUND",
      assignmentSlaMinutes: 5,
      firstResponseSlaMinutes: 15,
      businessHoursJson: defaultBusinessHours,
    },
    {
      code: "CALL_IN",
      name: "Call In",
      channel: "CALL_IN",
      assignmentSlaMinutes: 30,
      firstResponseSlaMinutes: 60,
      businessHoursJson: defaultBusinessHours,
    },
    {
      code: "WALK_IN",
      name: "Walk In",
      channel: "WALK_IN",
      assignmentSlaMinutes: 30,
      firstResponseSlaMinutes: 60,
      businessHoursJson: defaultBusinessHours,
    },
  ] as const;

  for (const source of baselineSources) {
    await db
      .insert(schema.leadSources)
      .values(source)
      .onConflictDoUpdate({
        target: schema.leadSources.code,
        set: {
          name: source.name,
          channel: source.channel,
          assignmentSlaMinutes: source.assignmentSlaMinutes,
          firstResponseSlaMinutes: source.firstResponseSlaMinutes,
          businessHoursJson: source.businessHoursJson,
          isActive: true,
        },
      });
  }
}
