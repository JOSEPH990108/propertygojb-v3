// src\db\schema\geo.ts
import { index, pgTable, text, unique, varchar } from "drizzle-orm/pg-core";
import { baseColumns } from "./base";

export const states = pgTable("states", {
  ...baseColumns(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  country: varchar("country", { length: 100 }).default("Malaysia").notNull(),
});

export const regions = pgTable(
  "regions",
  {
    ...baseColumns(),
    stateId: text("state_id")
      .references(() => states.id)
      .notNull(),
    name: varchar("name", { length: 150 }).notNull(),
    slug: varchar("slug", { length: 150 }).notNull(),
  },
  (t) => ({
    uniqRegionPerState: unique().on(t.stateId, t.slug),
    stateSlugIdx: index("regions_state_slug_idx").on(t.stateId, t.slug),
  }),
);

export const areas = pgTable(
  "areas",
  {
    ...baseColumns(),
    regionId: text("region_id")
      .references(() => regions.id)
      .notNull(),
    name: varchar("name", { length: 150 }).notNull(),
    slug: varchar("slug", { length: 150 }).notNull(),
  },
  (t) => ({
    uniqAreaPerRegion: unique().on(t.regionId, t.slug),
    regionSlugIdx: index("areas_region_slug_idx").on(t.regionId, t.slug),
  }),
);
