ALTER TABLE "payments" ADD COLUMN "is_verified" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "proof_storage_key" text;