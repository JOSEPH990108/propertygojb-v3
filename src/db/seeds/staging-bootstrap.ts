import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "../schema";
import { seedCoreLookups } from "./00-core-lookups";
import { seedGeo } from "./01-geo";
import { seedLeadSources } from "./10-lead-sources";
import { seedDocumentTypes } from "./20-document-types";
import { seedPermissionGroups } from "./30-permission-groups";
import { seedPermissions } from "./31-permissions";
import { seedRolePermissions } from "./32-role-permissions";
import { seedSettingsAndFlags } from "./33-settings-flags";

export async function runStagingBootstrap(databaseUrl: string) {
  const client = postgres(databaseUrl, { max: 1 });
  const db = drizzle(client, { schema });

  try {
    await seedCoreLookups(db);
    await seedGeo(db);
    await seedLeadSources(db);
    await seedDocumentTypes(db);
    await seedPermissionGroups(db);
    await seedPermissions(db);
    await seedRolePermissions(db);
    await seedSettingsAndFlags(db);
  } finally {
    await client.end();
  }
}