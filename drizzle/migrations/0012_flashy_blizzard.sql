CREATE TABLE "teacher_attendance_records" (
	"id" text PRIMARY KEY NOT NULL,
	"teacher_id" text NOT NULL,
	"date" text NOT NULL,
	"status" text NOT NULL,
	"check_in_time" text,
	"check_out_time" text,
	"imported_by_user_id" text,
	"notes" text,
	"school_id" text DEFAULT 'default' NOT NULL,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "teacher_attendance_records_teacher_id_date_unique" UNIQUE("teacher_id","date")
);
--> statement-breakpoint
ALTER TABLE "attendance_records" ALTER COLUMN "recorded_by_teacher_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "fingerprint_id" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "fingerprint_id" text;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD COLUMN "check_in_time" text;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD COLUMN "check_out_time" text;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD COLUMN "imported_by_user_id" text;--> statement-breakpoint
ALTER TABLE "teacher_attendance_records" ADD CONSTRAINT "teacher_attendance_records_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_attendance_records" ADD CONSTRAINT "teacher_attendance_records_imported_by_user_id_users_id_fk" FOREIGN KEY ("imported_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_imported_by_user_id_users_id_fk" FOREIGN KEY ("imported_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_fingerprint_id_unique" UNIQUE("fingerprint_id");--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_fingerprint_id_unique" UNIQUE("fingerprint_id");