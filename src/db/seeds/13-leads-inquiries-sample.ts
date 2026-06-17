import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../schema";

type DB = PostgresJsDatabase<typeof schema>;

export async function seedLeadsInquiriesSample(db: DB) {
  if (process.env.APP_ENV !== "development") {
    return;
  }

  if (process.env.ENABLE_PHASE1B_SAMPLE_LEADS !== "true") {
    return;
  }

  const webSource = await db.query.leadSources.findFirst({
    where: (table, { eq }) => eq(table.code, "WEB_FORM"),
  });

  if (!webSource) {
    return;
  }

  await db
    .insert(schema.leads)
    .values({
      sourceId: webSource.id,
      fullName: "Sample Lead Alpha",
      primaryPhoneE164: "+601111000001",
      primaryPhoneNormalized: "601111000001",
      email: "sample.alpha@example.test",
      currentStatus: "NEW",
      firstInquiryAt: new Date(),
      metadata: {
        purpose: "phase1b_sample",
      },
    })
    .onConflictDoNothing();

  const sampleLead = await db.query.leads.findFirst({
    where: (table, { eq }) => eq(table.primaryPhoneNormalized, "601111000001"),
  });

  if (!sampleLead) {
    return;
  }

  await db
    .insert(schema.inquiries)
    .values({
      leadId: sampleLead.id,
      sourceId: webSource.id,
      channel: "WEB_FORM",
      externalReference: "phase1b-sample-inquiry-web-001",
      requesterName: "Sample Lead Alpha",
      requesterPhoneE164: "+601111000001",
      requesterPhoneNormalized: "601111000001",
      requesterEmail: "sample.alpha@example.test",
      messageText: "Sample inquiry for Phase 1B testing.",
      receivedAt: new Date(),
      payload: {
        kind: "sample",
      },
    })
    .onConflictDoUpdate({
      target: schema.inquiries.externalReference,
      set: {
        leadId: sampleLead.id,
        sourceId: webSource.id,
        channel: "WEB_FORM",
        messageText: "Sample inquiry for Phase 1B testing.",
      },
    });
}
