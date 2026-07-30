ALTER TABLE "assignments" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "course_content_items" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "themes" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "quizzes" ADD COLUMN "deleted_at" timestamp;