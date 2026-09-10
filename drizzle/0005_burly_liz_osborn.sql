CREATE TABLE "project_availability_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"project_id" text NOT NULL,
	"tower_code" varchar(50) NOT NULL,
	"plan" jsonb NOT NULL,
	CONSTRAINT "project_availability_plans_project_id_tower_code_unique" UNIQUE("project_id","tower_code")
);
--> statement-breakpoint
ALTER TABLE "project_availability_plans" ADD CONSTRAINT "project_availability_plans_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "availability_plans_project_idx" ON "project_availability_plans" USING btree ("project_id");