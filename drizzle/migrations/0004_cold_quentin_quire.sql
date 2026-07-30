ALTER TABLE "users" ADD COLUMN "roles" text[];--> statement-breakpoint
-- Backfill: roles[0] becomes the primary role, preserving every existing
-- account's role exactly (single-element array — no grants existed before
-- this migration).
UPDATE "users" SET "roles" = ARRAY["role"]::text[];--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "roles" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "role";