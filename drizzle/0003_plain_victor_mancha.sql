ALTER TABLE "projects" ADD COLUMN "published_at" timestamp;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "meta_title" varchar(70);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "meta_description" varchar(180);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "canonical_url" varchar(1000);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "og_title" varchar(100);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "og_description" varchar(300);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "og_image_file_id" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "hero_video_url" varchar(1000);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "highlights_json" jsonb;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "faq_json" jsonb;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "customer_user_id" text;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_og_image_file_id_files_id_fk" FOREIGN KEY ("og_image_file_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_customer_user_id_users_id_fk" FOREIGN KEY ("customer_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "leads_customer_user_idx" ON "leads" USING btree ("customer_user_id");