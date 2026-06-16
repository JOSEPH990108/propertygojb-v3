CREATE TYPE "public"."booking_status" AS ENUM('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'PAYMENT_PENDING', 'PAYMENT_VERIFIED', 'DOCS_PENDING', 'DOCS_VERIFIED', 'APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."document_request_status" AS ENUM('REQUESTED', 'SUBMITTED', 'VERIFIED', 'REJECTED', 'WAIVED');--> statement-breakpoint
CREATE TYPE "public"."document_submission_status" AS ENUM('SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'REPLACED');--> statement-breakpoint
CREATE TYPE "public"."document_verification_status" AS ENUM('PENDING', 'VERIFIED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."file_scan_status" AS ENUM('PENDING', 'CLEAN', 'INFECTED', 'ERROR');--> statement-breakpoint
CREATE TYPE "public"."file_visibility_scope" AS ENUM('PUBLIC', 'INTERNAL', 'RESTRICTED');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('NEW', 'UNCONTACTED', 'ASSIGNED', 'CONTACTED', 'QUALIFIED', 'NURTURING', 'APPOINTMENT_SET', 'LOST', 'SPAM', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."otp_channel" AS ENUM('SMS', 'WHATSAPP', 'DEV_CONSOLE');--> statement-breakpoint
CREATE TYPE "public"."otp_purpose" AS ENUM('LOGIN', 'REGISTER');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'RECEIVED', 'VERIFIED', 'REJECTED', 'REFUNDED');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
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
	CONSTRAINT "roles_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"phone_number" text,
	"phone_number_verified" boolean DEFAULT false NOT NULL,
	"nationality" varchar(100),
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"role_id" text,
	"ren_number" varchar(50),
	"agency_name" varchar(100),
	"referral_code" varchar(50),
	"referred_by_user_id" text,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_number_unique" UNIQUE("phone_number"),
	CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "amenities" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"slug" varchar(200) NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "amenities_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "appointment_statuses" (
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
	CONSTRAINT "appointment_statuses_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "booking_statuses" (
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
	CONSTRAINT "booking_statuses_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "buyer_types" (
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
	CONSTRAINT "buyer_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "construction_statuses" (
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
	CONSTRAINT "construction_statuses_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "layout_types" (
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
	CONSTRAINT "layout_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "lot_types" (
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
	CONSTRAINT "lot_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "media_types" (
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
	CONSTRAINT "media_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "project_statuses" (
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
	CONSTRAINT "project_statuses_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "property_categories" (
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
	CONSTRAINT "property_categories_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "property_types" (
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
	"slug" varchar(100) NOT NULL,
	"category_id" text,
	CONSTRAINT "property_types_code_unique" UNIQUE("code"),
	CONSTRAINT "property_types_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"slug" varchar(200) NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "tenure_types" (
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
	CONSTRAINT "tenure_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "title_types" (
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
	CONSTRAINT "title_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "unit_positions" (
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
	CONSTRAINT "unit_positions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "areas" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"region_id" text NOT NULL,
	"name" varchar(150) NOT NULL,
	"slug" varchar(150) NOT NULL,
	CONSTRAINT "areas_region_id_slug_unique" UNIQUE("region_id","slug")
);
--> statement-breakpoint
CREATE TABLE "regions" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"state_id" text NOT NULL,
	"name" varchar(150) NOT NULL,
	"slug" varchar(150) NOT NULL,
	CONSTRAINT "regions_state_id_slug_unique" UNIQUE("state_id","slug")
);
--> statement-breakpoint
CREATE TABLE "states" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"country" varchar(100) DEFAULT 'Malaysia' NOT NULL,
	CONSTRAINT "states_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"provider" varchar(50) NOT NULL,
	"bucket" varchar(200) NOT NULL,
	"key" varchar(1000) NOT NULL,
	"url" varchar(1000),
	"mime_type" varchar(100),
	"size" integer,
	"checksum" varchar(255),
	"scan_status" "file_scan_status" DEFAULT 'PENDING' NOT NULL,
	"visibility_scope" "file_visibility_scope" DEFAULT 'INTERNAL' NOT NULL,
	"uploaded_by_user_id" text,
	CONSTRAINT "files_provider_bucket_key_unique" UNIQUE("provider","bucket","key")
);
--> statement-breakpoint
CREATE TABLE "developers" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"slug" varchar(200) NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"legal_name" varchar(200),
	"country_code" varchar(10),
	"is_featured" boolean DEFAULT false NOT NULL,
	"logo_file_id" text,
	CONSTRAINT "developers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "project_amenities" (
	"project_id" text NOT NULL,
	"amenity_id" text NOT NULL,
	CONSTRAINT "project_amenities_project_id_amenity_id_pk" PRIMARY KEY("project_id","amenity_id")
);
--> statement-breakpoint
CREATE TABLE "project_layouts" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"project_id" text NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(100),
	"layout_type_id" text,
	"built_up_sqft" numeric(10, 2) NOT NULL,
	"bedrooms" integer NOT NULL,
	"bathrooms" integer NOT NULL,
	"study_rooms" integer DEFAULT 0 NOT NULL,
	"has_balcony" boolean DEFAULT false NOT NULL,
	"has_yard" boolean DEFAULT false NOT NULL,
	"is_dual_key" boolean DEFAULT false NOT NULL,
	"ceiling_height_m" numeric(4, 2),
	"furnishing_status" varchar(20) DEFAULT 'UNFURNISHED' NOT NULL,
	"floor_plan_file_id" text,
	"virtual_tour_url" varchar(1000),
	CONSTRAINT "project_layouts_project_id_code_unique" UNIQUE("project_id","code")
);
--> statement-breakpoint
CREATE TABLE "project_media" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"project_id" text NOT NULL,
	"file_id" text NOT NULL,
	"media_type_id" text,
	"caption" varchar(300),
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_nearby_places" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"project_id" text NOT NULL,
	"name" varchar(200) NOT NULL,
	"category" varchar(50) NOT NULL,
	"distance_km" numeric(6, 2),
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_phases" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"project_id" text NOT NULL,
	"name" varchar(100) NOT NULL,
	"phase_code" varchar(50),
	"completion_date" date,
	"construction_status_id" text,
	CONSTRAINT "project_phases_project_id_name_unique" UNIQUE("project_id","name"),
	CONSTRAINT "project_phases_project_id_phase_code_unique" UNIQUE("project_id","phase_code")
);
--> statement-breakpoint
CREATE TABLE "project_tags" (
	"project_id" text NOT NULL,
	"tag_id" text NOT NULL,
	CONSTRAINT "project_tags_project_id_tag_id_pk" PRIMARY KEY("project_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "project_towers" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"project_id" text NOT NULL,
	"phase_id" text,
	"tower_number" varchar(50),
	"name" varchar(100),
	"floor_count" integer,
	"floor_min" integer,
	"floor_max" integer,
	CONSTRAINT "project_towers_project_id_tower_number_unique" UNIQUE("project_id","tower_number")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"slug" varchar(200) NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_name" varchar(200),
	"legal_name" varchar(200),
	"developer_id" text NOT NULL,
	"property_category_id" text,
	"property_type_id" text,
	"project_status_id" text,
	"tenure_type_id" text NOT NULL,
	"title_type_id" text,
	"tenure_expiry_date" date,
	"region_id" text,
	"area_id" text,
	"address" text,
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"land_area_acres" numeric(10, 4),
	"booking_fee" numeric(10, 2) DEFAULT '1000.00',
	"booking_fee_bumi" numeric(10, 2),
	"maintenance_fee_per_sqft" numeric(10, 2),
	"sinking_fund_per_sqft" numeric(10, 2),
	"is_foreigner_eligible" boolean DEFAULT true NOT NULL,
	"foreigner_eligibility" jsonb,
	"is_gated_community" boolean DEFAULT false NOT NULL,
	"green_certification" varchar(100),
	"total_units" integer DEFAULT 0 NOT NULL,
	"launch_year" integer,
	"featured_file_id" text,
	"is_hot_deal" boolean DEFAULT false NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	CONSTRAINT "projects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "pricing_snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"project_id" text NOT NULL,
	"phase_id" text,
	"tower_id" text,
	"layout_id" text,
	"buyer_type_id" text,
	"view_key" varchar(100),
	"spa_price_min" numeric(15, 2),
	"spa_price_max" numeric(15, 2),
	"nett_price_min" numeric(15, 2),
	"nett_price_max" numeric(15, 2),
	"rebate_percent_total" numeric(6, 2),
	"snapshot_date" date NOT NULL,
	"source_note" text
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"project_id" text NOT NULL,
	"layout_id" text,
	"tower_id" text,
	"phase_id" text,
	"unit_no" varchar(50) NOT NULL,
	"floor" integer,
	"stack" varchar(10),
	"street_name" varchar(100),
	"display_sequence" integer DEFAULT 0 NOT NULL,
	"built_up_sqft" numeric(10, 2),
	"land_area_sqft" numeric(10, 2),
	"dimension_text" varchar(50),
	"facing" varchar(100),
	"position_type_id" text,
	"carpark_count" integer DEFAULT 1 NOT NULL,
	"carpark_lot_no" varchar(100),
	"carpark_type" varchar(50),
	"lot_type_id" text NOT NULL,
	"booking_status_id" text NOT NULL,
	"base_price" numeric(15, 2) NOT NULL,
	"final_price" numeric(15, 2),
	CONSTRAINT "units_project_id_unit_no_unique" UNIQUE("project_id","unit_no")
);
--> statement-breakpoint
CREATE TABLE "inquiries" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"lead_id" text NOT NULL,
	"source_id" text NOT NULL,
	"channel" varchar(30) NOT NULL,
	"external_reference" varchar(150),
	"requester_name" varchar(150),
	"requester_phone_e164" varchar(30),
	"requester_phone_normalized" varchar(30),
	"requester_email" varchar(255),
	"project_id" text,
	"phase_id" text,
	"tower_id" text,
	"layout_id" text,
	"unit_id" text,
	"message_text" text,
	"payload" jsonb,
	"received_at" timestamp NOT NULL,
	CONSTRAINT "inquiries_external_reference_unique" UNIQUE("external_reference")
);
--> statement-breakpoint
CREATE TABLE "lead_activities" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"lead_id" text NOT NULL,
	"assignment_id" text,
	"actor_user_id" text,
	"activity_type" varchar(40) NOT NULL,
	"title" varchar(150),
	"body" text,
	"due_at" timestamp,
	"completed_at" timestamp,
	"visibility_scope" varchar(20) DEFAULT 'INTERNAL' NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "lead_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"lead_id" text NOT NULL,
	"from_user_id" text,
	"to_user_id" text,
	"queue_id" text,
	"assigned_by_user_id" text,
	"assignment_type" varchar(30) NOT NULL,
	"reason_code" varchar(50),
	"reason_note" text,
	"rule_id" text,
	"effective_from" timestamp DEFAULT now() NOT NULL,
	"effective_to" timestamp,
	"is_current" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"channel" varchar(30) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"assignment_sla_minutes" integer,
	"first_response_sla_minutes" integer,
	"business_hours_json" jsonb,
	CONSTRAINT "lead_sources_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "lead_status_history" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"lead_id" text NOT NULL,
	"from_status" "lead_status",
	"to_status" "lead_status" NOT NULL,
	"changed_by_user_id" text,
	"changed_at" timestamp DEFAULT now() NOT NULL,
	"reason_code" varchar(50),
	"reason_note" text,
	"source_event_type" varchar(40)
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"source_id" text NOT NULL,
	"full_name" varchar(150),
	"primary_phone_e164" varchar(30) NOT NULL,
	"primary_phone_normalized" varchar(30) NOT NULL,
	"email" varchar(255),
	"preferred_language" varchar(20),
	"nationality" varchar(100),
	"desired_property_category_id" text,
	"desired_property_type_id" text,
	"preferred_region_id" text,
	"preferred_area_id" text,
	"current_status" "lead_status" DEFAULT 'NEW' NOT NULL,
	"current_assignee_user_id" text,
	"current_queue_id" text,
	"first_inquiry_at" timestamp,
	"last_activity_at" timestamp,
	"first_assigned_at" timestamp,
	"first_responded_at" timestamp,
	"assignment_due_at" timestamp,
	"first_response_due_at" timestamp,
	"closed_at" timestamp,
	"closed_reason" varchar(120),
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "whatsapp_agent_queue_members" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"queue_id" text NOT NULL,
	"user_id" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"weight" integer DEFAULT 1 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"max_active_leads" integer,
	"last_assigned_at" timestamp,
	CONSTRAINT "whatsapp_agent_queue_members_queue_id_user_id_unique" UNIQUE("queue_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "whatsapp_agent_queues" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"region_id" text,
	"area_id" text,
	"project_id" text,
	"assignment_strategy" varchar(30) DEFAULT 'ROUND_ROBIN' NOT NULL,
	"max_queue_depth" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "whatsapp_agent_queues_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "whatsapp_assignment_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"name" varchar(120) NOT NULL,
	"priority" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"trigger_channel" varchar(30) DEFAULT 'WHATSAPP' NOT NULL,
	"match_source_id" text,
	"match_region_id" text,
	"match_area_id" text,
	"match_project_id" text,
	"match_language" varchar(20),
	"queue_id" text,
	"assign_to_user_id" text,
	"fallback_queue_id" text,
	"effective_from" timestamp,
	"effective_to" timestamp,
	"stop_processing_after_match" boolean DEFAULT true NOT NULL,
	CONSTRAINT "whatsapp_assignment_rules_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "whatsapp_conversations" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"lead_id" text,
	"inquiry_id" text,
	"provider" varchar(30) NOT NULL,
	"channel_account_id" varchar(100),
	"provider_conversation_id" varchar(120),
	"customer_phone_e164" varchar(30) NOT NULL,
	"customer_phone_normalized" varchar(30) NOT NULL,
	"customer_display_name" varchar(150),
	"queue_id" text,
	"owner_user_id" text,
	"is_open" boolean DEFAULT true NOT NULL,
	"first_inbound_at" timestamp,
	"last_message_at" timestamp,
	"last_inbound_at" timestamp,
	"last_outbound_at" timestamp,
	"closed_at" timestamp,
	"closed_reason" varchar(120)
);
--> statement-breakpoint
CREATE TABLE "whatsapp_delivery_events" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"message_id" text NOT NULL,
	"provider" varchar(30) NOT NULL,
	"provider_event_id" varchar(150),
	"event_type" varchar(40) NOT NULL,
	"event_status" varchar(40) NOT NULL,
	"occurred_at_provider" timestamp,
	"received_at_server" timestamp NOT NULL,
	"error_code" varchar(80),
	"error_detail" text,
	"payload" jsonb
);
--> statement-breakpoint
CREATE TABLE "whatsapp_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"conversation_id" text NOT NULL,
	"lead_id" text,
	"direction" varchar(20) NOT NULL,
	"message_type" varchar(30) NOT NULL,
	"provider_message_id" varchar(120),
	"provider_reply_to_message_id" varchar(120),
	"text_body" text,
	"media_file_id" text,
	"media_mime_type" varchar(100),
	"media_size_bytes" integer,
	"sent_at_provider" timestamp,
	"delivered_at_provider" timestamp,
	"read_at_provider" timestamp,
	"failed_at_provider" timestamp,
	"failure_code" varchar(80),
	"failure_reason" text,
	"payload" jsonb,
	CONSTRAINT "whatsapp_messages_provider_message_id_unique" UNIQUE("provider_message_id")
);
--> statement-breakpoint
CREATE TABLE "whatsapp_webhook_events" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"provider" varchar(30) NOT NULL,
	"event_type" varchar(80) NOT NULL,
	"event_key" varchar(150) NOT NULL,
	"provider_event_id" varchar(150),
	"occurred_at_provider" timestamp,
	"received_at_server" timestamp NOT NULL,
	"signature_valid" boolean,
	"processing_status" varchar(30) DEFAULT 'RECEIVED' NOT NULL,
	"processing_attempts" integer DEFAULT 0 NOT NULL,
	"processing_error" text,
	"next_retry_at" timestamp,
	"conversation_id" text,
	"message_id" text,
	"lead_id" text,
	"payload" jsonb NOT NULL,
	CONSTRAINT "whatsapp_webhook_events_provider_event_key_unique" UNIQUE("provider","event_key")
);
--> statement-breakpoint
CREATE TABLE "booking_activities" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"booking_id" text NOT NULL,
	"actor_user_id" text,
	"activity_type" varchar(40) NOT NULL,
	"title" varchar(150),
	"body" text,
	"visibility_scope" varchar(20) DEFAULT 'INTERNAL' NOT NULL,
	"activity_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "booking_participants" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"booking_id" text NOT NULL,
	"role" varchar(30) NOT NULL,
	"full_name" varchar(200) NOT NULL,
	"phone_e164" varchar(30),
	"email" varchar(255),
	"nationality" varchar(100),
	"identity_type" varchar(30),
	"identity_no_masked" varchar(60),
	"is_primary_contact" boolean DEFAULT false NOT NULL,
	"is_signatory" boolean DEFAULT false NOT NULL,
	"participant_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "booking_participants_booking_id_participant_order_unique" UNIQUE("booking_id","participant_order")
);
--> statement-breakpoint
CREATE TABLE "booking_payments" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"booking_id" text NOT NULL,
	"payment_type" varchar(30) NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'MYR' NOT NULL,
	"payment_method" varchar(30),
	"payment_status" "payment_status" NOT NULL,
	"received_at" timestamp,
	"verified_at" timestamp,
	"verified_by_user_id" text,
	"reference_no" varchar(120),
	"proof_file_id" text,
	"rejection_reason" text,
	"reason_code" varchar(50),
	"reason_note" text,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "booking_status_history" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"booking_id" text NOT NULL,
	"from_status" "booking_status",
	"to_status" "booking_status" NOT NULL,
	"changed_by_user_id" text,
	"changed_at" timestamp DEFAULT now() NOT NULL,
	"reason_code" varchar(50),
	"reason_note" text,
	"source_event_type" varchar(40)
);
--> statement-breakpoint
CREATE TABLE "booking_units" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"booking_id" text NOT NULL,
	"project_id" text NOT NULL,
	"unit_id" text NOT NULL,
	"reserved_price" numeric(15, 2),
	"booking_fee_allocated_amount" numeric(15, 2),
	"reservation_started_at" timestamp,
	"reservation_expires_at" timestamp,
	"released_at" timestamp,
	"release_reason" text,
	CONSTRAINT "booking_units_booking_id_unique" UNIQUE("booking_id")
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"lead_id" text NOT NULL,
	"project_id" text NOT NULL,
	"booking_code" varchar(50) NOT NULL,
	"status" "booking_status" DEFAULT 'DRAFT' NOT NULL,
	"booking_channel" varchar(30) NOT NULL,
	"submitted_by_user_id" text,
	"assigned_agent_user_id" text,
	"booking_fee_amount" numeric(15, 2),
	"booking_fee_currency" varchar(10) DEFAULT 'MYR' NOT NULL,
	"booking_fee_paid_amount" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"booking_fee_due_at" timestamp,
	"submitted_at" timestamp,
	"approved_at" timestamp,
	"approved_by_user_id" text,
	"rejected_at" timestamp,
	"rejected_by_user_id" text,
	"rejection_reason" text,
	"expired_at" timestamp,
	"cancelled_at" timestamp,
	"cancellation_reason" text,
	"metadata" jsonb,
	CONSTRAINT "bookings_booking_code_unique" UNIQUE("booking_code")
);
--> statement-breakpoint
CREATE TABLE "document_access_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"submission_id" text NOT NULL,
	"booking_id" text NOT NULL,
	"actor_user_id" text,
	"access_type" varchar(30) NOT NULL,
	"access_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" varchar(64),
	"user_agent" text,
	"source_context" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "document_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"booking_id" text NOT NULL,
	"participant_id" text,
	"document_type_id" text NOT NULL,
	"request_status" "document_request_status" NOT NULL,
	"requested_by_user_id" text,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"due_at" timestamp,
	"waived_at" timestamp,
	"waived_by_user_id" text,
	"waive_reason" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "document_submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"booking_id" text NOT NULL,
	"request_id" text,
	"participant_id" text,
	"document_type_id" text NOT NULL,
	"file_id" text NOT NULL,
	"submission_status" "document_submission_status" NOT NULL,
	"uploaded_by_user_id" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"version_no" integer DEFAULT 1 NOT NULL,
	"replaced_by_submission_id" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "document_types" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"code" varchar(50) NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text,
	"category" varchar(40) NOT NULL,
	"allowed_mime_patterns" jsonb,
	"max_file_size_bytes" integer,
	"is_mandatory_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "document_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "document_verification_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"submission_id" text NOT NULL,
	"booking_id" text NOT NULL,
	"verification_status" "document_verification_status" NOT NULL,
	"verified_by_user_id" text,
	"verified_at" timestamp,
	"reason_code" varchar(50),
	"reason_note" text,
	"checklist_json" jsonb
);
--> statement-breakpoint
CREATE TABLE "otp_challenges" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" varchar(120) NOT NULL,
	"phone_e164" varchar(20) NOT NULL,
	"phone_normalized" varchar(20) NOT NULL,
	"purpose" "otp_purpose" NOT NULL,
	"channel" "otp_channel" NOT NULL,
	"otp_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"consumed_at" timestamp,
	"verified_at" timestamp,
	"locked_at" timestamp,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"resend_available_at" timestamp NOT NULL,
	"last_sent_at" timestamp,
	"send_count" integer DEFAULT 0 NOT NULL,
	"request_id" varchar(120),
	"ip_address_hash" varchar(128),
	"user_agent_hash" varchar(128),
	"user_agent" text,
	"user_id" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permission_groups" (
	"id" text PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "permission_groups_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"group_id" text NOT NULL,
	"code" varchar(120) NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" text,
	"module_key" varchar(50) NOT NULL,
	"action_key" varchar(50) NOT NULL,
	"resource_key" varchar(80) NOT NULL,
	"risk_level" varchar(20) DEFAULT 'MEDIUM' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "permissions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"role_id" text NOT NULL,
	"permission_id" text NOT NULL,
	"grant_scope" varchar(20) DEFAULT 'ALLOW' NOT NULL,
	"condition_json" jsonb,
	"granted_by_user_id" text,
	"granted_at" timestamp DEFAULT now() NOT NULL,
	"revoked_at" timestamp,
	"revoked_by_user_id" text,
	"reason_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"permission_id" text NOT NULL,
	"override_scope" varchar(20) NOT NULL,
	"is_temporary" boolean DEFAULT false NOT NULL,
	"effective_from" timestamp,
	"effective_to" timestamp,
	"granted_by_user_id" text,
	"granted_at" timestamp DEFAULT now() NOT NULL,
	"revoked_at" timestamp,
	"revoked_by_user_id" text,
	"reason_code" varchar(50),
	"reason_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_action_approvals" (
	"id" text PRIMARY KEY NOT NULL,
	"action_type" varchar(50) NOT NULL,
	"target_entity_type" varchar(60) NOT NULL,
	"target_entity_id" text,
	"requested_by_user_id" text NOT NULL,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"dedupe_key" varchar(200) NOT NULL,
	"approved_by_user_id" text,
	"approved_at" timestamp,
	"rejected_by_user_id" text,
	"rejected_at" timestamp,
	"expires_at" timestamp,
	"request_reason" text,
	"decision_reason" text,
	"payload_json" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_user_id" text,
	"actor_role_id" text,
	"action_type" varchar(40) NOT NULL,
	"entity_type" varchar(60) NOT NULL,
	"entity_id" text,
	"request_id" varchar(120),
	"trace_id" varchar(120),
	"before_json" jsonb,
	"after_json" jsonb,
	"change_summary" text,
	"source_app" varchar(30) NOT NULL,
	"ip_address" varchar(64),
	"user_agent" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"event_type" varchar(50) NOT NULL,
	"event_status" varchar(20) NOT NULL,
	"provider_id" varchar(60),
	"session_id" text,
	"account_id" text,
	"risk_level" varchar(20) DEFAULT 'LOW' NOT NULL,
	"failure_reason" text,
	"ip_address" varchar(64),
	"user_agent" text,
	"country_code" varchar(10),
	"source_app" varchar(30) NOT NULL,
	"metadata" jsonb,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_flag_overrides" (
	"id" text PRIMARY KEY NOT NULL,
	"feature_flag_id" text NOT NULL,
	"role_id" text,
	"user_id" text,
	"override_enabled" boolean NOT NULL,
	"effective_from" timestamp,
	"effective_to" timestamp,
	"updated_by_user_id" text,
	"reason_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "feature_flag_overrides_role_user_xor_check" CHECK (("feature_flag_overrides"."role_id" is not null and "feature_flag_overrides"."user_id" is null) or ("feature_flag_overrides"."role_id" is null and "feature_flag_overrides"."user_id" is not null))
);
--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"id" text PRIMARY KEY NOT NULL,
	"key" varchar(120) NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" text,
	"category" varchar(50),
	"is_enabled" boolean DEFAULT false NOT NULL,
	"environment" varchar(20) NOT NULL,
	"rollout_mode" varchar(30) DEFAULT 'GLOBAL' NOT NULL,
	"rollout_percentage" integer,
	"prerequisites_json" jsonb,
	"sunset_at" timestamp,
	"updated_by_user_id" text,
	"change_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"key" varchar(120) NOT NULL,
	"value_json" jsonb NOT NULL,
	"value_type" varchar(20) NOT NULL,
	"category" varchar(50) NOT NULL,
	"environment" varchar(20) NOT NULL,
	"is_secret" boolean DEFAULT false NOT NULL,
	"is_read_only" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_by_user_id" text,
	"change_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_referred_by_user_id_users_id_fk" FOREIGN KEY ("referred_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_types" ADD CONSTRAINT "property_types_category_id_property_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."property_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "areas" ADD CONSTRAINT "areas_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regions" ADD CONSTRAINT "regions_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "developers" ADD CONSTRAINT "developers_logo_file_id_files_id_fk" FOREIGN KEY ("logo_file_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_amenities" ADD CONSTRAINT "project_amenities_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_amenities" ADD CONSTRAINT "project_amenities_amenity_id_amenities_id_fk" FOREIGN KEY ("amenity_id") REFERENCES "public"."amenities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_layouts" ADD CONSTRAINT "project_layouts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_layouts" ADD CONSTRAINT "project_layouts_layout_type_id_layout_types_id_fk" FOREIGN KEY ("layout_type_id") REFERENCES "public"."layout_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_layouts" ADD CONSTRAINT "project_layouts_floor_plan_file_id_files_id_fk" FOREIGN KEY ("floor_plan_file_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_media" ADD CONSTRAINT "project_media_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_media" ADD CONSTRAINT "project_media_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_media" ADD CONSTRAINT "project_media_media_type_id_media_types_id_fk" FOREIGN KEY ("media_type_id") REFERENCES "public"."media_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_nearby_places" ADD CONSTRAINT "project_nearby_places_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_phases" ADD CONSTRAINT "project_phases_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_phases" ADD CONSTRAINT "project_phases_construction_status_id_construction_statuses_id_fk" FOREIGN KEY ("construction_status_id") REFERENCES "public"."construction_statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_tags" ADD CONSTRAINT "project_tags_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_tags" ADD CONSTRAINT "project_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_towers" ADD CONSTRAINT "project_towers_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_towers" ADD CONSTRAINT "project_towers_phase_id_project_phases_id_fk" FOREIGN KEY ("phase_id") REFERENCES "public"."project_phases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_developer_id_developers_id_fk" FOREIGN KEY ("developer_id") REFERENCES "public"."developers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_property_category_id_property_categories_id_fk" FOREIGN KEY ("property_category_id") REFERENCES "public"."property_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_property_type_id_property_types_id_fk" FOREIGN KEY ("property_type_id") REFERENCES "public"."property_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_project_status_id_project_statuses_id_fk" FOREIGN KEY ("project_status_id") REFERENCES "public"."project_statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_tenure_type_id_tenure_types_id_fk" FOREIGN KEY ("tenure_type_id") REFERENCES "public"."tenure_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_title_type_id_title_types_id_fk" FOREIGN KEY ("title_type_id") REFERENCES "public"."title_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_featured_file_id_files_id_fk" FOREIGN KEY ("featured_file_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_snapshots" ADD CONSTRAINT "pricing_snapshots_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_snapshots" ADD CONSTRAINT "pricing_snapshots_phase_id_project_phases_id_fk" FOREIGN KEY ("phase_id") REFERENCES "public"."project_phases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_snapshots" ADD CONSTRAINT "pricing_snapshots_tower_id_project_towers_id_fk" FOREIGN KEY ("tower_id") REFERENCES "public"."project_towers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_snapshots" ADD CONSTRAINT "pricing_snapshots_layout_id_project_layouts_id_fk" FOREIGN KEY ("layout_id") REFERENCES "public"."project_layouts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_snapshots" ADD CONSTRAINT "pricing_snapshots_buyer_type_id_buyer_types_id_fk" FOREIGN KEY ("buyer_type_id") REFERENCES "public"."buyer_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_layout_id_project_layouts_id_fk" FOREIGN KEY ("layout_id") REFERENCES "public"."project_layouts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_tower_id_project_towers_id_fk" FOREIGN KEY ("tower_id") REFERENCES "public"."project_towers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_phase_id_project_phases_id_fk" FOREIGN KEY ("phase_id") REFERENCES "public"."project_phases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_position_type_id_unit_positions_id_fk" FOREIGN KEY ("position_type_id") REFERENCES "public"."unit_positions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_lot_type_id_lot_types_id_fk" FOREIGN KEY ("lot_type_id") REFERENCES "public"."lot_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_booking_status_id_booking_statuses_id_fk" FOREIGN KEY ("booking_status_id") REFERENCES "public"."booking_statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_source_id_lead_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."lead_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_phase_id_project_phases_id_fk" FOREIGN KEY ("phase_id") REFERENCES "public"."project_phases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_tower_id_project_towers_id_fk" FOREIGN KEY ("tower_id") REFERENCES "public"."project_towers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_layout_id_project_layouts_id_fk" FOREIGN KEY ("layout_id") REFERENCES "public"."project_layouts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_assignment_id_lead_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."lead_assignments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_assignments" ADD CONSTRAINT "lead_assignments_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_assignments" ADD CONSTRAINT "lead_assignments_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_assignments" ADD CONSTRAINT "lead_assignments_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_assignments" ADD CONSTRAINT "lead_assignments_queue_id_whatsapp_agent_queues_id_fk" FOREIGN KEY ("queue_id") REFERENCES "public"."whatsapp_agent_queues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_assignments" ADD CONSTRAINT "lead_assignments_assigned_by_user_id_users_id_fk" FOREIGN KEY ("assigned_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_assignments" ADD CONSTRAINT "lead_assignments_rule_id_whatsapp_assignment_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."whatsapp_assignment_rules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_status_history" ADD CONSTRAINT "lead_status_history_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_status_history" ADD CONSTRAINT "lead_status_history_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_source_id_lead_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."lead_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_desired_property_category_id_property_categories_id_fk" FOREIGN KEY ("desired_property_category_id") REFERENCES "public"."property_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_desired_property_type_id_property_types_id_fk" FOREIGN KEY ("desired_property_type_id") REFERENCES "public"."property_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_preferred_region_id_regions_id_fk" FOREIGN KEY ("preferred_region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_preferred_area_id_areas_id_fk" FOREIGN KEY ("preferred_area_id") REFERENCES "public"."areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_current_assignee_user_id_users_id_fk" FOREIGN KEY ("current_assignee_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_current_queue_id_whatsapp_agent_queues_id_fk" FOREIGN KEY ("current_queue_id") REFERENCES "public"."whatsapp_agent_queues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_agent_queue_members" ADD CONSTRAINT "whatsapp_agent_queue_members_queue_id_whatsapp_agent_queues_id_fk" FOREIGN KEY ("queue_id") REFERENCES "public"."whatsapp_agent_queues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_agent_queue_members" ADD CONSTRAINT "whatsapp_agent_queue_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_agent_queues" ADD CONSTRAINT "whatsapp_agent_queues_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_agent_queues" ADD CONSTRAINT "whatsapp_agent_queues_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_agent_queues" ADD CONSTRAINT "whatsapp_agent_queues_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_assignment_rules" ADD CONSTRAINT "whatsapp_assignment_rules_match_source_id_lead_sources_id_fk" FOREIGN KEY ("match_source_id") REFERENCES "public"."lead_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_assignment_rules" ADD CONSTRAINT "whatsapp_assignment_rules_match_region_id_regions_id_fk" FOREIGN KEY ("match_region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_assignment_rules" ADD CONSTRAINT "whatsapp_assignment_rules_match_area_id_areas_id_fk" FOREIGN KEY ("match_area_id") REFERENCES "public"."areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_assignment_rules" ADD CONSTRAINT "whatsapp_assignment_rules_match_project_id_projects_id_fk" FOREIGN KEY ("match_project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_assignment_rules" ADD CONSTRAINT "whatsapp_assignment_rules_queue_id_whatsapp_agent_queues_id_fk" FOREIGN KEY ("queue_id") REFERENCES "public"."whatsapp_agent_queues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_assignment_rules" ADD CONSTRAINT "whatsapp_assignment_rules_assign_to_user_id_users_id_fk" FOREIGN KEY ("assign_to_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_assignment_rules" ADD CONSTRAINT "whatsapp_assignment_rules_fallback_queue_id_whatsapp_agent_queues_id_fk" FOREIGN KEY ("fallback_queue_id") REFERENCES "public"."whatsapp_agent_queues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_conversations" ADD CONSTRAINT "whatsapp_conversations_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_conversations" ADD CONSTRAINT "whatsapp_conversations_inquiry_id_inquiries_id_fk" FOREIGN KEY ("inquiry_id") REFERENCES "public"."inquiries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_conversations" ADD CONSTRAINT "whatsapp_conversations_queue_id_whatsapp_agent_queues_id_fk" FOREIGN KEY ("queue_id") REFERENCES "public"."whatsapp_agent_queues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_conversations" ADD CONSTRAINT "whatsapp_conversations_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_delivery_events" ADD CONSTRAINT "whatsapp_delivery_events_message_id_whatsapp_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."whatsapp_messages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_conversation_id_whatsapp_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."whatsapp_conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_media_file_id_files_id_fk" FOREIGN KEY ("media_file_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_webhook_events" ADD CONSTRAINT "whatsapp_webhook_events_conversation_id_whatsapp_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."whatsapp_conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_webhook_events" ADD CONSTRAINT "whatsapp_webhook_events_message_id_whatsapp_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."whatsapp_messages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_webhook_events" ADD CONSTRAINT "whatsapp_webhook_events_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_activities" ADD CONSTRAINT "booking_activities_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_activities" ADD CONSTRAINT "booking_activities_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_participants" ADD CONSTRAINT "booking_participants_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_payments" ADD CONSTRAINT "booking_payments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_payments" ADD CONSTRAINT "booking_payments_verified_by_user_id_users_id_fk" FOREIGN KEY ("verified_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_payments" ADD CONSTRAINT "booking_payments_proof_file_id_files_id_fk" FOREIGN KEY ("proof_file_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_status_history" ADD CONSTRAINT "booking_status_history_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_status_history" ADD CONSTRAINT "booking_status_history_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_units" ADD CONSTRAINT "booking_units_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_units" ADD CONSTRAINT "booking_units_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_units" ADD CONSTRAINT "booking_units_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_submitted_by_user_id_users_id_fk" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_assigned_agent_user_id_users_id_fk" FOREIGN KEY ("assigned_agent_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_rejected_by_user_id_users_id_fk" FOREIGN KEY ("rejected_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_access_logs" ADD CONSTRAINT "document_access_logs_submission_id_document_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."document_submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_access_logs" ADD CONSTRAINT "document_access_logs_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_access_logs" ADD CONSTRAINT "document_access_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_requests" ADD CONSTRAINT "document_requests_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_requests" ADD CONSTRAINT "document_requests_participant_id_booking_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."booking_participants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_requests" ADD CONSTRAINT "document_requests_document_type_id_document_types_id_fk" FOREIGN KEY ("document_type_id") REFERENCES "public"."document_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_requests" ADD CONSTRAINT "document_requests_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_requests" ADD CONSTRAINT "document_requests_waived_by_user_id_users_id_fk" FOREIGN KEY ("waived_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_submissions" ADD CONSTRAINT "document_submissions_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_submissions" ADD CONSTRAINT "document_submissions_request_id_document_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."document_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_submissions" ADD CONSTRAINT "document_submissions_participant_id_booking_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."booking_participants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_submissions" ADD CONSTRAINT "document_submissions_document_type_id_document_types_id_fk" FOREIGN KEY ("document_type_id") REFERENCES "public"."document_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_submissions" ADD CONSTRAINT "document_submissions_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_submissions" ADD CONSTRAINT "document_submissions_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_submissions" ADD CONSTRAINT "document_submissions_replaced_by_submission_id_document_submissions_id_fk" FOREIGN KEY ("replaced_by_submission_id") REFERENCES "public"."document_submissions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_verification_logs" ADD CONSTRAINT "document_verification_logs_submission_id_document_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."document_submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_verification_logs" ADD CONSTRAINT "document_verification_logs_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_verification_logs" ADD CONSTRAINT "document_verification_logs_verified_by_user_id_users_id_fk" FOREIGN KEY ("verified_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "otp_challenges" ADD CONSTRAINT "otp_challenges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_group_id_permission_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."permission_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_granted_by_user_id_users_id_fk" FOREIGN KEY ("granted_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_revoked_by_user_id_users_id_fk" FOREIGN KEY ("revoked_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_granted_by_user_id_users_id_fk" FOREIGN KEY ("granted_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_revoked_by_user_id_users_id_fk" FOREIGN KEY ("revoked_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_action_approvals" ADD CONSTRAINT "admin_action_approvals_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_action_approvals" ADD CONSTRAINT "admin_action_approvals_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_action_approvals" ADD CONSTRAINT "admin_action_approvals_rejected_by_user_id_users_id_fk" FOREIGN KEY ("rejected_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_role_id_roles_id_fk" FOREIGN KEY ("actor_role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_audit_logs" ADD CONSTRAINT "auth_audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_audit_logs" ADD CONSTRAINT "auth_audit_logs_session_id_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."session"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_audit_logs" ADD CONSTRAINT "auth_audit_logs_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_flag_overrides" ADD CONSTRAINT "feature_flag_overrides_feature_flag_id_feature_flags_id_fk" FOREIGN KEY ("feature_flag_id") REFERENCES "public"."feature_flags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_flag_overrides" ADD CONSTRAINT "feature_flag_overrides_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_flag_overrides" ADD CONSTRAINT "feature_flag_overrides_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_flag_overrides" ADD CONSTRAINT "feature_flag_overrides_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "areas_region_slug_idx" ON "areas" USING btree ("region_id","slug");--> statement-breakpoint
CREATE INDEX "regions_state_slug_idx" ON "regions" USING btree ("state_id","slug");--> statement-breakpoint
CREATE INDEX "files_provider_bucket_key_idx" ON "files" USING btree ("provider","bucket","key");--> statement-breakpoint
CREATE INDEX "files_scan_status_idx" ON "files" USING btree ("scan_status");--> statement-breakpoint
CREATE INDEX "files_visibility_scope_idx" ON "files" USING btree ("visibility_scope");--> statement-breakpoint
CREATE INDEX "files_uploaded_by_user_idx" ON "files" USING btree ("uploaded_by_user_id");--> statement-breakpoint
CREATE INDEX "project_media_project_idx" ON "project_media" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_nearby_places_project_idx" ON "project_nearby_places" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_nearby_places_category_idx" ON "project_nearby_places" USING btree ("project_id","category");--> statement-breakpoint
CREATE INDEX "projects_status_idx" ON "projects" USING btree ("project_status_id");--> statement-breakpoint
CREATE INDEX "projects_type_idx" ON "projects" USING btree ("property_type_id");--> statement-breakpoint
CREATE INDEX "projects_region_idx" ON "projects" USING btree ("region_id");--> statement-breakpoint
CREATE INDEX "projects_area_idx" ON "projects" USING btree ("area_id");--> statement-breakpoint
CREATE INDEX "pricing_snapshots_project_idx" ON "pricing_snapshots" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "pricing_snapshots_snapshot_date_idx" ON "pricing_snapshots" USING btree ("snapshot_date");--> statement-breakpoint
CREATE INDEX "pricing_snapshots_query_idx" ON "pricing_snapshots" USING btree ("project_id","phase_id","tower_id","layout_id","buyer_type_id","snapshot_date");--> statement-breakpoint
CREATE INDEX "units_project_idx" ON "units" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "units_tower_idx" ON "units" USING btree ("tower_id");--> statement-breakpoint
CREATE INDEX "units_layout_idx" ON "units" USING btree ("layout_id");--> statement-breakpoint
CREATE INDEX "units_booking_status_idx" ON "units" USING btree ("booking_status_id");--> statement-breakpoint
CREATE INDEX "inquiries_lead_received_idx" ON "inquiries" USING btree ("lead_id","received_at");--> statement-breakpoint
CREATE INDEX "inquiries_project_received_idx" ON "inquiries" USING btree ("project_id","received_at");--> statement-breakpoint
CREATE INDEX "lead_activities_lead_created_idx" ON "lead_activities" USING btree ("lead_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "lead_assignments_current_uniq" ON "lead_assignments" USING btree ("lead_id") WHERE "lead_assignments"."is_current" = true;--> statement-breakpoint
CREATE INDEX "lead_assignments_lead_effective_from_idx" ON "lead_assignments" USING btree ("lead_id","effective_from");--> statement-breakpoint
CREATE INDEX "lead_assignments_to_user_current_idx" ON "lead_assignments" USING btree ("to_user_id","is_current");--> statement-breakpoint
CREATE INDEX "lead_sources_channel_idx" ON "lead_sources" USING btree ("channel");--> statement-breakpoint
CREATE INDEX "lead_sources_priority_idx" ON "lead_sources" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "lead_status_history_lead_changed_at_idx" ON "lead_status_history" USING btree ("lead_id","changed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "leads_phone_normalized_active_uniq" ON "leads" USING btree ("primary_phone_normalized") WHERE "leads"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "leads_source_idx" ON "leads" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "leads_status_updated_idx" ON "leads" USING btree ("current_status","updated_at");--> statement-breakpoint
CREATE INDEX "leads_assignee_status_idx" ON "leads" USING btree ("current_assignee_user_id","current_status");--> statement-breakpoint
CREATE INDEX "leads_queue_status_idx" ON "leads" USING btree ("current_queue_id","current_status");--> statement-breakpoint
CREATE INDEX "whatsapp_queue_members_queue_active_idx" ON "whatsapp_agent_queue_members" USING btree ("queue_id","is_active");--> statement-breakpoint
CREATE INDEX "whatsapp_queue_members_user_active_idx" ON "whatsapp_agent_queue_members" USING btree ("user_id","is_active");--> statement-breakpoint
CREATE INDEX "whatsapp_queue_members_last_assigned_at_idx" ON "whatsapp_agent_queue_members" USING btree ("last_assigned_at");--> statement-breakpoint
CREATE INDEX "whatsapp_agent_queues_active_strategy_idx" ON "whatsapp_agent_queues" USING btree ("is_active","assignment_strategy");--> statement-breakpoint
CREATE INDEX "whatsapp_assignment_rules_active_priority_idx" ON "whatsapp_assignment_rules" USING btree ("is_active","priority");--> statement-breakpoint
CREATE UNIQUE INDEX "whatsapp_conversations_open_provider_phone_uniq" ON "whatsapp_conversations" USING btree ("provider","customer_phone_normalized") WHERE "whatsapp_conversations"."is_open" = true;--> statement-breakpoint
CREATE INDEX "whatsapp_conversations_lead_open_idx" ON "whatsapp_conversations" USING btree ("lead_id","is_open");--> statement-breakpoint
CREATE INDEX "whatsapp_conversations_owner_open_idx" ON "whatsapp_conversations" USING btree ("owner_user_id","is_open");--> statement-breakpoint
CREATE UNIQUE INDEX "whatsapp_delivery_events_message_provider_event_uniq" ON "whatsapp_delivery_events" USING btree ("message_id","provider_event_id") WHERE "whatsapp_delivery_events"."provider_event_id" is not null;--> statement-breakpoint
CREATE INDEX "whatsapp_delivery_events_message_created_idx" ON "whatsapp_delivery_events" USING btree ("message_id","created_at");--> statement-breakpoint
CREATE INDEX "whatsapp_messages_conversation_created_idx" ON "whatsapp_messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "whatsapp_messages_lead_created_idx" ON "whatsapp_messages" USING btree ("lead_id","created_at");--> statement-breakpoint
CREATE INDEX "whatsapp_webhook_events_processing_received_idx" ON "whatsapp_webhook_events" USING btree ("processing_status","received_at_server");--> statement-breakpoint
CREATE INDEX "whatsapp_webhook_events_next_retry_idx" ON "whatsapp_webhook_events" USING btree ("next_retry_at");--> statement-breakpoint
CREATE INDEX "booking_activities_booking_activity_at_idx" ON "booking_activities" USING btree ("booking_id","activity_at");--> statement-breakpoint
CREATE INDEX "booking_participants_booking_role_idx" ON "booking_participants" USING btree ("booking_id","role");--> statement-breakpoint
CREATE INDEX "booking_payments_booking_status_idx" ON "booking_payments" USING btree ("booking_id","payment_status");--> statement-breakpoint
CREATE INDEX "booking_payments_reference_no_idx" ON "booking_payments" USING btree ("reference_no");--> statement-breakpoint
CREATE INDEX "booking_status_history_booking_changed_at_idx" ON "booking_status_history" USING btree ("booking_id","changed_at");--> statement-breakpoint
CREATE INDEX "booking_units_unit_idx" ON "booking_units" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "booking_units_booking_expiry_idx" ON "booking_units" USING btree ("booking_id","reservation_expires_at");--> statement-breakpoint
CREATE INDEX "bookings_status_created_idx" ON "bookings" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "bookings_lead_created_idx" ON "bookings" USING btree ("lead_id","created_at");--> statement-breakpoint
CREATE INDEX "bookings_project_status_idx" ON "bookings" USING btree ("project_id","status");--> statement-breakpoint
CREATE INDEX "bookings_assigned_status_idx" ON "bookings" USING btree ("assigned_agent_user_id","status");--> statement-breakpoint
CREATE INDEX "document_access_logs_submission_access_at_idx" ON "document_access_logs" USING btree ("submission_id","access_at");--> statement-breakpoint
CREATE INDEX "document_access_logs_booking_access_at_idx" ON "document_access_logs" USING btree ("booking_id","access_at");--> statement-breakpoint
CREATE INDEX "document_requests_booking_status_idx" ON "document_requests" USING btree ("booking_id","request_status");--> statement-breakpoint
CREATE INDEX "document_requests_participant_status_idx" ON "document_requests" USING btree ("participant_id","request_status");--> statement-breakpoint
CREATE UNIQUE INDEX "document_requests_participant_open_uniq" ON "document_requests" USING btree ("booking_id","participant_id","document_type_id") WHERE "document_requests"."participant_id" is not null and "document_requests"."request_status" != 'WAIVED';--> statement-breakpoint
CREATE UNIQUE INDEX "document_requests_booking_open_uniq" ON "document_requests" USING btree ("booking_id","document_type_id") WHERE "document_requests"."participant_id" is null and "document_requests"."request_status" != 'WAIVED';--> statement-breakpoint
CREATE INDEX "document_submissions_booking_status_idx" ON "document_submissions" USING btree ("booking_id","submission_status");--> statement-breakpoint
CREATE INDEX "document_submissions_request_version_idx" ON "document_submissions" USING btree ("request_id","version_no");--> statement-breakpoint
CREATE INDEX "document_submissions_file_id_idx" ON "document_submissions" USING btree ("file_id");--> statement-breakpoint
CREATE UNIQUE INDEX "document_submissions_request_version_uniq" ON "document_submissions" USING btree ("request_id","version_no") WHERE "document_submissions"."request_id" is not null;--> statement-breakpoint
CREATE INDEX "document_types_active_category_idx" ON "document_types" USING btree ("is_active","category");--> statement-breakpoint
CREATE INDEX "document_verification_logs_submission_created_idx" ON "document_verification_logs" USING btree ("submission_id","created_at");--> statement-breakpoint
CREATE INDEX "otp_challenges_phone_created_idx" ON "otp_challenges" USING btree ("phone_normalized","created_at");--> statement-breakpoint
CREATE INDEX "otp_challenges_identifier_created_idx" ON "otp_challenges" USING btree ("identifier","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "otp_challenges_identifier_uniq" ON "otp_challenges" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "otp_challenges_expires_at_idx" ON "otp_challenges" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "otp_challenges_request_id_idx" ON "otp_challenges" USING btree ("request_id");--> statement-breakpoint
CREATE UNIQUE INDEX "otp_challenges_active_phone_purpose_uniq" ON "otp_challenges" USING btree ("phone_normalized","purpose") WHERE "otp_challenges"."consumed_at" is null and "otp_challenges"."locked_at" is null;--> statement-breakpoint
CREATE INDEX "permission_groups_active_sort_idx" ON "permission_groups" USING btree ("is_active","sort_order");--> statement-breakpoint
CREATE INDEX "permissions_module_action_active_idx" ON "permissions" USING btree ("module_key","action_key","is_active");--> statement-breakpoint
CREATE INDEX "permissions_group_active_idx" ON "permissions" USING btree ("group_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "role_permissions_active_role_permission_uniq" ON "role_permissions" USING btree ("role_id","permission_id") WHERE "role_permissions"."revoked_at" is null;--> statement-breakpoint
CREATE INDEX "role_permissions_role_revoked_idx" ON "role_permissions" USING btree ("role_id","revoked_at");--> statement-breakpoint
CREATE INDEX "role_permissions_permission_revoked_idx" ON "role_permissions" USING btree ("permission_id","revoked_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_permissions_active_user_permission_uniq" ON "user_permissions" USING btree ("user_id","permission_id") WHERE "user_permissions"."revoked_at" is null;--> statement-breakpoint
CREATE INDEX "user_permissions_user_effective_idx" ON "user_permissions" USING btree ("user_id","effective_to");--> statement-breakpoint
CREATE INDEX "user_permissions_permission_effective_idx" ON "user_permissions" USING btree ("permission_id","effective_to");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_action_approvals_pending_dedupe_uniq" ON "admin_action_approvals" USING btree ("dedupe_key") WHERE "admin_action_approvals"."status" = 'PENDING';--> statement-breakpoint
CREATE INDEX "admin_action_approvals_status_requested_idx" ON "admin_action_approvals" USING btree ("status","requested_at");--> statement-breakpoint
CREATE INDEX "admin_action_approvals_requested_by_status_idx" ON "admin_action_approvals" USING btree ("requested_by_user_id","status");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_created_idx" ON "audit_logs" USING btree ("entity_type","entity_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_created_idx" ON "audit_logs" USING btree ("actor_user_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_action_created_idx" ON "audit_logs" USING btree ("action_type","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_source_created_idx" ON "audit_logs" USING btree ("source_app","created_at");--> statement-breakpoint
CREATE INDEX "auth_audit_logs_user_occurred_idx" ON "auth_audit_logs" USING btree ("user_id","occurred_at");--> statement-breakpoint
CREATE INDEX "auth_audit_logs_event_occurred_idx" ON "auth_audit_logs" USING btree ("event_type","occurred_at");--> statement-breakpoint
CREATE INDEX "auth_audit_logs_status_occurred_idx" ON "auth_audit_logs" USING btree ("event_status","occurred_at");--> statement-breakpoint
CREATE INDEX "auth_audit_logs_risk_occurred_idx" ON "auth_audit_logs" USING btree ("risk_level","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "feature_flag_overrides_active_role_uniq" ON "feature_flag_overrides" USING btree ("feature_flag_id","role_id") WHERE "feature_flag_overrides"."role_id" is not null and "feature_flag_overrides"."effective_to" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "feature_flag_overrides_active_user_uniq" ON "feature_flag_overrides" USING btree ("feature_flag_id","user_id") WHERE "feature_flag_overrides"."user_id" is not null and "feature_flag_overrides"."effective_to" is null;--> statement-breakpoint
CREATE INDEX "feature_flag_overrides_flag_effective_to_idx" ON "feature_flag_overrides" USING btree ("feature_flag_id","effective_to");--> statement-breakpoint
CREATE UNIQUE INDEX "feature_flags_active_key_env_uniq" ON "feature_flags" USING btree ("key","environment") WHERE "feature_flags"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "feature_flags_env_enabled_idx" ON "feature_flags" USING btree ("environment","is_enabled");--> statement-breakpoint
CREATE INDEX "feature_flags_category_env_idx" ON "feature_flags" USING btree ("category","environment");--> statement-breakpoint
CREATE UNIQUE INDEX "system_settings_active_key_env_uniq" ON "system_settings" USING btree ("key","environment") WHERE "system_settings"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "system_settings_category_env_active_idx" ON "system_settings" USING btree ("category","environment","is_active");