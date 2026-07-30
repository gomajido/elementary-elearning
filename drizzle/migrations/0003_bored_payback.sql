ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_username_unique" UNIQUE("username");--> statement-breakpoint
-- Backfill: existing teacher accounts can now also log in with their NIP
-- (employee number), same as newly-registered teachers.
UPDATE "users" SET "username" = "teachers"."employee_number"
FROM "teachers"
WHERE "teachers"."user_id" = "users"."id" AND "users"."username" IS NULL;