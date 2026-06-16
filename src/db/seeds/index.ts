// src\db\seeds\index.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../schema";
import { seedLeadSources } from "./10-lead-sources";
import { seedWhatsAppQueues } from "./11-whatsapp-queues";
import { seedWhatsAppRoutingRules } from "./12-whatsapp-routing-rules";
import { seedLeadsInquiriesSample } from "./13-leads-inquiries-sample";
import { seedWhatsAppSampleEvents } from "./14-whatsapp-sample-events";
import { seedDocumentTypes } from "./20-document-types";
import { seedBookingDocumentsSample } from "./21-booking-documents-sample";
import { seedPermissionGroups } from "./30-permission-groups";
import { seedPermissions } from "./31-permissions";
import { seedRolePermissions } from "./32-role-permissions";
import { seedSettingsAndFlags } from "./33-settings-flags";
import { seedGovernanceSampleOptional } from "./34-governance-sample-optional";
import { seedAdminBootstrapDevOnly } from "./04-admin-bootstrap-dev-only";
import { seedCatalogMinimum } from "./02-catalog-minimum";
import { seedCoreLookups } from "./00-core-lookups";
import { seedDemoProjectsOptional } from "./03-demo-projects-optional";
import { seedGeo } from "./01-geo";

export async function runAllSeeds(databaseUrl: string) {
  const client = postgres(databaseUrl, { max: 1 });
  const db = drizzle(client, { schema });

  try {
    await seedCoreLookups(db);
    await seedGeo(db);
    await seedCatalogMinimum(db);
    await seedDemoProjectsOptional(db);
    await seedAdminBootstrapDevOnly(db);

    await seedLeadSources(db);
    await seedWhatsAppQueues(db);
    await seedWhatsAppRoutingRules(db);
    await seedLeadsInquiriesSample(db);
    await seedWhatsAppSampleEvents(db);

    await seedDocumentTypes(db);
    await seedBookingDocumentsSample(db);

    await seedPermissionGroups(db);
    await seedPermissions(db);
    await seedRolePermissions(db);
    await seedSettingsAndFlags(db);
    await seedGovernanceSampleOptional(db);
  } finally {
    await client.end();
  }
}
