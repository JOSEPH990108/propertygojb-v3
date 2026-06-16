import { randomUUID } from "crypto";
import {
  boolean,
  integer,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const baseColumns = () => ({
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdateFn(() => new Date()),
  deletedAt: timestamp("deleted_at"),
});

export const lookupColumns = () => ({
  ...baseColumns(),
  code: varchar("code", { length: 50 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 20 }),
  icon: varchar("icon", { length: 50 }),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const slugColumns = () => ({
  ...baseColumns(),
  slug: varchar("slug", { length: 200 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
});
