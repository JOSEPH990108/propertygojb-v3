// src\db\schema\inventory.ts
import {
  date,
  decimal,
  index,
  integer,
  pgTable,
  text,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { baseColumns } from "./base";
import {
  projectLayouts,
  projectPhases,
  projects,
  projectTowers,
} from "./catalog";
import {
  bookingStatuses,
  buyerTypes,
  lotTypes,
  unitPositions,
} from "./lookups";

export const units = pgTable(
  "units",
  {
    ...baseColumns(),
    projectId: text("project_id")
      .references(() => projects.id)
      .notNull(),
    layoutId: text("layout_id").references(() => projectLayouts.id),
    towerId: text("tower_id").references(() => projectTowers.id),
    phaseId: text("phase_id").references(() => projectPhases.id),

    unitNo: varchar("unit_no", { length: 50 }).notNull(),
    floor: integer("floor"),
    stack: varchar("stack", { length: 10 }),
    streetName: varchar("street_name", { length: 100 }),
    displaySequence: integer("display_sequence").default(0).notNull(),

    builtUpSqft: decimal("built_up_sqft", { precision: 10, scale: 2 }),
    landAreaSqft: decimal("land_area_sqft", { precision: 10, scale: 2 }),
    dimensionText: varchar("dimension_text", { length: 50 }),
    facing: varchar("facing", { length: 100 }),
    positionTypeId: text("position_type_id").references(() => unitPositions.id),

    carparkCount: integer("carpark_count").default(1).notNull(),
    carparkLotNo: varchar("carpark_lot_no", { length: 100 }),
    carparkType: varchar("carpark_type", { length: 50 }),

    lotTypeId: text("lot_type_id")
      .references(() => lotTypes.id)
      .notNull(),
    bookingStatusId: text("booking_status_id")
      .references(() => bookingStatuses.id)
      .notNull(),

    basePrice: decimal("base_price", { precision: 15, scale: 2 }).notNull(),
    finalPrice: decimal("final_price", { precision: 15, scale: 2 }),
  },
  (t) => ({
    uniqProjectUnitNo: unique().on(t.projectId, t.unitNo),
    unitsProjectIdx: index("units_project_idx").on(t.projectId),
    unitsTowerIdx: index("units_tower_idx").on(t.towerId),
    unitsLayoutIdx: index("units_layout_idx").on(t.layoutId),
    unitsBookingStatusIdx: index("units_booking_status_idx").on(
      t.bookingStatusId,
    ),
  }),
);

export const pricingSnapshots = pgTable(
  "pricing_snapshots",
  {
    ...baseColumns(),
    projectId: text("project_id")
      .references(() => projects.id)
      .notNull(),
    phaseId: text("phase_id").references(() => projectPhases.id),
    towerId: text("tower_id").references(() => projectTowers.id),
    layoutId: text("layout_id").references(() => projectLayouts.id),
    buyerTypeId: text("buyer_type_id").references(() => buyerTypes.id),
    viewKey: varchar("view_key", { length: 100 }),

    spaPriceMin: decimal("spa_price_min", { precision: 15, scale: 2 }),
    spaPriceMax: decimal("spa_price_max", { precision: 15, scale: 2 }),
    nettPriceMin: decimal("nett_price_min", { precision: 15, scale: 2 }),
    nettPriceMax: decimal("nett_price_max", { precision: 15, scale: 2 }),
    rebatePercentTotal: decimal("rebate_percent_total", { precision: 6, scale: 2 }),
    snapshotDate: date("snapshot_date").notNull(),
    sourceNote: text("source_note"),
  },
  (t) => ({
    pricingSnapshotsProjectIdx: index("pricing_snapshots_project_idx").on(
      t.projectId,
    ),
    pricingSnapshotsSnapshotDateIdx: index(
      "pricing_snapshots_snapshot_date_idx",
    ).on(t.snapshotDate),
    pricingSnapshotsQueryIdx: index("pricing_snapshots_query_idx").on(
      t.projectId,
      t.phaseId,
      t.towerId,
      t.layoutId,
      t.buyerTypeId,
      t.snapshotDate,
    ),
  }),
);
