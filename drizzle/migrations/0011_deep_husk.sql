ALTER TABLE "students" ADD COLUMN "day_type" text DEFAULT 'full_day' NOT NULL;--> statement-breakpoint
ALTER TABLE "fee_structures" ADD COLUMN "day_type" text;