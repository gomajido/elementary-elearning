-- Every existing course gets one default theme; existing content/assignments/
-- quizzes are pointed at it. Required before theme_id can be made NOT NULL.
INSERT INTO "themes" ("id", "course_id", "title", "order_index", "school_id", "created_at", "updated_at")
SELECT gen_random_uuid(), "id", 'Bab 1', 0, "school_id", now(), now()
FROM "courses";
--> statement-breakpoint
UPDATE "course_content_items" ci
SET "theme_id" = t."id"
FROM "themes" t
WHERE t."course_id" = ci."course_id" AND ci."theme_id" IS NULL;
--> statement-breakpoint
UPDATE "assignments" a
SET "theme_id" = t."id"
FROM "themes" t
WHERE t."course_id" = a."course_id" AND a."theme_id" IS NULL;
--> statement-breakpoint
UPDATE "quizzes" q
SET "theme_id" = t."id"
FROM "themes" t
WHERE t."course_id" = q."course_id" AND q."theme_id" IS NULL;