// src\db\schema\lookups.ts
import { pgTable, text, unique, varchar } from "drizzle-orm/pg-core";
import { lookupColumns, slugColumns } from "./base";

export const propertyCategories = pgTable(
  "property_categories",
  lookupColumns(),
  (t) => ({
    uniqCode: unique().on(t.code),
  }),
);

export const propertyTypes = pgTable(
  "property_types",
  {
    ...lookupColumns(),
    slug: varchar("slug", { length: 100 }).notNull(),
    categoryId: text("category_id").references(() => propertyCategories.id),
  },
  (t) => ({
    uniqCode: unique().on(t.code),
    uniqSlug: unique().on(t.slug),
  }),
);

export const tenureTypes = pgTable("tenure_types", lookupColumns(), (t) => ({
  uniqCode: unique().on(t.code),
}));

export const titleTypes = pgTable("title_types", lookupColumns(), (t) => ({
  uniqCode: unique().on(t.code),
}));

export const lotTypes = pgTable("lot_types", lookupColumns(), (t) => ({
  uniqCode: unique().on(t.code),
}));

export const unitPositions = pgTable(
  "unit_positions",
  lookupColumns(),
  (t) => ({
    uniqCode: unique().on(t.code),
  }),
);

export const unitViews = pgTable("unit_views", lookupColumns(), (t) => ({
  uniqCode: unique().on(t.code),
}));

export const unitFacings = pgTable("unit_facings", lookupColumns(), (t) => ({
  uniqCode: unique().on(t.code),
}));

export const projectStatuses = pgTable(
  "project_statuses",
  lookupColumns(),
  (t) => ({
    uniqCode: unique().on(t.code),
  }),
);

export const constructionStatuses = pgTable(
  "construction_statuses",
  lookupColumns(),
  (t) => ({
    uniqCode: unique().on(t.code),
  }),
);

export const bookingStatuses = pgTable(
  "booking_statuses",
  lookupColumns(),
  (t) => ({
    uniqCode: unique().on(t.code),
  }),
);

export const appointmentStatuses = pgTable(
  "appointment_statuses",
  lookupColumns(),
  (t) => ({
    uniqCode: unique().on(t.code),
  }),
);

export const buyerTypes = pgTable("buyer_types", lookupColumns(), (t) => ({
  uniqCode: unique().on(t.code),
}));

export const mediaTypes = pgTable("media_types", lookupColumns(), (t) => ({
  uniqCode: unique().on(t.code),
}));

export const layoutTypes = pgTable("layout_types", lookupColumns(), (t) => ({
  uniqCode: unique().on(t.code),
}));

export const amenities = pgTable("amenities", slugColumns(), (t) => ({
  uniqSlug: unique().on(t.slug),
}));

export const tags = pgTable("tags", slugColumns(), (t) => ({
  uniqSlug: unique().on(t.slug),
}));
