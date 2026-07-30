ALTER TABLE "assignments" ALTER COLUMN "theme_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "course_content_items" ALTER COLUMN "theme_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "quizzes" ALTER COLUMN "theme_id" SET NOT NULL;