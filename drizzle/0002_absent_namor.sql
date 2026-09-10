ALTER TYPE "public"."booking_status" ADD VALUE 'LO_OBTAINED' BEFORE 'REJECTED';--> statement-breakpoint
ALTER TYPE "public"."booking_status" ADD VALUE 'LO_SIGNED' BEFORE 'REJECTED';--> statement-breakpoint
ALTER TYPE "public"."booking_status" ADD VALUE 'SPA_SIGNED' BEFORE 'REJECTED';--> statement-breakpoint
ALTER TYPE "public"."booking_status" ADD VALUE 'SOLD' BEFORE 'REJECTED';--> statement-breakpoint
ALTER TABLE "booking_units" ADD COLUMN "lo_obtained_at" timestamp;--> statement-breakpoint
ALTER TABLE "booking_units" ADD COLUMN "lo_sign_due_at" timestamp;--> statement-breakpoint
ALTER TABLE "booking_units" ADD COLUMN "lo_signed_at" timestamp;--> statement-breakpoint
ALTER TABLE "booking_units" ADD COLUMN "spa_signed_at" timestamp;--> statement-breakpoint
ALTER TABLE "booking_units" ADD COLUMN "sold_at" timestamp;--> statement-breakpoint
CREATE INDEX "booking_units_lo_sign_due_idx" ON "booking_units" USING btree ("booking_id","lo_sign_due_at");