CREATE TABLE "unit_views" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"color" varchar(20),
	"icon" varchar(50),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "unit_views_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "units" ADD COLUMN "view_type_id" text;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_view_type_id_unit_views_id_fk" FOREIGN KEY ("view_type_id") REFERENCES "public"."unit_views"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "units_view_type_idx" ON "units" USING btree ("view_type_id");
--> statement-breakpoint
INSERT INTO "unit_views" ("id", "code", "name")
VALUES
	(gen_random_uuid()::text, 'RIVER_VIEW', 'River View'),
	(gen_random_uuid()::text, 'FACILITIES_VIEW', 'Facilities View'),
	(gen_random_uuid()::text, 'CITY_VIEW', 'City View'),
	(gen_random_uuid()::text, 'SEA_VIEW', 'Sea View'),
	(gen_random_uuid()::text, 'LAKE_GOLF_CITY_VIEW', 'Lake, Golf & City View'),
	(gen_random_uuid()::text, 'SINGAPORE_VIEW', 'Singapore View')
ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
UPDATE "units" AS unit_record
SET
	"view_type_id" = unit_view."id",
	"position_type_id" = NULL,
	"facing" = CASE
		WHEN lower(trim(unit_record."facing")) = lower(trim(unit_view."name")) THEN NULL
		ELSE unit_record."facing"
	END
FROM "unit_positions" AS unit_position
INNER JOIN "unit_views" AS unit_view ON unit_view."code" = unit_position."code"
WHERE unit_record."position_type_id" = unit_position."id"
	AND unit_position."code" IN ('RIVER_VIEW', 'FACILITIES_VIEW', 'CITY_VIEW', 'SEA_VIEW');
--> statement-breakpoint
UPDATE "units" AS unit_record
SET "view_type_id" = unit_view."id"
FROM "projects" AS project, "unit_views" AS unit_view
WHERE unit_record."project_id" = project."id"
	AND project."slug" IN ('sunway-lakehills', 'sunway-lakehills-phase-1')
	AND unit_view."code" = CASE unit_record."facing"
		WHEN 'NORTHWEST' THEN 'LAKE_GOLF_CITY_VIEW'
		WHEN 'SOUTHWEST' THEN 'LAKE_GOLF_CITY_VIEW'
		WHEN 'SOUTHEAST' THEN 'SINGAPORE_VIEW'
		WHEN 'NORTHEAST' THEN 'FACILITIES_VIEW'
		ELSE NULL
	END;
--> statement-breakpoint
DELETE FROM "unit_positions"
WHERE "code" IN ('RIVER_VIEW', 'FACILITIES_VIEW', 'CITY_VIEW', 'SEA_VIEW')
	AND NOT EXISTS (
		SELECT 1
		FROM "units"
		WHERE "units"."position_type_id" = "unit_positions"."id"
	);