ALTER TABLE "units" ADD COLUMN "block_code" varchar(50);
--> statement-breakpoint
CREATE INDEX "units_project_block_idx" ON "units" USING btree ("project_id","block_code");
