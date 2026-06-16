// src\db\schema\files.ts
import { index, integer, pgTable, text, unique, varchar } from "drizzle-orm/pg-core";
import { baseColumns } from "./base";
import { fileScanStatusEnum, fileVisibilityScopeEnum } from "./enums";
import { user } from "./identity-auth";

export const files = pgTable(
  "files",
  {
    ...baseColumns(),
    provider: varchar("provider", { length: 50 }).notNull(),
    bucket: varchar("bucket", { length: 200 }).notNull(),
    key: varchar("key", { length: 1000 }).notNull(),
    url: varchar("url", { length: 1000 }),
    mimeType: varchar("mime_type", { length: 100 }),
    size: integer("size"),
    checksum: varchar("checksum", { length: 255 }),
    scanStatus: fileScanStatusEnum("scan_status").default("PENDING").notNull(),
    visibilityScope: fileVisibilityScopeEnum("visibility_scope")
      .default("INTERNAL")
      .notNull(),
    uploadedByUserId: text("uploaded_by_user_id").references(() => user.id),
  },
  (t) => ({
    uniqStorageLocator: unique().on(t.provider, t.bucket, t.key),
    storageLookupIdx: index("files_provider_bucket_key_idx").on(
      t.provider,
      t.bucket,
      t.key,
    ),
    scanStatusIdx: index("files_scan_status_idx").on(t.scanStatus),
    visibilityScopeIdx: index("files_visibility_scope_idx").on(
      t.visibilityScope,
    ),
    uploadedByUserIdx: index("files_uploaded_by_user_idx").on(t.uploadedByUserId),
  }),
);
