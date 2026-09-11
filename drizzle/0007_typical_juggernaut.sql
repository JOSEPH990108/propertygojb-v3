CREATE TABLE "unit_facings" (
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
	CONSTRAINT "unit_facings_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "units" ADD COLUMN "facing_type_id" text;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_facing_type_id_unit_facings_id_fk" FOREIGN KEY ("facing_type_id") REFERENCES "public"."unit_facings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "units_facing_type_idx" ON "units" USING btree ("facing_type_id");
--> statement-breakpoint
INSERT INTO "unit_facings" ("id", "code", "name")
VALUES
	(gen_random_uuid()::text, 'N', 'North'),
	(gen_random_uuid()::text, 'NE', 'North East'),
	(gen_random_uuid()::text, 'E', 'East'),
	(gen_random_uuid()::text, 'SE', 'South East'),
	(gen_random_uuid()::text, 'S', 'South'),
	(gen_random_uuid()::text, 'SW', 'South West'),
	(gen_random_uuid()::text, 'W', 'West'),
	(gen_random_uuid()::text, 'NW', 'North West')
ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
UPDATE "units" AS unit_record
SET
	"facing_type_id" = unit_facing."id",
	"facing" = NULL
FROM "unit_facings" AS unit_facing
WHERE unit_facing."code" = CASE upper(replace(trim(unit_record."facing"), '_', ''))
	WHEN 'N' THEN 'N'
	WHEN 'NORTH' THEN 'N'
	WHEN 'NE' THEN 'NE'
	WHEN 'NORTHEAST' THEN 'NE'
	WHEN 'E' THEN 'E'
	WHEN 'EAST' THEN 'E'
	WHEN 'SE' THEN 'SE'
	WHEN 'SOUTHEAST' THEN 'SE'
	WHEN 'S' THEN 'S'
	WHEN 'SOUTH' THEN 'S'
	WHEN 'SW' THEN 'SW'
	WHEN 'SOUTHWEST' THEN 'SW'
	WHEN 'W' THEN 'W'
	WHEN 'WEST' THEN 'W'
	WHEN 'NW' THEN 'NW'
	WHEN 'NORTHWEST' THEN 'NW'
	ELSE NULL
END;