CREATE TABLE "media" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"storage_key" text NOT NULL,
	"content_type" text NOT NULL,
	"school_id" text DEFAULT 'default' NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "media_entity_type_entity_id_unique" UNIQUE("entity_type","entity_id")
);
--> statement-breakpoint
ALTER TABLE "academic_years" ADD COLUMN "updated_at" timestamp NOT NULL DEFAULT now();--> statement-breakpoint
ALTER TABLE "academic_years" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "classes" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "subjects" ADD COLUMN "updated_at" timestamp NOT NULL DEFAULT now();--> statement-breakpoint
ALTER TABLE "subjects" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "guardians" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "fee_structures" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "teachers" DROP COLUMN "photo_r2_key";--> statement-breakpoint
ALTER TABLE "students" DROP COLUMN "photo_r2_key";